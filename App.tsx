import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Task, TeamMember, TaskStatus } from './types';
import { TRANSLATIONS } from './constants';
import { fetchTeamMembers, subscribeToTeamMembers, unsubscribeFromTeamMembers } from './services/teamMemberService';
import TaskModal from './components/TaskModal';
import WorkloadChart from './components/WorkloadChart';
import CalendarView from './components/CalendarView';
import Login from './components/Login';
//import { generateMorningBriefing } from './services/geminiService';
import { generateMorningBriefing } from './services/ollamaService.ts';
import { fetchTasks, saveTask } from './services/storageService';
import { getCurrentUser, logout as authLogout, isAuthenticated, convertToTeamMember, onAuthStateChange } from './services/authService';
import { subscribeToTasks, unsubscribeFromTasks } from './services/realtimeService';
import { createErrorMessage } from './services/errorHandler';
import { 
  LayoutDashboard, 
  ListTodo, 
  Plus, 
  UserCircle, 
  LogOut, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Sparkles,
  Download
} from 'lucide-react';

const App: React.FC = () => {
  // --- Authentication State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  
  // --- App State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks'>('dashboard');
  const [lang, setLang] = useState<'en' | 'zh'>('zh');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // AI State
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  const t = TRANSLATIONS[lang];

  // --- Refs for subscription management ---
  const tasksUnsubscribeRef = useRef<(() => void) | null>(null);
  const membersUnsubscribeRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setupSubscriptions = useCallback(() => {
    // Clean up existing subscriptions first
    if (tasksUnsubscribeRef.current) {
      tasksUnsubscribeRef.current();
      tasksUnsubscribeRef.current = null;
    }
    if (membersUnsubscribeRef.current) {
      membersUnsubscribeRef.current();
      membersUnsubscribeRef.current = null;
    }
    unsubscribeFromTasks();
    unsubscribeFromTeamMembers();

    // Setup new subscriptions
    tasksUnsubscribeRef.current = subscribeToTasks((updatedTasks) => {
      setTasks(updatedTasks);
    });
    
    membersUnsubscribeRef.current = subscribeToTeamMembers((updatedMembers) => {
      setTeamMembers(updatedMembers);
    });
  }, []);

  // --- Check authentication on mount and setup realtime ---
  useEffect(() => {
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const initializeApp = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[App] 开始初始化应用...');
        
        // 添加超时保护（10秒）
        const timeoutPromise = new Promise((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            reject(new Error('初始化超时：请检查网络连接和 Supabase 配置'));
          }, 10000);
        });

        // isAuthenticated() 内部已有超时保护（5秒），这里直接调用
        console.log('[App] 检查认证状态...');
        const authenticated = await isAuthenticated();
        console.log('[App] 认证状态:', authenticated);
        
        if (authenticated) {
          console.log('[App] 用户已认证，获取用户信息...');
          // getCurrentUser() 内部已有超时保护（5秒），这里直接调用
          const user = await getCurrentUser();
          
          if (!user) {
            console.error('[App] 无法获取当前用户');
            setError(createErrorMessage(new Error('Failed to get current user'), lang, 'initialization'));
            setIsLoggedIn(false);
            setLoading(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            return;
          }

          if (!user.teamMember) {
            console.error('[App] 用户没有关联的团队成员记录');
            setError(createErrorMessage(
              new Error('User team member not found. Please contact administrator.'),
              lang,
              'initialization'
            ));
            setIsLoggedIn(false);
            setLoading(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            return;
          }

          console.log('[App] 设置用户状态...');
          setLoggedInUser(user);
          const member = convertToTeamMember(user.teamMember);
          setCurrentUser(member);
          setIsLoggedIn(true);
          
          // Load team members and tasks from database
          // 添加总体超时保护（15秒）
          try {
            console.log('[App] 加载团队成员和任务数据...');
            const dataTimeoutPromise = new Promise<never>((_, reject) => {
              const timeoutId = setTimeout(() => {
                reject(new Error('数据加载超时：请检查网络连接'));
              }, 15000);
              // 存储 timeoutId 以便清理
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              timeoutRef.current = timeoutId;
            });

            const [members, userTasks] = await Promise.race([
              Promise.all([
                fetchTeamMembers(),
                fetchTasks()
              ]),
              dataTimeoutPromise
            ]) as [TeamMember[], Task[]];
            
            console.log('[App] 数据加载成功:', { membersCount: members.length, tasksCount: userTasks.length });
            setTeamMembers(members);
            setTasks(userTasks);
            
            // Setup realtime subscriptions
            console.log('[App] 设置实时订阅...');
            setupSubscriptions();
            setLoading(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          } catch (dataError: any) {
            console.error('[App] 数据加载失败:', dataError);
            setError(createErrorMessage(dataError, lang, 'dataLoading'));
            // Still allow user to see the app, but with limited functionality
            setTeamMembers([]);
            setTasks([]);
            setLoading(false);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }
        } else {
          console.log('[App] 用户未认证，显示登录页面');
          setIsLoggedIn(false);
          setLoading(false);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
      } catch (err: any) {
        console.error('[App] 初始化异常:', err);
        setError(createErrorMessage(err, lang, 'initialization'));
        setIsLoggedIn(false);
        setLoading(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    };

    initializeApp();

    // Listen for auth state changes
    authSubscription = onAuthStateChange(async (user) => {
      try {
        if (user) {
          // 用户存在（即使 teamMember 可能为 null，等待异步更新）
          setLoggedInUser(user);
          
          if (user.teamMember) {
            // 有完整的 teamMember 信息
            const member = convertToTeamMember(user.teamMember);
            setCurrentUser(member);
            setIsLoggedIn(true);
            
            try {
              const [members, userTasks] = await Promise.all([
                fetchTeamMembers(),
                fetchTasks()
              ]);
              setTeamMembers(members);
              setTasks(userTasks);
              
              // Setup realtime subscriptions (will clean up old ones first)
              setupSubscriptions();
            } catch (dataError) {
              setError(createErrorMessage(dataError, lang, 'dataLoading'));
              setTeamMembers([]);
              setTasks([]);
            }
          } else {
            // teamMember 为 null（可能是超时导致的 fallback user），保持当前状态，等待异步更新
            // 不改变 isLoggedIn 和 currentUser，避免误登出
            console.log('[App] 收到用户但 teamMember 为空，等待异步更新...');
          }
        } else {
          // 用户为 null，真正登出
          setIsLoggedIn(false);
          setCurrentUser(null);
          setTasks([]);
          setTeamMembers([]);
          // Clean up subscriptions
          if (tasksUnsubscribeRef.current) {
            tasksUnsubscribeRef.current();
            tasksUnsubscribeRef.current = null;
          }
          if (membersUnsubscribeRef.current) {
            membersUnsubscribeRef.current();
            membersUnsubscribeRef.current = null;
          }
          unsubscribeFromTasks();
          unsubscribeFromTeamMembers();
        }
      } catch (err) {
        setError(createErrorMessage(err, lang, 'authStateChange'));
      }
    });

    return () => {
      console.log('[App] 清理订阅和超时...');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (authSubscription) {
        authSubscription.data.subscription.unsubscribe();
      }
      if (tasksUnsubscribeRef.current) {
        tasksUnsubscribeRef.current();
        tasksUnsubscribeRef.current = null;
      }
      if (membersUnsubscribeRef.current) {
        membersUnsubscribeRef.current();
        membersUnsubscribeRef.current = null;
      }
      unsubscribeFromTasks();
      unsubscribeFromTeamMembers();
    };
  }, [setupSubscriptions, lang]);

  // --- Login Handler ---
  const handleLoginSuccess = async (user: any) => {
    try {
      setError(null);
      setLoading(true);
      
      if (user && user.teamMember) {
        setLoggedInUser(user);
        const member = convertToTeamMember(user.teamMember);
        setCurrentUser(member);
        setIsLoggedIn(true);
        
        // Load team members and tasks from database
        const [members, userTasks] = await Promise.all([
          fetchTeamMembers(),
          fetchTasks()
        ]);
        setTeamMembers(members);
        setTasks(userTasks);
        setLoading(false);
        
        // Setup realtime subscriptions (using the same function as initialization)
        setupSubscriptions();
      } else {
        setError(createErrorMessage(new Error('User team member not found'), lang, 'login'));
        setIsLoggedIn(false);
        setLoading(false);
      }
    } catch (err) {
      setError(createErrorMessage(err, lang, 'login'));
      setIsLoggedIn(false);
      setLoading(false);
    }
  };

  // --- Logout Handler ---
  const handleLogout = async () => {
    try {
      await authLogout();
      setIsLoggedIn(false);
      setLoggedInUser(null);
      setCurrentUser(null);
      setTasks([]);
      setTeamMembers([]);
      setBriefing(null);
      setError(null);
      // Clean up subscriptions
      if (tasksUnsubscribeRef.current) {
        tasksUnsubscribeRef.current();
        tasksUnsubscribeRef.current = null;
      }
      if (membersUnsubscribeRef.current) {
        membersUnsubscribeRef.current();
        membersUnsubscribeRef.current = null;
      }
      unsubscribeFromTasks();
      unsubscribeFromTeamMembers();
    } catch (err) {
      setError(createErrorMessage(err, lang, 'logout'));
    }
  };

  // --- Handlers ---
  const handleSaveTask = async (updatedTask: Task) => {
    try {
      setError(null);
      // Save to database
      const savedTask = await saveTask(updatedTask);
      if (savedTask) {
        // Update local state (realtime will also update, but optimistic update is better UX)
        setTasks(prev => {
          const exists = prev.find(t => t.id === savedTask.id);
          if (exists) {
            return prev.map(t => t.id === savedTask.id ? savedTask : t);
          } else {
            return [...prev, savedTask];
          }
        });
      }
    } catch (err) {
      setError(createErrorMessage(err, lang, 'saveTask'));
    }
  };

  const handleCreateNew = () => {
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const generateBriefing = async () => {
    try {
      setLoadingBriefing(true);
      setError(null);
      const text = await generateMorningBriefing(tasks, teamMembers, lang);
      setBriefing(text);
    } catch (err) {
      setError(createErrorMessage(err, lang, 'generateBriefing'));
      setBriefing(lang === 'zh' ? '生成简报时发生错误' : 'Error generating briefing');
    } finally {
      setLoadingBriefing(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Task ID', 'Project Number', 'Batch Info', 'Project Owner', 'Source',
      'Priority', 'Status', 'Assignee', 'Start Date', 'Deadline',
      'Completion Date', 'Progress (Steps Completed/8)'
    ];

    const rows = tasks.map(t => {
      const assigneeName = teamMembers.find(m => m.id === t.assigneeId)?.name || 'Unassigned';
      const completedSteps = t.progress.filter(p => p.isCompleted).length;
      return [
        t.id,
        t.projectNumber,
        t.batchInfo,
        t.projectOwner,
        t.source,
        t.priority,
        t.status,
        assigneeName,
        t.startDate,
        t.deadlineDate,
        t.completionDate || '',
        completedSteps
      ].map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rs_filling_tasks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Show Login if not authenticated ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">{lang === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} lang={lang} />;
  }

  // --- Derived Stats ---
  const myTasks = tasks.filter(t => t.assigneeId === currentUser.id);
  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING);
  const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS);
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);

  const StatCard = ({ title, count, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{count}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-white text-xl font-bold tracking-tight">{t.appTitle}</h1>
          <p className="text-xs text-slate-500 mt-1">{t.appSubtitle}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} className="mr-3" />
            {t.dashboard}
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <ListTodo size={20} className="mr-3" />
            {t.allTasks}
          </button>
        </nav>

        {/* User & Language Switcher */}
        <div className="p-4 border-t border-slate-800 space-y-4">
           {/* Language Switcher */}
           <div>
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Language / 语言</p>
            <div className="flex bg-slate-800 rounded p-1">
              <button 
                onClick={() => setLang('en')}
                className={`flex-1 text-xs py-1 rounded transition-colors ${lang === 'en' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLang('zh')}
                className={`flex-1 text-xs py-1 rounded transition-colors ${lang === 'zh' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                中文
              </button>
            </div>
          </div>

          <div>
            <div className="mb-3 p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <UserCircle size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-white">{currentUser.name}</span>
              </div>
              <p className="text-xs text-slate-400">{t.roles[currentUser.role]}</p>
              <p className="text-xs text-slate-500 mt-1">@{loggedInUser?.username}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-600 text-white text-sm p-2 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              {lang === 'zh' ? '登出' : 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}
        
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' ? `${t.welcomeBack}, ${currentUser.name.split(' ')[0]}` : t.taskManagement}
            </h2>
            <p className="text-slate-500 text-sm">{t.todayIs} {new Date().toLocaleDateString()}</p>
          </div>
          <button 
            onClick={handleCreateNew}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-transform active:scale-95"
          >
            <Plus size={20} className="mr-2" />
            {t.newFillingTask}
          </button>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title={t.pendingAssignment} count={pendingTasks.length} icon={AlertCircle} color="bg-orange-400" />
              <StatCard title={t.inProgress} count={inProgressTasks.length} icon={Clock} color="bg-blue-500" />
              <StatCard title={t.completed} count={completedTasks.length} icon={CheckCircle} color="bg-green-500" />
              <StatCard title={t.myActiveTasks} count={myTasks.filter(t => t.status !== 'COMPLETED').length} icon={UserCircle} color="bg-purple-500" />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Calendar & Chart */}
              <div className="lg:col-span-2 space-y-6">
                {/* Calendar View */}
                <CalendarView tasks={tasks} translations={t} />

                {/* Chart */}
                <WorkloadChart tasks={tasks} members={teamMembers} translations={t} />
              </div>

              {/* Right Column: AI Briefing & Quick Tasks */}
              <div className="space-y-6">
                {/* AI Briefing */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{t.aiMorningBriefing}</h3>
                    <button 
                      onClick={generateBriefing}
                      disabled={loadingBriefing}
                      className="text-purple-600 hover:bg-purple-50 p-2 rounded-full transition-colors"
                    >
                      <Sparkles size={18} className={loadingBriefing ? "animate-spin" : ""} />
                    </button>
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed min-h-[150px]">
                    {briefing ? (
                      <div className="prose prose-sm prose-purple">
                        {briefing.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <p>{t.clickSparkle}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* My Active Tasks (Quick View) */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700">{t.myActiveTasks}</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {myTasks.filter(t => t.status !== 'COMPLETED').length === 0 ? (
                      <div className="p-8 text-center text-slate-400">{t.noActiveTasks}</div>
                    ) : (
                      myTasks.filter(t => t.status !== 'COMPLETED').map(task => (
                        <div key={task.id} onClick={() => handleEdit(task)} className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">{task.projectNumber}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{task.batchInfo}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {task.progress.filter(p => p.isCompleted).length} / 8 Steps
                            </p>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end max-w-[120px]">
                            {task.progress.map((d, i) => (
                              <div 
                                key={i} 
                                className={`w-2 h-6 rounded-sm ${d.isCompleted ? 'bg-green-500' : 'bg-slate-200'}`}
                                title={t.workflowSteps[i]}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-slate-700 text-lg">{t.allTasks}</h3>
              <button 
                onClick={handleExportCSV}
                className="flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={16} className="mr-2" />
                {t.exportCSV}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-4">{t.projectBatch}</th>
                    <th className="p-4">{t.assignee}</th>
                    <th className="p-4">{t.status}</th>
                    <th className="p-4">{t.progress}</th>
                    <th className="p-4">{t.deadline}</th>
                    <th className="p-4 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{task.projectNumber}</div>
                        <div className="text-slate-500 text-xs">{task.batchInfo}</div>
                      </td>
                      <td className="p-4">
                        {task.assigneeId ? (
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                               {teamMembers.find(m => m.id === task.assigneeId)?.name.charAt(0)}
                             </div>
                             <span className="text-slate-700">{teamMembers.find(m => m.id === task.assigneeId)?.name}</span>
                           </div>
                        ) : (
                          <span className="text-orange-500 italic flex items-center gap-1">
                            <AlertCircle size={14} /> {t.unassigned}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                            task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 
                            task.status === 'ASSIGNED' ? 'bg-purple-100 text-purple-700' : 
                            'bg-slate-100 text-slate-600'}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-0.5">
                          {task.progress.map((d, i) => (
                            <div 
                              key={i} 
                              className={`w-2 h-6 rounded-sm ${d.isCompleted ? 'bg-green-500' : 'bg-slate-200'}`}
                              title={t.workflowSteps[i]}
                            />
                          ))}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {Math.round((task.progress.filter(p => p.isCompleted).length / 8) * 100)}%
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {task.deadlineDate}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleEdit(task)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          {t.viewEdit}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Task Modal */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        currentUser={currentUser}
        members={teamMembers}
        existingTask={editingTask}
        allTasks={tasks}
        translations={t}
        lang={lang}
      />
    </div>
  );
};

export default App;
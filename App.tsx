import React, { useState, useEffect } from 'react';
import { Task, TeamMember, TaskStatus } from './types';
import { TEAM_MEMBERS, MOCK_TASKS_INITIAL, TRANSLATIONS } from './constants';
import TaskModal from './components/TaskModal';
import WorkloadChart from './components/WorkloadChart';
import CalendarView from './components/CalendarView';
import Login from './components/Login';
//import { generateMorningBriefing } from './services/geminiService';
import { generateMorningBriefing } from './services/ollamaService.ts';
import { saveTasks, loadTasks } from './services/storageService';
import { getCurrentUser, logout as authLogout, isAuthenticated } from './services/authService';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks'>('dashboard');
  const [lang, setLang] = useState<'en' | 'zh'>('zh');
  
  // AI State
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  const t = TRANSLATIONS[lang];

  // --- Check authentication on mount ---
  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        const user = getCurrentUser();
        if (user) {
          const member = TEAM_MEMBERS.find(m => m.id === user.memberId);
          if (member) {
            setLoggedInUser(user);
            setCurrentUser(member);
            setIsLoggedIn(true);
            // Load user's tasks
            const userTasks = loadTasks();
            if (userTasks.length === 0) {
              setTasks(MOCK_TASKS_INITIAL as Task[]);
            } else {
              setTasks(userTasks);
            }
          }
        }
      }
    };
    checkAuth();
  }, []);

  // --- Save tasks when they change ---
  useEffect(() => {
    if (isLoggedIn && tasks.length > 0) {
      saveTasks(tasks);
    }
  }, [tasks, isLoggedIn]);

  // --- Login Handler ---
  const handleLoginSuccess = (user: any) => {
    const member = TEAM_MEMBERS.find(m => m.id === user.memberId);
    if (member) {
      setLoggedInUser(user);
      setCurrentUser(member);
      setIsLoggedIn(true);
      // Load user's tasks
      const userTasks = loadTasks();
      if (userTasks.length === 0) {
        setTasks(MOCK_TASKS_INITIAL as Task[]);
      } else {
        setTasks(userTasks);
      }
    }
  };

  // --- Logout Handler ---
  const handleLogout = () => {
    authLogout();
    setIsLoggedIn(false);
    setLoggedInUser(null);
    setCurrentUser(null);
    setTasks([]);
    setBriefing(null);
  };

  // --- Handlers ---
  const handleSaveTask = (updatedTask: Task) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === updatedTask.id);
      if (exists) {
        return prev.map(t => t.id === updatedTask.id ? updatedTask : t);
      } else {
        return [...prev, updatedTask];
      }
    });
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
    setLoadingBriefing(true);
    const text = await generateMorningBriefing(tasks, TEAM_MEMBERS, lang);
    setBriefing(text);
    setLoadingBriefing(false);
  };

  const handleExportCSV = () => {
    const headers = [
      'Task ID', 'Project Number', 'Batch Info', 'Project Owner', 'Source',
      'Priority', 'Status', 'Assignee', 'Start Date', 'Deadline',
      'Completion Date', 'Progress (Steps Completed/8)'
    ];

    const rows = tasks.map(t => {
      const assigneeName = TEAM_MEMBERS.find(m => m.id === t.assigneeId)?.name || 'Unassigned';
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
                <WorkloadChart tasks={tasks} members={TEAM_MEMBERS} translations={t} />
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
                               {TEAM_MEMBERS.find(m => m.id === task.assigneeId)?.name.charAt(0)}
                             </div>
                             <span className="text-slate-700">{TEAM_MEMBERS.find(m => m.id === task.assigneeId)?.name}</span>
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
        members={TEAM_MEMBERS}
        existingTask={editingTask}
        allTasks={tasks}
        translations={t}
        lang={lang}
      />
    </div>
  );
};

export default App;
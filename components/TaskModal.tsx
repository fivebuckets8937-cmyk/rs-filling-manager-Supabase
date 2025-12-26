import React, { useState, useEffect } from 'react';
import { Task, TeamMember, TaskStatus, DailyTask } from '../types';
import { WORKFLOW_TEMPLATE, FULL_WORKFLOW_STEPS } from '../constants';
import { suggestAssignment } from '../services/ollamaService';
import { X, Sparkles, CheckCircle2, Circle, Info } from 'lucide-react';

/**
 * 生成UUID格式的任务ID
 */
const generateTaskId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  currentUser: TeamMember;
  members: TeamMember[];
  existingTask?: Task;
  allTasks: Task[]; // Needed for AI context
  translations: any;
  lang: 'en' | 'zh';
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, onClose, onSave, currentUser, members, existingTask, allTasks, translations, lang 
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [showWorkflowRef, setShowWorkflowRef] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingTask) {
        setFormData({ ...existingTask });
      } else {
        const today = new Date().toISOString().split('T')[0];
        // Default deadline 5 days from today
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 5);
        
        setFormData({
          id: generateTaskId(),
          status: TaskStatus.PENDING,
          progress: JSON.parse(JSON.stringify(WORKFLOW_TEMPLATE)),
          priority: 'NORMAL',
          assigneeId: null,
          projectNumber: '',
          projectOwner: '',
          source: '',
          batchInfo: '',
          receivedDate: today,
          startDate: today,
          deadlineDate: deadline.toISOString().split('T')[0],
        });
      }
      setAiSuggestion('');
      setShowWorkflowRef(false); // Reset reference view
    }
  }, [isOpen, existingTask]);

  if (!isOpen) return null;

  const handleAiSuggest = async () => {
    setLoadingAi(true);
    const tempTask = { ...formData } as Task;
    const result = await suggestAssignment(tempTask, allTasks, members, lang);
    setAiSuggestion(result);
    setLoadingAi(false);
  };

  const handleToggleDay = (dayIndex: number) => {
    if (!formData.progress) return;
    const newProgress = [...formData.progress];
    newProgress[dayIndex].isCompleted = !newProgress[dayIndex].isCompleted;
    setFormData({ ...formData, progress: newProgress });
  };

  const handleSave = () => {
    if (formData.projectNumber && formData.batchInfo && formData.startDate) {
      let newStatus = formData.status;
      let newCompletionDate = formData.completionDate;

      const allDone = formData.progress?.every(d => d.isCompleted);
      const someDone = formData.progress?.some(d => d.isCompleted);

      if (allDone) {
        newStatus = TaskStatus.COMPLETED;
        if (!newCompletionDate) {
          newCompletionDate = new Date().toISOString().split('T')[0];
        }
      } else if (someDone) {
        newStatus = TaskStatus.IN_PROGRESS;
        newCompletionDate = undefined;
      } else if (formData.assigneeId) {
        newStatus = TaskStatus.ASSIGNED;
        newCompletionDate = undefined;
      }
      
      onSave({ 
        ...formData, 
        status: newStatus,
        completionDate: newCompletionDate 
      } as Task);
      onClose();
    } else {
      alert("Please fill in Project Number, Batch Info and Start Date");
    }
  };

  const isManager = currentUser.role === 'MANAGER';
  const isAssignee = currentUser.id === formData.assigneeId;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex transition-all duration-300 ${showWorkflowRef ? 'max-w-5xl' : 'max-w-2xl'}`}>
        
        {/* Main Form Section */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">
              {existingTask ? translations.manageTask : translations.newTask}
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowWorkflowRef(!showWorkflowRef)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${showWorkflowRef ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Info size={14} />
                {translations.workflowReference}
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-2">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{translations.projectNumberLabel}</label>
                <input 
                  type="text" 
                  disabled={!isManager && !!existingTask}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100"
                  value={formData.projectNumber || ''}
                  onChange={e => setFormData({...formData, projectNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{translations.batchInfoLabel}</label>
                <input 
                  type="text" 
                  disabled={!isManager && !!existingTask}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100"
                  value={formData.batchInfo || ''}
                  onChange={e => setFormData({...formData, batchInfo: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{translations.startDate}</label>
                <input 
                  type="date" 
                  disabled={!isManager && !!existingTask}
                  className="w-full p-2 border border-slate-300 rounded disabled:bg-slate-100"
                  value={formData.startDate || ''}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{translations.deadline}</label>
                <input 
                  type="date" 
                  disabled={!isManager && !!existingTask}
                  className="w-full p-2 border border-slate-300 rounded disabled:bg-slate-100"
                  value={formData.deadlineDate || ''}
                  onChange={e => setFormData({...formData, deadlineDate: e.target.value})}
                />
              </div>
              {formData.status === TaskStatus.COMPLETED && (
                <div className="col-span-2">
                   <label className="block text-xs font-semibold text-green-600 uppercase mb-1">{translations.completionDate}</label>
                   <input 
                    type="date" 
                    className="w-full p-2 border border-green-300 bg-green-50 rounded"
                    value={formData.completionDate || ''}
                    onChange={e => setFormData({...formData, completionDate: e.target.value})}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{translations.projectOwnerLabel}</label>
                <input 
                  type="text" 
                  disabled={!isManager && !!existingTask}
                  className="w-full p-2 border border-slate-300 rounded disabled:bg-slate-100"
                  value={formData.projectOwner || ''}
                  onChange={e => setFormData({...formData, projectOwner: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{translations.sourceLabel}</label>
                <input 
                  type="text" 
                  disabled={!isManager && !!existingTask}
                  className="w-full p-2 border border-slate-300 rounded disabled:bg-slate-100"
                  value={formData.source || ''}
                  onChange={e => setFormData({...formData, source: e.target.value})}
                />
              </div>
            </div>

            {/* Assignment Section */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase">{translations.assignee}</label>
                {isManager && (
                  <button 
                    onClick={handleAiSuggest}
                    disabled={loadingAi}
                    className="flex items-center text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <Sparkles size={14} className="mr-1" />
                    {loadingAi ? translations.thinking : translations.aiSuggest}
                  </button>
                )}
              </div>
              
              {aiSuggestion && (
                <div className="mb-3 p-3 bg-purple-50 text-purple-800 text-sm rounded border border-purple-100">
                  {aiSuggestion}
                </div>
              )}

              <select 
                className="w-full p-2 border border-slate-300 rounded disabled:bg-slate-100"
                value={formData.assigneeId || ''}
                onChange={e => setFormData({...formData, assigneeId: e.target.value})}
                disabled={!isManager}
              >
                <option value="">-- {translations.unassigned} --</option>
                {members.filter(m => m.role === 'MEMBER').map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              
              <div className="mt-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{translations.priorityLabel}</label>
                    <select 
                      className="p-2 border border-slate-300 rounded text-sm disabled:bg-slate-100 w-full"
                      value={formData.priority || 'NORMAL'}
                      onChange={e => setFormData({...formData, priority: e.target.value as any})}
                      disabled={!isManager}
                    >
                      <option value="NORMAL">{translations.normal}</option>
                      <option value="URGENT">{translations.urgent}</option>
                    </select>
              </div>
            </div>

            {/* 8-Step Workflow Progress */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3">{translations.workflowTracking}</h3>
              <div className="space-y-3">
                {formData.progress?.map((step, idx) => (
                  <div key={idx} className={`flex items-center p-3 rounded-lg border ${step.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                    <button 
                      onClick={() => handleToggleDay(idx)}
                      disabled={!isAssignee && !isManager}
                      className={`mr-4 transition-colors ${!isAssignee && !isManager ? 'opacity-50 cursor-not-allowed' : 'hover:text-green-600'}`}
                    >
                      {step.isCompleted ? (
                        <CheckCircle2 className="text-green-600 w-6 h-6" />
                      ) : (
                        <Circle className="text-slate-300 w-6 h-6" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className={`font-medium ${step.isCompleted ? 'text-green-900' : 'text-slate-700'}`}>
                        {translations.workflowSteps[idx] || step.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded font-medium">
              {translations.cancel}
            </button>
            <button 
              onClick={handleSave} 
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-sm transition-transform active:scale-95"
            >
              {translations.saveTask}
            </button>
          </div>
        </div>

        {/* Workflow Reference Side Panel */}
        {showWorkflowRef && (
          <div className="w-80 bg-slate-50 border-l border-slate-200 overflow-y-auto p-6 hidden md:block">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">
               {translations.workflowReference}
            </h3>
            <div className="space-y-4">
              {FULL_WORKFLOW_STEPS.map((step) => (
                <div key={step.step} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Step {step.step}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {step.phase}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-800 text-xs mb-1">{step.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskModal;
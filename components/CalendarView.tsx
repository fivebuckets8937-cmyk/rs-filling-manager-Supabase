import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid3X3 } from 'lucide-react';
import { Task, TeamMember } from '../types';
import { TEAM_MEMBERS } from '../constants';

interface CalendarViewProps {
  tasks: Task[];
  translations: any;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, translations }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  // --- Helpers ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1));
    }
  };

  const getTaskAssigneeName = (assigneeId: string | null) => {
    if (!assigneeId) return translations.unassigned;
    return TEAM_MEMBERS.find(m => m.id === assigneeId)?.name || 'Unknown';
  };

  const getTasksForDateRange = (start: number, end: number) => {
    return tasks.filter(task => {
      const tStart = new Date(task.startDate).getTime();
      const tEndStr = task.status === 'COMPLETED' && task.completionDate ? task.completionDate : task.deadlineDate;
      const tEnd = new Date(tEndStr).getTime();
      return (tStart <= end && tEnd >= start);
    });
  };

  // --- Render Month View ---
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const weekDays = translations.days === '天' 
      ? ['日', '一', '二', '三', '四', '五', '六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const cells = [];
    // Padding
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`pad-${i}`} className="h-24 bg-slate-50/30 border-r border-b border-slate-100"></div>);
    }
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentMsStart = new Date(year, month, day).getTime();
      const currentMsEnd = new Date(year, month, day, 23, 59, 59).getTime();
      const dayTasks = getTasksForDateRange(currentMsStart, currentMsEnd);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      cells.push(
        <div key={`day-${day}`} className={`h-24 p-1 border-r border-b border-slate-100 hover:bg-slate-50 transition-colors overflow-hidden relative group ${isToday ? 'bg-blue-50/40' : ''}`}>
          <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{day}</div>
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[70px]">
            {dayTasks.map(task => (
              <div 
                key={task.id} 
                className={`text-[10px] px-1 py-0.5 rounded truncate font-medium cursor-help
                  ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                    task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 
                    task.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'}`}
                title={`${translations.projectBatch}: ${task.projectNumber}\n${translations.assignee}: ${getTaskAssigneeName(task.assigneeId)}\n${translations.status}: ${task.status}`}
              >
                {task.projectNumber}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {weekDays.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-slate-100">
          {cells}
        </div>
      </>
    );
  };

  // --- Render Year View ---
  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i);

    return (
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4 p-4">
        {months.map(month => {
          const startOfMonth = new Date(year, month, 1).getTime();
          const endOfMonth = new Date(year, month + 1, 0).getTime();
          const tasksInMonth = getTasksForDateRange(startOfMonth, endOfMonth);
          
          const monthName = new Date(year, month).toLocaleString(translations === 'zh' ? 'zh-CN' : 'en-US', { month: 'short' });
          const hasUrgent = tasksInMonth.some(t => t.priority === 'URGENT' && t.status !== 'COMPLETED');

          return (
            <button 
              key={month}
              onClick={() => {
                setCurrentDate(new Date(year, month, 1));
                setViewMode('month');
              }}
              className={`p-3 rounded-lg border text-left hover:shadow-md transition-all
                ${tasksInMonth.length > 0 ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent'}
                ${currentDate.getMonth() === month ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-slate-700">{monthName}</span>
                {tasksInMonth.length > 0 && (
                   <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{tasksInMonth.length}</span>
                )}
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                {tasksInMonth.length > 0 && (
                  <div 
                    className={`h-full ${hasUrgent ? 'bg-red-400' : 'bg-blue-400'}`} 
                    style={{ width: `${Math.min(tasksInMonth.length * 20, 100)}%` }} 
                  />
                )}
              </div>
              <div className="mt-2 text-[10px] text-slate-400 truncate">
                 {tasksInMonth.length > 0 
                   ? tasksInMonth.map(t => t.projectNumber).join(', ')
                   : '-'}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{translations.calendar}</h3>
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
             <button 
               onClick={() => setViewMode('month')}
               className={`p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${viewMode === 'month' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <CalendarIcon size={14} /> {translations.monthView}
             </button>
             <button 
               onClick={() => setViewMode('year')}
               className={`p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${viewMode === 'year' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Grid3X3 size={14} /> {translations.yearView}
             </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handlePrev} className="p-1 hover:bg-slate-100 rounded text-slate-600"><ChevronLeft size={20} /></button>
          <span className="font-semibold text-slate-700 w-32 text-center">
            {viewMode === 'month' 
              ? currentDate.toLocaleString(translations === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' })
              : currentDate.getFullYear()
            }
          </span>
          <button onClick={handleNext} className="p-1 hover:bg-slate-100 rounded text-slate-600"><ChevronRight size={20} /></button>
        </div>
      </div>
      
      {viewMode === 'month' ? renderMonthView() : renderYearView()}
    </div>
  );
};

export default CalendarView;
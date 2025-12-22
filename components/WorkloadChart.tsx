import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Task, TeamMember } from '../types';

interface WorkloadChartProps {
  tasks: Task[];
  members: TeamMember[];
  translations: any;
}

const WorkloadChart: React.FC<WorkloadChartProps> = ({ tasks, members, translations }) => {
  const data = members
    .filter(m => m.role === 'MEMBER')
    .map(member => {
      const activeCount = tasks.filter(t => t.assigneeId === member.id && t.status !== 'COMPLETED').length;
      const completedCount = tasks.filter(t => t.assigneeId === member.id && t.status === 'COMPLETED').length;
      return {
        name: member.name,
        Active: activeCount,
        Completed: completedCount,
      };
    });

  return (
    <div className="h-80 w-full bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col">
      <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wide">{translations.currentActiveWorkload}</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
            <Tooltip 
              cursor={{fill: '#f1f5f9'}}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Bar dataKey="Active" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" name={translations.inProgress} />
            <Bar dataKey="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} stackId="a" name={translations.completed} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WorkloadChart;
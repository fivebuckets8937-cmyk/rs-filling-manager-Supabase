import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { fetchTasks } from './storageService';
import { Task } from '../types';

export type TaskChangeCallback = (tasks: Task[]) => void;

let tasksChannel: RealtimeChannel | null = null;
let progressChannel: RealtimeChannel | null = null;

/**
 * 订阅任务表的变更
 */
export const subscribeToTasks = (callback: TaskChangeCallback): () => void => {
  // 取消现有订阅
  unsubscribeFromTasks();

  // 订阅 tasks 表的变更
  tasksChannel = supabase
    .channel('tasks_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'tasks',
      },
      async (payload) => {
        console.log('Task change detected:', payload.eventType, payload.new || payload.old);
        // 重新获取所有任务
        const tasks = await fetchTasks();
        callback(tasks);
      }
    )
    .subscribe();

  // 订阅 task_progress 表的变更
  progressChannel = supabase
    .channel('task_progress_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'task_progress',
      },
      async (payload) => {
        console.log('Task progress change detected:', payload.eventType);
        // 重新获取所有任务（因为进度变更会影响任务）
        const tasks = await fetchTasks();
        callback(tasks);
      }
    )
    .subscribe();

  // 返回取消订阅的函数
  return () => {
    unsubscribeFromTasks();
  };
};

/**
 * 取消任务订阅
 */
export const unsubscribeFromTasks = (): void => {
  if (tasksChannel) {
    supabase.removeChannel(tasksChannel);
    tasksChannel = null;
  }
  if (progressChannel) {
    supabase.removeChannel(progressChannel);
    progressChannel = null;
  }
};

/**
 * 订阅特定任务的变更
 */
export const subscribeToTask = (taskId: string, callback: TaskChangeCallback): () => void => {
  const channel = supabase
    .channel(`task_${taskId}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `id=eq.${taskId}`,
      },
      async () => {
        const tasks = await fetchTasks();
        callback(tasks);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'task_progress',
        filter: `task_id=eq.${taskId}`,
      },
      async () => {
        const tasks = await fetchTasks();
        callback(tasks);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};


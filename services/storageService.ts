import { Task } from '../types';
import { getCurrentUser } from './authService';

const TASKS_PREFIX = 'rs_tasks_';
const TASK_HISTORY_PREFIX = 'rs_task_history_';

/**
 * 获取当前用户的任务存储键
 */
const getUserTasksKey = (userId: string): string => {
  return `${TASKS_PREFIX}${userId}`;
};

/**
 * 获取当前用户的任务历史存储键
 */
const getUserHistoryKey = (userId: string): string => {
  return `${TASK_HISTORY_PREFIX}${userId}`;
};

/**
 * 保存任务列表（按用户隔离）
 */
export const saveTasks = (tasks: Task[]): void => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('No user logged in');
    return;
  }

  const key = getUserTasksKey(currentUser.id);
  localStorage.setItem(key, JSON.stringify(tasks));

  // 同时保存到历史记录
  saveTaskHistory(tasks);
};

/**
 * 加载任务列表（按用户隔离）
 */
export const loadTasks = (): Task[] => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return [];
  }

  const key = getUserTasksKey(currentUser.id);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

/**
 * 保存任务历史记录
 */
const saveTaskHistory = (tasks: Task[]): void => {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const historyKey = getUserHistoryKey(currentUser.id);
  const existingHistory = localStorage.getItem(historyKey);
  const history = existingHistory ? JSON.parse(existingHistory) : [];

  // 添加时间戳的快照
  const snapshot = {
    timestamp: new Date().toISOString(),
    tasks: JSON.parse(JSON.stringify(tasks)), // 深拷贝
  };

  history.push(snapshot);

  // 只保留最近30天的历史记录
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const filteredHistory = history.filter((entry: any) => 
    new Date(entry.timestamp) >= thirtyDaysAgo
  );

  localStorage.setItem(historyKey, JSON.stringify(filteredHistory));
};

/**
 * 获取任务历史记录
 */
export const getTaskHistory = (): Array<{ timestamp: string; tasks: Task[] }> => {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  const historyKey = getUserHistoryKey(currentUser.id);
  const data = localStorage.getItem(historyKey);
  return data ? JSON.parse(data) : [];
};

/**
 * 恢复到指定历史记录
 */
export const restoreFromHistory = (timestamp: string): Task[] | null => {
  const history = getTaskHistory();
  const entry = history.find(h => h.timestamp === timestamp);
  
  if (!entry) return null;

  saveTasks(entry.tasks);
  return entry.tasks;
};

/**
 * 清除当前用户的所有数据（用于测试或重置）
 */
export const clearUserData = (): void => {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const tasksKey = getUserTasksKey(currentUser.id);
  const historyKey = getUserHistoryKey(currentUser.id);
  
  localStorage.removeItem(tasksKey);
  localStorage.removeItem(historyKey);
};


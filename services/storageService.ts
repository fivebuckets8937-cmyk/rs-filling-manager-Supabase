import { supabase } from './supabaseClient';
import { Task, DatabaseTask, DatabaseTaskProgress, DailyTask, TaskStatus } from '../types';
import { getUserTeamMember } from './authService';
import { createErrorMessage } from './errorHandler';

/**
 * 将应用层的 Task 转换为数据库格式
 */
const taskToDatabase = (task: Task, createdBy?: string | null): Partial<DatabaseTask> => {
  return {
    id: task.id,
    project_number: task.projectNumber,
    project_owner: task.projectOwner || null,
    source: task.source || null,
    batch_info: task.batchInfo || null,
    received_date: task.receivedDate || null,
    start_date: task.startDate || null,
    completion_date: task.completionDate || null,
    deadline_date: task.deadlineDate || null,
    assignee_id: task.assigneeId || null,
    status: task.status,
    priority: task.priority,
    created_by: createdBy || task.createdBy || null,
  };
};

/**
 * 将数据库格式转换为应用层的 Task
 */
const databaseToTask = (dbTask: DatabaseTask, progress: DatabaseTaskProgress[]): Task => {
  // 将 progress 数组转换为 DailyTask 格式
  const dailyTasks: DailyTask[] = progress
    .sort((a, b) => a.day - b.day)
    .map(p => ({
      day: p.day,
      label: p.label,
      isCompleted: p.is_completed,
      notes: p.notes || '',
    }));

  return {
    id: dbTask.id,
    projectNumber: dbTask.project_number,
    projectOwner: dbTask.project_owner || '',
    source: dbTask.source || '',
    batchInfo: dbTask.batch_info || '',
    receivedDate: dbTask.received_date || '',
    startDate: dbTask.start_date || '',
    completionDate: dbTask.completion_date || undefined,
    deadlineDate: dbTask.deadline_date || '',
    assigneeId: dbTask.assignee_id,
    status: dbTask.status as TaskStatus,
    priority: dbTask.priority,
    progress: dailyTasks,
    createdBy: dbTask.created_by || undefined,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
  };
};

/**
 * 从数据库获取所有任务（包含进度）
 */
export const fetchTasks = async (): Promise<Task[]> => {
  try {
    // 获取任务列表
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw new Error(createErrorMessage(tasksError, 'en', 'fetchTasks'));
    }

    if (!tasks || tasks.length === 0) {
      return [];
    }

    // 获取所有任务的进度
    const taskIds = tasks.map(t => t.id);
    const { data: progress, error: progressError } = await supabase
      .from('task_progress')
      .select('*')
      .in('task_id', taskIds);

    if (progressError) {
      console.error('Error fetching progress:', progressError);
      // Progress error is not critical, continue without progress data
    }

    // 将进度按 task_id 分组
    const progressByTaskId = new Map<string, DatabaseTaskProgress[]>();
    (progress || []).forEach(p => {
      const existing = progressByTaskId.get(p.task_id) || [];
      existing.push(p);
      progressByTaskId.set(p.task_id, existing);
    });

    // 组合任务和进度
    return tasks.map(task => {
      const taskProgress = progressByTaskId.get(task.id) || [];
      return databaseToTask(task as DatabaseTask, taskProgress);
    });
  } catch (error) {
    console.error('Exception fetching tasks:', error);
    throw error; // Re-throw to let caller handle
  }
};

/**
 * 保存任务（插入或更新）
 */
export const saveTask = async (task: Task): Promise<Task | null> => {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/11248a46-7825-4702-800a-f563671325b5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H3',location:'storageService.ts:saveTask',message:'enter saveTask',data:{taskId:task.id,assigneeId:task.assigneeId,status:task.status},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const teamMember = await getUserTeamMember();
    if (!teamMember) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/11248a46-7825-4702-800a-f563671325b5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H2',location:'storageService.ts:saveTask',message:'no team member for current user',data:{taskId:task.id},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      throw new Error(createErrorMessage(
        new Error('No team member found for current user'),
        'en',
        'saveTask'
      ));
    }

    const dbTask = taskToDatabase(task, teamMember.id);

    // Upsert 任务
    const { data: savedTask, error: taskError } = await supabase
      .from('tasks')
      .upsert(dbTask, { onConflict: 'id' })
      .select()
      .single();

    if (taskError || !savedTask) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/11248a46-7825-4702-800a-f563671325b5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H3',location:'storageService.ts:saveTask',message:'upsert error',data:{taskId:task.id,error:taskError?.message},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      throw new Error(createErrorMessage(taskError || new Error('Failed to save task'), 'en', 'saveTask'));
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/11248a46-7825-4702-800a-f563671325b5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'H3',location:'storageService.ts:saveTask',message:'upsert success',data:{taskId:task.id,savedTaskId:savedTask.id,createdBy:savedTask.created_by,assigneeId:savedTask.assignee_id},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    // 保存任务进度
    if (task.progress && task.progress.length > 0) {
      const progressData: Partial<DatabaseTaskProgress>[] = task.progress.map(p => ({
        task_id: savedTask.id,
        day: p.day,
        label: p.label,
        is_completed: p.isCompleted,
        notes: p.notes || null,
      }));

      // 删除旧的进度记录
      await supabase
        .from('task_progress')
        .delete()
        .eq('task_id', savedTask.id);

      // 插入新的进度记录
      const { error: progressError } = await supabase
        .from('task_progress')
        .insert(progressData);

      if (progressError) {
        console.error('Error saving progress:', progressError);
        // Progress error is not critical, continue
      }
    }

    // 重新获取完整任务（包含进度）
    const { data: progress } = await supabase
      .from('task_progress')
      .select('*')
      .eq('task_id', savedTask.id);

    return databaseToTask(savedTask as DatabaseTask, (progress || []) as DatabaseTaskProgress[]);
  } catch (error) {
    console.error('Exception saving task:', error);
    throw error; // Re-throw to let caller handle
  }
};

/**
 * 删除任务
 */
export const deleteTask = async (taskId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // 获取当前用户信息，用于权限验证
    const teamMember = await getUserTeamMember();
    if (!teamMember) {
      return {
        success: false,
        error: 'No team member found for current user. Please ensure you are logged in.'
      };
    }

    // 检查用户是否是管理员
    if (teamMember.role !== 'MANAGER') {
      return {
        success: false,
        error: 'Only managers can delete tasks. You do not have permission to delete this task.'
      };
    }

    // 执行删除操作
    const { error, data } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .select(); // 使用 select() 来获取删除的行数

    if (error) {
      console.error('Error deleting task:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return {
        success: false,
        error: error.message || 'Failed to delete task. Please check your permissions.'
      };
    }

    // 检查是否真的删除了记录
    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Task not found or already deleted.'
      };
    }

    console.log('Task deleted successfully:', taskId);
    return { success: true };
  } catch (error: any) {
    console.error('Exception deleting task:', error);
    return {
      success: false,
      error: error?.message || 'An unexpected error occurred while deleting the task.'
    };
  }
};

/**
 * 保存任务进度
 */
export const saveTaskProgress = async (taskId: string, progress: DailyTask[]): Promise<boolean> => {
  try {
    // 删除旧的进度记录
    await supabase
      .from('task_progress')
      .delete()
      .eq('task_id', taskId);

    // 插入新的进度记录
    const progressData: Partial<DatabaseTaskProgress>[] = progress.map(p => ({
      task_id: taskId,
      day: p.day,
      label: p.label,
      is_completed: p.isCompleted,
      notes: p.notes || null,
    }));

    const { error } = await supabase
      .from('task_progress')
      .insert(progressData);

    if (error) {
      console.error('Error saving progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception saving progress:', error);
    return false;
  }
};

/**
 * 获取任务历史记录
 */
export const getTaskHistory = async (taskId?: string): Promise<Array<{ timestamp: string; task: Task }>> => {
  try {
    let query = supabase
      .from('task_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    const { data: history, error } = await query;

    if (error) {
      console.error('Error fetching history:', error);
      return [];
    }

    // 解析历史记录（需要从 new_data 或 old_data 中提取任务信息）
    // 这里简化处理，实际可能需要更复杂的逻辑
    return (history || []).map(h => ({
      timestamp: h.created_at,
      task: h.new_data as any as Task, // 简化处理
    }));
  } catch (error) {
    console.error('Exception fetching history:', error);
    return [];
  }
};

/**
 * 批量保存任务（用于迁移或初始化）
 */
export const saveTasks = async (tasks: Task[]): Promise<boolean> => {
  try {
    const teamMember = await getUserTeamMember();
    if (!teamMember) {
      console.error('No team member found for current user');
      return false;
    }

    // 批量保存任务
    for (const task of tasks) {
      await saveTask(task);
    }

    return true;
  } catch (error) {
    console.error('Exception saving tasks:', error);
    return false;
  }
};

/**
 * 加载任务（兼容旧接口）
 */
export const loadTasks = async (): Promise<Task[]> => {
  return fetchTasks();
};

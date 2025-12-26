/**
 * 统一错误处理工具
 */

export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * 格式化 Supabase 错误消息
 */
export const formatSupabaseError = (error: any, lang: 'en' | 'zh' = 'zh'): string => {
  if (!error) return lang === 'zh' ? '发生未知错误' : 'Unknown error occurred';

  // Supabase 错误
  if (error.message) {
    const message = error.message.toLowerCase();
    
    // 网络错误
    if (message.includes('network') || message.includes('fetch')) {
      return lang === 'zh' 
        ? '网络连接失败，请检查您的网络连接' 
        : 'Network connection failed, please check your internet connection';
    }
    
    // 权限错误
    if (message.includes('permission') || message.includes('policy') || message.includes('row-level')) {
      return lang === 'zh' 
        ? '您没有权限执行此操作' 
        : 'You do not have permission to perform this action';
    }
    
    // 认证错误
    if (message.includes('auth') || message.includes('session') || message.includes('token')) {
      return lang === 'zh' 
        ? '登录已过期，请重新登录' 
        : 'Session expired, please login again';
    }
    
    // 未找到
    if (message.includes('not found') || message.includes('does not exist')) {
      return lang === 'zh' 
        ? '未找到请求的资源' 
        : 'Requested resource not found';
    }
    
    // 返回原始错误消息
    return error.message;
  }

  // 其他错误
  if (typeof error === 'string') {
    return error;
  }

  return lang === 'zh' ? '发生未知错误' : 'Unknown error occurred';
};

/**
 * 记录错误到控制台（开发环境）
 */
export const logError = (error: AppError | Error | any, context?: string): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` in ${context}` : ''}]:`, error);
  }
};

/**
 * 创建用户友好的错误消息
 */
export const createErrorMessage = (
  error: AppError | Error | any,
  lang: 'en' | 'zh' = 'zh',
  context?: string
): string => {
  logError(error, context);
  return formatSupabaseError(error, lang);
};


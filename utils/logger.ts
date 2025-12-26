/**
 * 生产环境日志服务
 * 在开发环境使用 console，生产环境可选择上报到日志服务
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private isDevelopment: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };
  }

  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry = this.createLogEntry(level, message, context, error);
    this.addToHistory(entry);

    // 开发环境：直接输出到 console
    if (this.isDevelopment) {
      const consoleMethod = console[level] || console.log;
      if (error) {
        consoleMethod(`[${level.toUpperCase()}]`, message, context || '', error);
      } else {
        consoleMethod(`[${level.toUpperCase()}]`, message, context || '');
      }
      return;
    }

    // 生产环境：只记录 error 和 warn
    if (level === 'error' || level === 'warn') {
      // 可以在这里集成日志上报服务（如 Sentry）
      // this.reportToService(entry);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error);
  }

  /**
   * 获取日志历史（用于调试）
   */
  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * 清空日志历史
   */
  clearHistory(): void {
    this.logHistory = [];
  }
}

// 导出单例
export const logger = new Logger();

// 导出类型
export type { LogLevel, LogEntry };


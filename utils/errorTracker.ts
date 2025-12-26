/**
 * 错误追踪服务
 * 用于捕获和上报应用错误
 */

import { logger } from './logger';

interface ErrorContext {
  userId?: string;
  userRole?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  [key: string]: unknown;
}

class ErrorTracker {
  private isInitialized = false;

  /**
   * 初始化错误追踪
   */
  init(): void {
    if (this.isInitialized) {
      return;
    }

    // 捕获未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(
        new Error(event.reason?.message || 'Unhandled Promise Rejection'),
        {
          reason: event.reason,
          promise: event.promise,
        }
      );
    });

    // 捕获全局错误
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    this.isInitialized = true;
    logger.info('错误追踪已初始化');
  }

  /**
   * 追踪错误
   */
  trackError(error: Error, context?: Record<string, unknown>): void {
    const errorContext: ErrorContext = {
      ...context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // 记录错误
    logger.error(error.message, error, errorContext);

    // 生产环境：可以上报到错误追踪服务（如 Sentry）
    if (import.meta.env.PROD) {
      // 示例：集成 Sentry
      // if (window.Sentry) {
      //   window.Sentry.captureException(error, {
      //     contexts: { custom: errorContext },
      //   });
      // }
    }
  }

  /**
   * 追踪用户操作
   */
  trackUserAction(action: string, context?: Record<string, unknown>): void {
    logger.info(`用户操作: ${action}`, context);
    
    // 生产环境：可以上报到分析服务
    if (import.meta.env.PROD) {
      // 示例：集成 Google Analytics
      // if (window.gtag) {
      //   window.gtag('event', action, context);
      // }
    }
  }

  /**
   * 追踪性能指标
   */
  trackPerformance(metric: string, value: number, context?: Record<string, unknown>): void {
    logger.info(`性能指标: ${metric} = ${value}ms`, context);
    
    // 生产环境：可以上报到性能监控服务
    if (import.meta.env.PROD) {
      // 示例：集成 Web Vitals
      // if (window.webVitals) {
      //   window.webVitals.report(metric, value, context);
      // }
    }
  }
}

// 导出单例
export const errorTracker = new ErrorTracker();

// 在应用启动时初始化
if (typeof window !== 'undefined') {
  errorTracker.init();
}


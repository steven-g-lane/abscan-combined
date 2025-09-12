// Simple renderer logging interface - pure IPC client
// No config, no environment checks, no logic - just IPC calls

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  file?: string;
  function?: string;
  line?: number;
  component?: string;
  operation?: string;
}

export interface RendererLogger {
  trace(message: string, data?: any, context?: LogContext): void;
  debug(message: string, data?: any, context?: LogContext): void;
  info(message: string, data?: any, context?: LogContext): void;
  warn(message: string, data?: any, context?: LogContext): void;
  error(message: string, data?: any, context?: LogContext): void;
}

class SimpleRendererLogger implements RendererLogger {
  private component?: string;

  constructor(component?: string) {
    this.component = component;
  }

  private sendLog(level: LogLevel, message: string, data?: any, context?: LogContext): void {
    // Enhanced context with component info
    const enhancedContext = {
      ...context,
      component: context?.component || this.component
    };

    const logMessage = {
      timestamp: new Date().toISOString(),
      level,
      source: 'renderer' as const,
      processId: 0, // Will be set by main process
      message,
      data,
      context: enhancedContext
    };

    // Send to main process via IPC
    if (window.electronAPI && window.electronAPI.sendLog) {
      window.electronAPI.sendLog(logMessage);
    }

    // Also log to console in development (simple fallback)
    console.log(`[${level.toUpperCase()}] [renderer] ${message}`, data || '');
  }

  trace(message: string, data?: any, context?: LogContext): void {
    this.sendLog('trace', message, data, context);
  }

  debug(message: string, data?: any, context?: LogContext): void {
    this.sendLog('debug', message, data, context);
  }

  info(message: string, data?: any, context?: LogContext): void {
    this.sendLog('info', message, data, context);
  }

  warn(message: string, data?: any, context?: LogContext): void {
    this.sendLog('warn', message, data, context);
  }

  error(message: string, data?: any, context?: LogContext): void {
    this.sendLog('error', message, data, context);
  }
}

// Simple factory function
export function createRendererLogger(component?: string): RendererLogger {
  return new SimpleRendererLogger(component);
}

// Default logger instance
export const rendererLogger = createRendererLogger();
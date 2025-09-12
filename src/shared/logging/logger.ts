import { getLogConfig, type LogConfig } from './config';
import { createIPCTransport, type LogMessage } from './ipcTransport';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';
export type LogSource = 'main' | 'renderer' | 'preload' | 'cli';

export interface LogContext {
  file?: string;
  function?: string;
  line?: number;
  component?: string;
  operation?: string;
}

export interface Logger {
  trace(message: string, data?: any, context?: LogContext): void;
  debug(message: string, data?: any, context?: LogContext): void;
  info(message: string, data?: any, context?: LogContext): void;
  warn(message: string, data?: any, context?: LogContext): void;
  error(message: string, data?: any, context?: LogContext): void;
  child(bindings: Record<string, any>): Logger;
}

class UnifiedLogger implements Logger {
  private source: LogSource;
  private config: LogConfig;
  private isRenderer: boolean;

  constructor(source: LogSource, config?: Partial<LogConfig>) {
    this.source = source;
    this.config = { ...getLogConfig(), ...config };
    this.isRenderer = typeof window !== 'undefined';
  }

  private writeLog(level: LogLevel, message: string, data?: any, context?: LogContext): void {
    const logMessage: LogMessage = {
      timestamp: new Date().toISOString(),
      level,
      source: this.source,
      processId: typeof process !== 'undefined' ? process.pid : 0,
      message,
      data,
      context
    };

    if (this.isRenderer) {
      // Send via IPC to main process for file writing
      if (window.electronAPI && window.electronAPI.sendLog) {
        window.electronAPI.sendLog(logMessage);
      }
      // Also log to console in development
      if (this.config.destinations.console) {
        console.log(`[${level.toUpperCase()}] [${this.source}] ${message}`, data ? data : '');
      }
    } else {
      // Main process or CLI - use direct file writing
      this.writeToFile(logMessage);
      if (this.config.destinations.console) {
        console.log(`[${level.toUpperCase()}] [${this.source}] ${message}`, data ? data : '');
      }
    }
  }

  private writeToFile(logMessage: LogMessage): void {
    // Only available in Node.js environments (main process and CLI)
    if (typeof require !== 'undefined' && this.config.destinations.file && this.config.file) {
      try {
        const fs = require('fs');
        const path = require('path');
        
        const logDir = path.dirname(this.config.file.path);
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        
        const logLine = JSON.stringify(logMessage) + '\n';
        fs.appendFileSync(this.config.file.path, logLine);
      } catch (error) {
        // Fallback to console if file writing fails
        console.log(`[${logMessage.level.toUpperCase()}] [${logMessage.source}] ${logMessage.message}`, logMessage.data || '');
      }
    }
  }

  trace(message: string, data?: any, context?: LogContext): void {
    this.writeLog('trace', message, data, context);
  }

  debug(message: string, data?: any, context?: LogContext): void {
    this.writeLog('debug', message, data, context);
  }

  info(message: string, data?: any, context?: LogContext): void {
    this.writeLog('info', message, data, context);
  }

  warn(message: string, data?: any, context?: LogContext): void {
    this.writeLog('warn', message, data, context);
  }

  error(message: string, data?: any, context?: LogContext): void {
    this.writeLog('error', message, data, context);
  }

  child(bindings: Record<string, any>): Logger {
    const childLogger = Object.create(this);
    childLogger._bindings = { ...(this as any)._bindings, ...bindings };
    return childLogger;
  }
}

// Global logger instances
const loggers = new Map<string, Logger>();

export function createLogger(source: LogSource, component?: string, config?: Partial<LogConfig>): Logger {
  const key = component ? `${source}:${component}` : source;
  
  if (!loggers.has(key)) {
    const logger = new UnifiedLogger(source, config);
    loggers.set(key, component ? logger.child({ component }) : logger);
  }
  
  return loggers.get(key)!;
}

// Convenience factory functions
export const mainLogger = (component?: string) => createLogger('main', component);
export const rendererLogger = (component?: string) => createLogger('renderer', component);
export const preloadLogger = (component?: string) => createLogger('preload', component);
export const cliLogger = (component?: string) => createLogger('cli', component);

// Log message store for in-app viewer
export class LogStore {
  private messages: LogMessage[] = [];
  private maxMessages = 10000;
  private listeners: ((messages: LogMessage[]) => void)[] = [];

  addMessage(message: LogMessage): void {
    this.messages.push(message);
    
    // Keep only recent messages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
    
    // Notify listeners
    this.listeners.forEach(listener => listener([...this.messages]));
  }

  getMessages(filter?: {
    source?: LogSource;
    level?: LogLevel;
    since?: Date;
    search?: string;
  }): LogMessage[] {
    let filtered = [...this.messages];

    if (filter) {
      if (filter.source) {
        filtered = filtered.filter(msg => msg.source === filter.source);
      }
      if (filter.level) {
        const levelOrder = { trace: 0, debug: 1, info: 2, warn: 3, error: 4 };
        const minLevel = levelOrder[filter.level];
        filtered = filtered.filter(msg => levelOrder[msg.level as LogLevel] >= minLevel);
      }
      if (filter.since) {
        filtered = filtered.filter(msg => new Date(msg.timestamp) >= filter.since!);
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filtered = filtered.filter(msg => 
          msg.message.toLowerCase().includes(searchLower) ||
          (msg.context?.file?.toLowerCase().includes(searchLower)) ||
          (msg.context?.component?.toLowerCase().includes(searchLower))
        );
      }
    }

    return filtered;
  }

  subscribe(listener: (messages: LogMessage[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  clear(): void {
    this.messages = [];
    this.listeners.forEach(listener => listener([]));
  }
}

export const globalLogStore = new LogStore();
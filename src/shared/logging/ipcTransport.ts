import { Transform } from 'stream';
import { ipcRenderer } from 'electron';

export interface LogMessage {
  timestamp: string;
  level: string;
  source: 'main' | 'renderer' | 'preload' | 'cli';
  processId: number;
  message: string;
  data?: any;
  context?: {
    file?: string;
    function?: string;
    line?: number;
  };
}

export class IPCLogTransport extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk: any, encoding: string, callback: Function) {
    try {
      const logMessage: LogMessage = {
        timestamp: new Date().toISOString(),
        level: chunk.level,
        source: this.getProcessSource(),
        processId: process.pid,
        message: chunk.msg || chunk.message || '',
        data: chunk.data,
        context: chunk.context
      };

      // Send to main process via IPC if in renderer
      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.sendLog(logMessage);
      } else if (ipcRenderer) {
        ipcRenderer.invoke('log-message', logMessage);
      }

      callback();
    } catch (error) {
      callback(error);
    }
  }

  private getProcessSource(): LogMessage['source'] {
    if (typeof window !== 'undefined') {
      return 'renderer';
    }
    if (typeof process !== 'undefined' && process.versions?.electron) {
      return process.type === 'renderer' ? 'renderer' : 'main';
    }
    return 'cli';
  }
}

export function createIPCTransport() {
  return new IPCLogTransport();
}
import { contextBridge, ipcRenderer } from 'electron';
import type { LogMessage } from '../shared/logging/ipcTransport';

contextBridge.exposeInMainWorld('electronAPI', {
  onLoadMillerData: (callback: (data: any) => void) => {
    ipcRenderer.on('load-miller-data', (_event, data) => callback(data));
  },
  onLoadMillerDataError: (callback: (error: string) => void) => {
    ipcRenderer.on('load-miller-data-error', (_event, error) => callback(error));
  },
  onScanStatus: (callback: (status: { status: string; message?: string }) => void) => {
    ipcRenderer.on('scan-status', (_event, status) => callback(status));
  },
  validatePaths: (paths: { scanPath: string; outputPath: string }) => {
    return ipcRenderer.invoke('validate-paths', paths);
  },
  chooseDirectory: (options: { title: string; defaultPath: string; buttonLabel: string }) => {
    return ipcRenderer.invoke('choose-directory', options);
  },
  executeConfiguredScan: (config: { scanPath: string; outputPath: string; includeNodeModules: boolean; includeGit: boolean; autoOpenFiles: boolean }) => {
    return ipcRenderer.invoke('execute-configured-scan', config);
  },
  autoLoadFile: (filePath: string) => {
    console.log('PRELOAD: autoLoadFile called with:', filePath);
    const result = ipcRenderer.invoke('auto-load-file', filePath);
    console.log('PRELOAD: ipcRenderer.invoke returned:', result);
    return result;
  },
  readFileContent: (filePath: string) => {
    return ipcRenderer.invoke('read-file-content', filePath);
  },
  onOpenScanConfig: (callback: (defaultPath: string) => void) => {
    ipcRenderer.on('open-scan-config', (_event, defaultPath) => callback(defaultPath));
  },
  onScanProgress: (callback: (data: { type: 'stdout' | 'stderr'; message: string }) => void) => {
    ipcRenderer.on('scan-progress', (_event, data) => callback(data));
  },
  cancelScan: () => {
    return ipcRenderer.invoke('cancel-scan');
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
  writeDebugFile: (filename: string, content: string) => {
    return ipcRenderer.invoke('write-debug-file', { filename, content });
  },
  sendLog: (logMessage: LogMessage) => {
    return ipcRenderer.invoke('log-message', logMessage);
  },
  onLogMessage: (callback: (logMessage: LogMessage) => void) => {
    ipcRenderer.on('log-message-broadcast', (_event, logMessage) => callback(logMessage));
  },
  // Settings management
  getDefaultScanPath: () => {
    return ipcRenderer.invoke('get-default-scan-path');
  },
  setDefaultScanPath: (path: string) => {
    return ipcRenderer.invoke('set-default-scan-path', path);
  },
  resetDefaultScanPath: () => {
    return ipcRenderer.invoke('reset-default-scan-path');
  },
  getOriginalLaunchPath: () => {
    return ipcRenderer.invoke('get-original-launch-path');
  }
});
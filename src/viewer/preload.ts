import { contextBridge, ipcRenderer } from 'electron';

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
  executeConfiguredScan: (config: { scanPath: string; outputPath: string; includeNodeModules: boolean; includeGit: boolean }) => {
    return ipcRenderer.invoke('execute-configured-scan', config);
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
  }
});
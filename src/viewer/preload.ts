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
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
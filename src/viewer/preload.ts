import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onLoadMillerData: (callback: (data: any) => void) => {
    ipcRenderer.on('load-miller-data', (_event, data) => callback(data));
  },
  onLoadMillerDataError: (callback: (error: string) => void) => {
    ipcRenderer.on('load-miller-data-error', (_event, error) => callback(error));
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
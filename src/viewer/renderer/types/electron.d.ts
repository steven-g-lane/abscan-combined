export interface ElectronAPI {
  onLoadMillerData: (callback: (data: any) => void) => void;
  onLoadMillerDataError: (callback: (error: string) => void) => void;
  onScanStatus: (callback: (status: { status: string; message?: string }) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
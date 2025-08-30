export interface ElectronAPI {
  onLoadMillerData: (callback: (data: any) => void) => void;
  onLoadMillerDataError: (callback: (error: string) => void) => void;
  onScanStatus: (callback: (status: { status: string; message?: string }) => void) => void;
  validatePaths: (paths: { scanPath: string; outputPath: string }) => Promise<{ scanPathValid: boolean; outputPathValid: boolean }>;
  chooseDirectory: (options: { title: string; defaultPath: string; buttonLabel: string }) => Promise<string | null>;
  executeConfiguredScan: (config: { scanPath: string; outputPath: string; includeNodeModules: boolean; includeGit: boolean; autoOpenFiles: boolean }) => Promise<{ success: boolean; error?: string }>;
  autoLoadFile: (filePath: string) => Promise<void>;
  onOpenScanConfig: (callback: (defaultPath: string) => void) => void;
  onScanProgress: (callback: (data: { type: 'stdout' | 'stderr'; message: string }) => void) => void;
  cancelScan: () => Promise<void>;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
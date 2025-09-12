export interface LogConfig {
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  destinations: {
    console: boolean;
    file: boolean;
    ipc: boolean;
  };
  file?: {
    path: string;
    maxSize: number;
    maxFiles: number;
  };
  performance: {
    highVolume: boolean;
    bufferSize: number;
  };
  filters: {
    sources: string[];
    excludePatterns: string[];
  };
}

export const defaultLogConfig: LogConfig = {
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  destinations: {
    console: process.env.NODE_ENV === 'development',
    file: true,
    ipc: false
  },
  file: {
    path: './logs/abscan.log',
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  },
  performance: {
    highVolume: false,
    bufferSize: 1000
  },
  filters: {
    sources: [], // Empty means all sources
    excludePatterns: []
  }
};

export function getLogConfig(): LogConfig {
  // Environment variable overrides
  const config = { ...defaultLogConfig };
  
  if (process.env.LOG_LEVEL) {
    config.level = process.env.LOG_LEVEL as LogConfig['level'];
  }
  
  if (process.env.LOG_FILE === 'true') {
    config.destinations.file = true;
  }
  
  if (process.env.LOG_HIGH_VOLUME === 'true') {
    config.performance.highVolume = true;
  }
  
  return config;
}
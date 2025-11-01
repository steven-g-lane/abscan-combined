import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { initializeMenu } from './main/menu';
import { mainLogger, globalLogStore, type LogMessage } from '../shared/logging/logger';

// Set the application name immediately for macOS menu
if (process.platform === 'darwin') {
  app.setName('Viewer');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize main process logger
const logger = mainLogger('main');

// Set up IPC handlers for logging
ipcMain.handle('log-message', async (event, logMessage: LogMessage) => {
  // Store the message in the global log store
  globalLogStore.addMessage(logMessage);
  
  // Write to log file
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const logDir = './logs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logLine = JSON.stringify(logMessage) + '\n';
    fs.appendFileSync('./logs/abscan.log', logLine);
  } catch (error) {
    console.error('Failed to write log to file:', error);
  }
  
  // Broadcast to all renderer windows
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('log-message-broadcast', logMessage);
  });
  
  return true;
});

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    height: 1094,
    width: 1667,
    minWidth: 800,
    minHeight: 600,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Always load the built files
  mainWindow.loadFile('dist/index.html');
  
  logger.info('Main window created successfully', {
    dimensions: { width: 1667, height: 1094 },
    preload: 'preload.js'
  });
}

app.whenReady().then(async () => {
  logger.info('Electron app ready, initializing...');
  
  await initializeMenu();
  createWindow();
  
  logger.info('Application initialization complete');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
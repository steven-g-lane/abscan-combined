import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { initializeMenu } from './main/menu';

// Set the application name immediately for macOS menu
if (process.platform === 'darwin') {
  app.setName('Viewer');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    height: 729,
    width: 1111,
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
}

app.whenReady().then(async () => {
  await initializeMenu();
  createWindow();
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
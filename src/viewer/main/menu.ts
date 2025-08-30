import { Menu, MenuItemConstructorOptions, shell, app, dialog, BrowserWindow, ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn, type ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { normalizeMillerData, type RawMillerData } from '../../shared/types/miller';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Track active scan process for cancellation
let activeScanProcess: ChildProcess | null = null;

// Types matching the JSON config structure
interface MenuAction {
  type: 'noop' | 'openExternal' | 'loadFile' | 'scanDirectory';
  url?: string;
}

interface MenuCondition {
  platform?: string[];
  env?: string[];
}

interface ConfigMenuItem {
  label?: string;
  type?: 'separator';
  role?: string;
  action?: MenuAction;
  when?: MenuCondition;
  submenu?: ConfigMenuItem[];
  accelerator?: string;
}

interface MenuConfig {
  meta: { version: number };
  menu: ConfigMenuItem[];
}

// Load menu configuration from JSON file
let menuConfig: MenuConfig;

async function loadMenuConfig(): Promise<MenuConfig> {
  try {
    const configPath = path.join(__dirname, './config/menu-config.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('Error loading menu config:', error);
    // Fallback to basic config if file can't be loaded
    return {
      meta: { version: 1 },
      menu: [{
        label: "File",
        submenu: [
          { label: "Load File…", action: { type: "loadFile" }, accelerator: "CommandOrControl+L" },
          { label: "Scan…", action: { type: "scanDirectory" } }
        ]
      }]
    };
  }
}

function shouldIncludeMenuItem(item: ConfigMenuItem): boolean {
  if (!item.when) return true;

  // Check platform condition
  if (item.when.platform) {
    const currentPlatform = process.platform;
    const platformMatch = item.when.platform.includes(currentPlatform);
    if (!platformMatch) return false;
  }

  // Check environment condition
  if (item.when.env) {
    const currentEnv = process.env.NODE_ENV || 'production';
    const envMatch = item.when.env.includes(currentEnv);
    if (!envMatch) return false;
  }

  return true;
}

async function loadJsonFile(): Promise<void> {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (!focusedWindow) {
    console.log('No focused window found');
    return;
  }

  try {
    console.log('Opening file dialog...');
    const result = await dialog.showOpenDialog(focusedWindow, {
      title: 'Load Data File',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      console.log('File dialog canceled or no file selected');
      return;
    }

    const filePath = result.filePaths[0];
    console.log('Loading file:', filePath);
    
    const fileContent = await fs.readFile(filePath, 'utf-8');
    console.log('File content length:', fileContent.length);
    
    const rawData = JSON.parse(fileContent) as RawMillerData;
    console.log('Parsed JSON data structure:', Object.keys(rawData));

    // Transform raw data to canonical format at ingestion boundary
    const normalizedData = normalizeMillerData(rawData);
    console.log('Normalized data items:', normalizedData.items.length);

    // Send the normalized data to the renderer process
    console.log('Sending normalized data to renderer...');
    focusedWindow.webContents.send('load-miller-data', normalizedData);
    console.log('Data sent successfully');
  } catch (error) {
    console.error('Error loading file:', error);
    // Send error to renderer
    focusedWindow.webContents.send('load-miller-data-error', error.message);
  }
}

async function autoLoadFile(filePath: string): Promise<void> {
  console.log('=== AUTO LOAD FILE CALLED ===');
  console.log('File path:', filePath);
  
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (!focusedWindow) {
    console.log('No focused window found for auto-load');
    return;
  }

  try {
    console.log('Auto-loading file:', filePath);
    
    // Check if file exists
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!fileExists) {
      console.error('Auto-load file does not exist:', filePath);
      focusedWindow.webContents.send('load-miller-data-error', 'Generated scan file not found');
      return;
    }
    
    const fileContent = await fs.readFile(filePath, 'utf-8');
    console.log('Auto-loaded file content length:', fileContent.length);
    
    const rawData = JSON.parse(fileContent) as RawMillerData;
    console.log('Auto-loaded JSON data structure:', Object.keys(rawData));

    // Transform raw data to canonical format at ingestion boundary
    const normalizedData = normalizeMillerData(rawData);
    console.log('Auto-loaded normalized data items:', normalizedData.items.length);

    // Send the normalized data to the renderer process
    console.log('Sending auto-loaded normalized data to renderer...');
    focusedWindow.webContents.send('load-miller-data', normalizedData);
    console.log('Auto-loaded data sent successfully');
  } catch (error) {
    console.error('Error auto-loading file:', error);
    // Send error to renderer
    focusedWindow.webContents.send('load-miller-data-error', `Auto-load failed: ${error.message}`);
  }
}

async function scanProjectDirectory(): Promise<void> {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (!focusedWindow) {
    console.log('No focused window found');
    return;
  }

  try {
    // Step 1: Select root directory to scan
    console.log('Opening directory dialog for scan root...');
    const rootResult = await dialog.showOpenDialog(focusedWindow, {
      title: 'Choose Directory to Scan',
      defaultPath: process.cwd(),
      properties: ['openDirectory']
    });

    if (rootResult.canceled || rootResult.filePaths.length === 0) {
      console.log('Root directory dialog canceled');
      return;
    }

    const scanPath = rootResult.filePaths[0];
    console.log('Selected scan path:', scanPath);

    // Step 2: Show loading state in renderer
    focusedWindow.webContents.send('scan-status', { 
      status: 'scanning', 
      message: 'Scanning project...' 
    });

    // Step 3: Execute CLI scanning in background
    const defaultOutputPath = path.join(scanPath, 'output');
    await executeScanProcess(scanPath, defaultOutputPath);

    // Step 4: Select output directory
    console.log('Opening directory dialog for output...');
    const outputResult = await dialog.showOpenDialog(focusedWindow, {
      title: 'Choose Output Directory',
      defaultPath: defaultOutputPath,
      properties: ['openDirectory', 'createDirectory']
    });

    if (outputResult.canceled || outputResult.filePaths.length === 0) {
      // Use default output path if canceled
      await fs.mkdir(defaultOutputPath, { recursive: true });
      console.log('Using default output path:', defaultOutputPath);
    } else {
      const outputPath = outputResult.filePaths[0];
      console.log('Selected output path:', outputPath);
      
      // If different from scan output, copy files to chosen location
      if (outputPath !== defaultOutputPath) {
        await copyOutputFiles(defaultOutputPath, outputPath);
      }
    }

    // Clear loading state
    focusedWindow.webContents.send('scan-status', { 
      status: 'complete' 
    });

  } catch (error) {
    console.error('Error during scan process:', error);
    focusedWindow.webContents.send('scan-status', { 
      status: 'error', 
      message: error.message 
    });
  }
}

async function executeScanProcess(scanPath: string, outputPath: string, options: { includeNodeModules?: boolean; includeGit?: boolean } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const cliPath = path.join(__dirname, './cli/index.cjs');
    console.log('Executing CLI scan:', cliPath);
    
    const args = ['scan', '-p', scanPath, '-o', outputPath];
    if (options.includeNodeModules) {
      args.push('--include-node-modules');
    }
    if (options.includeGit) {
      args.push('--include-git');
    }
    
    console.log('CLI args:', args);
    
    const scanProcess = spawn('node', [cliPath, ...args], {
      cwd: path.dirname(__dirname),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Store reference for cancellation
    activeScanProcess = scanProcess;

    const focusedWindow = BrowserWindow.getFocusedWindow();
    let stdout = '';
    let stderr = '';

    scanProcess.stdout?.on('data', (data) => {
      const message = data.toString().trim();
      stdout += message;
      console.log('CLI stdout:', message);
      
      // Stream progress to renderer
      if (focusedWindow && message) {
        focusedWindow.webContents.send('scan-progress', { type: 'stdout', message });
      }
    });

    scanProcess.stderr?.on('data', (data) => {
      const message = data.toString().trim();
      stderr += message;
      console.error('CLI stderr:', message);
      
      // Stream progress to renderer
      if (focusedWindow && message) {
        focusedWindow.webContents.send('scan-progress', { type: 'stderr', message });
      }
    });

    scanProcess.on('close', (code) => {
      activeScanProcess = null;
      
      if (code === 0) {
        console.log('CLI scan completed successfully');
        resolve();
      } else {
        console.error('CLI scan failed with code:', code);
        const errorMessage = stderr || stdout || `Process exited with code ${code}`;
        reject(new Error(errorMessage.split('\n').pop() || 'Scan failed'));
      }
    });

    scanProcess.on('error', (error) => {
      activeScanProcess = null;
      console.error('Failed to start CLI process:', error);
      reject(error);
    });
  });
}

async function copyOutputFiles(sourcePath: string, targetPath: string): Promise<void> {
  try {
    await fs.mkdir(targetPath, { recursive: true });
    const files = await fs.readdir(sourcePath);
    
    for (const file of files) {
      const sourceFile = path.join(sourcePath, file);
      const targetFile = path.join(targetPath, file);
      await fs.copyFile(sourceFile, targetFile);
    }
    
    console.log(`Copied output files from ${sourcePath} to ${targetPath}`);
  } catch (error) {
    console.error('Error copying output files:', error);
    throw error;
  }
}

async function executeConfiguredScan(config: { scanPath: string; outputPath: string; includeNodeModules: boolean; includeGit: boolean; autoOpenFiles: boolean }): Promise<void> {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (!focusedWindow) return;

  try {
    // Show loading state
    focusedWindow.webContents.send('scan-status', { 
      status: 'scanning', 
      message: 'Scanning project...' 
    });

    // Execute scan with configured options
    await executeScanProcess(config.scanPath, config.outputPath, {
      includeNodeModules: config.includeNodeModules,
      includeGit: config.includeGit
    });

    // Clear loading state
    console.log('=== CONFIGURED SCAN COMPLETED SUCCESSFULLY ===');
    console.log('Sending scan-status complete message');
    focusedWindow.webContents.send('scan-status', { 
      status: 'complete' 
    });

  } catch (error) {
    console.error('Error during configured scan:', error);
    focusedWindow.webContents.send('scan-status', { 
      status: 'error', 
      message: error.message 
    });
  }
}

// IPC handlers for scan configuration
ipcMain.handle('validate-paths', async (event, paths: { scanPath: string; outputPath: string }) => {
  try {
    const scanPathValid = await fs.access(paths.scanPath).then(() => true).catch(() => false);
    
    let outputPathValid = false;
    try {
      // Check if output path exists or can be created
      await fs.access(paths.outputPath);
      // If exists, check if writable
      await fs.access(paths.outputPath, fs.constants.W_OK);
      outputPathValid = true;
    } catch {
      // Try to ensure parent directory exists and is writable
      const parentDir = path.dirname(paths.outputPath);
      try {
        await fs.access(parentDir, fs.constants.W_OK);
        outputPathValid = true;
      } catch {
        outputPathValid = false;
      }
    }
    
    return { scanPathValid, outputPathValid };
  } catch (error) {
    console.error('Error validating paths:', error);
    return { scanPathValid: false, outputPathValid: false };
  }
});

ipcMain.handle('choose-directory', async (event, options: { title: string; defaultPath: string; buttonLabel: string }) => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (!focusedWindow) return null;
  
  try {
    const result = await dialog.showOpenDialog(focusedWindow, {
      title: options.title,
      defaultPath: options.defaultPath,
      buttonLabel: options.buttonLabel,
      properties: ['openDirectory']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  } catch (error) {
    console.error('Error choosing directory:', error);
    return null;
  }
});

ipcMain.handle('execute-configured-scan', async (event, config: { scanPath: string; outputPath: string; includeNodeModules: boolean; includeGit: boolean; autoOpenFiles: boolean }) => {
  try {
    await executeConfiguredScan(config);
    return { success: true };
  } catch (error) {
    console.error('Error executing configured scan:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cancel-scan', async () => {
  try {
    if (activeScanProcess) {
      console.log('Cancelling active scan process...');
      activeScanProcess.kill('SIGTERM');
      activeScanProcess = null;
      
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.webContents.send('scan-status', { 
          status: 'cancelled' 
        });
      }
      
      return { success: true };
    }
    return { success: false, error: 'No active scan process' };
  } catch (error) {
    console.error('Error cancelling scan:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auto-load-file', async (event, filePath: string) => {
  console.log('=== AUTO LOAD IPC HANDLER CALLED ===');
  console.log('Received file path:', filePath);
  
  try {
    await autoLoadFile(filePath);
    console.log('Auto-load completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Auto-load IPC error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-file-content', async (event, filePath: string) => {
  try {
    // Check if file exists and get stats
    const stats = await fs.stat(filePath);
    
    // Basic binary file detection
    const isBinary = await isFileLikelyBinary(filePath);
    if (isBinary) {
      return { isBinary: true, text: '', lineCount: 0 };
    }
    
    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');
    const lineCount = content.split('\n').length;
    
    return {
      isBinary: false,
      text: content,
      lineCount: lineCount,
      size: stats.size
    };
  } catch (error) {
    console.error('Error reading file content:', error);
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

// Basic binary file detection
async function isFileLikelyBinary(filePath: string): Promise<boolean> {
  const ext = path.extname(filePath).toLowerCase();
  
  // Common binary extensions
  const binaryExtensions = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
    '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
    '.exe', '.dll', '.so', '.dylib',
    '.mp3', '.mp4', '.avi', '.mov', '.wav',
    '.bin', '.dat', '.db', '.sqlite', '.sqlite3'
  ]);
  
  if (binaryExtensions.has(ext)) {
    return true;
  }
  
  // For other files, check the first few bytes for null characters
  try {
    const buffer = await fs.readFile(filePath, { encoding: null });
    const firstKB = buffer.slice(0, 1024);
    
    // If we find null bytes in first 1KB, likely binary
    for (let i = 0; i < firstKB.length; i++) {
      if (firstKB[i] === 0) {
        return true;
      }
    }
    
    return false;
  } catch {
    // If we can't read the file, assume it's binary
    return true;
  }
}

function openScanConfigModal(): void {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (!focusedWindow) return;
  
  // Send message to renderer to open scan config modal
  const defaultPath = process.cwd();
  focusedWindow.webContents.send('open-scan-config', defaultPath);
}

function handleMenuAction(action: MenuAction): () => void {
  return () => {
    switch (action.type) {
      case 'openExternal':
        if (action.url) {
          shell.openExternal(action.url);
        }
        break;
      case 'loadFile':
        loadJsonFile();
        break;
      case 'scanDirectory':
        openScanConfigModal();
        break;
      case 'noop':
        // No operation - placeholder for future functionality
        console.log('Menu action: noop');
        break;
      default:
        console.warn(`Unknown menu action type: ${(action as any).type}`);
    }
  };
}

function convertMenuItem(item: ConfigMenuItem): MenuItemConstructorOptions | null {
  if (!shouldIncludeMenuItem(item)) {
    return null;
  }

  if (item.type === 'separator') {
    return { type: 'separator' };
  }

  const menuItem: MenuItemConstructorOptions = {};

  // Handle label, including @app replacement for macOS
  if (item.label) {
    if (item.label === '@app' && process.platform === 'darwin') {
      menuItem.label = app.getName();
    } else {
      menuItem.label = item.label;
    }
  }

  // Handle role-based menu items
  if (item.role) {
    menuItem.role = item.role as any;
  }

  // Handle custom actions
  if (item.action) {
    menuItem.click = handleMenuAction(item.action);
  }

  // Handle accelerators
  if (item.accelerator) {
    menuItem.accelerator = item.accelerator;
  }

  // Handle submenus
  if (item.submenu) {
    const submenuItems = item.submenu
      .map(convertMenuItem)
      .filter((item): item is MenuItemConstructorOptions => item !== null);
    
    if (submenuItems.length > 0) {
      menuItem.submenu = submenuItems;
    }
  }

  return menuItem;
}

function createMenuTemplate(): MenuItemConstructorOptions[] {
  const template = menuConfig.menu
    .map(convertMenuItem)
    .filter((item): item is MenuItemConstructorOptions => item !== null);

  return template;
}

export async function initializeMenu(): Promise<void> {
  menuConfig = await loadMenuConfig();
  const template = createMenuTemplate();
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
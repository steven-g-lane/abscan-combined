import { Menu, MenuItemConstructorOptions, shell, app, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    
    const jsonData = JSON.parse(fileContent);
    console.log('Parsed JSON data structure:', Object.keys(jsonData));

    // Send the loaded data to the renderer process
    console.log('Sending data to renderer...');
    focusedWindow.webContents.send('load-miller-data', jsonData);
    console.log('Data sent successfully');
  } catch (error) {
    console.error('Error loading file:', error);
    // Send error to renderer
    focusedWindow.webContents.send('load-miller-data-error', error.message);
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

async function executeScanProcess(scanPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cliPath = path.join(__dirname, './cli/index.cjs');
    console.log('Executing CLI scan:', cliPath);
    
    const scanProcess = spawn('node', [cliPath, 'scan', '-p', scanPath, '-o', outputPath], {
      cwd: path.dirname(__dirname),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    scanProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
      console.log('CLI stdout:', data.toString());
    });

    scanProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
      console.error('CLI stderr:', data.toString());
    });

    scanProcess.on('close', (code) => {
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
        scanProjectDirectory();
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
import { Menu, MenuItemConstructorOptions, shell, app, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';

// Types matching the JSON config structure
interface MenuAction {
  type: 'noop' | 'openExternal' | 'loadFile';
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
}

interface MenuConfig {
  meta: { version: number };
  menu: ConfigMenuItem[];
}

// The actual menu configuration data converted from JSON
const menuConfig: MenuConfig = {
  "meta": { "version": 1 },
  "menu": [
    {
      "label": "@app",
      "when": { "platform": ["darwin"] },
      "submenu": [
        { "label": "About", "action": { "type": "noop" } },
        { "label": "Check for Updates…", "action": { "type": "noop" } },
        { "type": "separator" },
        { "label": "Settings…", "action": { "type": "noop" } },
        { "type": "separator" },
        { "label": "Services", "action": { "type": "noop" } },
        { "type": "separator" },
        { "label": "Hide This App", "role": "hide" },
        { "label": "Show Others", "role": "unhide" },
        { "label": "Show All", "action": { "type": "noop" } },
        { "type": "separator" },
        { "label": "Quit Viewer", "role": "quit" }
      ]
    },
    {
      "label": "File",
      "submenu": [
        { "label": "Load File…", "action": { "type": "loadFile" } }
      ]
    },
    {
      "label": "Edit",
      "submenu": [
        { "role": "undo" },
        { "role": "redo" },
        { "type": "separator" },
        { "role": "cut" },
        { "role": "copy" },
        { "role": "paste" },
        { "role": "delete" },
        { "role": "selectAll" }
      ]
    },
    {
      "label": "View",
      "submenu": [
        { "role": "resetZoom" },
        { "role": "zoomIn" },
        { "role": "zoomOut" },
        { "type": "separator" },
        { "role": "togglefullscreen" },
        { "type": "separator" },
        { "role": "reload", "when": { "env": ["development"] } },
        { "role": "forceReload", "when": { "env": ["development"] } },
        { "role": "toggleDevTools", "when": { "env": ["development"] } }
      ]
    },
    {
      "label": "Window",
      "submenu": [
        { "role": "minimize" },
        { "role": "zoom", "when": { "platform": ["darwin"] } },
        { "role": "close" }
      ]
    },
    {
      "label": "Help",
      "role": "help",
      "submenu": [
        { "label": "Documentation", "action": { "type": "openExternal", "url": "https://example.com/docs" } },
        { "label": "Report Issue…", "action": { "type": "noop" } }
      ]
    }
  ]
};

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

export function initializeMenu(): void {
  const template = createMenuTemplate();
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
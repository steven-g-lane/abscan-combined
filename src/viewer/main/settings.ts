import { app } from 'electron';
import fs from 'fs';
import path from 'path';

interface AppSettings {
  defaultScanPath?: string;
  originalLaunchPath?: string;
}

class SettingsManager {
  private settingsPath: string;
  private settings: AppSettings = {};
  private originalLaunchPath: string;
  private initialized: boolean = false;

  constructor() {
    this.originalLaunchPath = process.cwd(); // Store the launch directory immediately
    this.initialize();
  }

  private initialize(): void {
    try {
      // Ensure app is ready before accessing userData
      if (!app.isReady()) {
        app.whenReady().then(() => this.initialize());
        return;
      }

      const userDataPath = app.getPath('userData');
      this.settingsPath = path.join(userDataPath, 'settings.json');

      console.log('SettingsManager initialized:', {
        userDataPath,
        settingsPath: this.settingsPath,
        originalLaunchPath: this.originalLaunchPath
      });

      this.loadSettings();

      // Store the original launch path if not already stored
      if (!this.settings.originalLaunchPath) {
        this.settings.originalLaunchPath = this.originalLaunchPath;
        this.saveSettings();
      }

      this.initialized = true;
      console.log('SettingsManager loaded settings:', this.settings);
    } catch (error) {
      console.error('Failed to initialize SettingsManager:', error);
    }
  }

  private loadSettings(): void {
    try {
      if (fs.existsSync(this.settingsPath)) {
        console.log('Loading settings from:', this.settingsPath);
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        this.settings = JSON.parse(data);
        console.log('Loaded settings:', this.settings);
      } else {
        console.log('Settings file does not exist:', this.settingsPath);
        this.settings = {};
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = {};
    }
  }

  private saveSettings(): void {
    try {
      const userDataPath = path.dirname(this.settingsPath);
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
        console.log('Created userData directory:', userDataPath);
      }
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
      console.log('Settings saved to:', this.settingsPath);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      console.warn('SettingsManager not initialized, attempting to initialize...');
      this.initialize();
    }
  }

  getDefaultScanPath(): string | undefined {
    this.ensureInitialized();
    return this.settings.defaultScanPath;
  }

  setDefaultScanPath(path: string): void {
    this.ensureInitialized();
    console.log('Setting default scan path:', path);
    this.settings.defaultScanPath = path;
    this.saveSettings();
    console.log('Default scan path saved, current settings:', this.settings);
  }

  hasDefaultScanPath(): boolean {
    this.ensureInitialized();
    return !!this.settings.defaultScanPath;
  }

  clearDefaultScanPath(): void {
    this.ensureInitialized();
    delete this.settings.defaultScanPath;
    this.saveSettings();
  }

  getOriginalLaunchPath(): string {
    this.ensureInitialized();
    return this.settings.originalLaunchPath || this.originalLaunchPath;
  }
}

// Export singleton instance
export const settingsManager = new SettingsManager();
import React, { useState, useEffect } from 'react';
import { X, Folder } from 'lucide-react';

interface ScanConfig {
  scanPath: string;
  outputPath: string;
  includeNodeModules: boolean;
  includeGit: boolean;
}

interface ScanConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (config: ScanConfig) => void;
  defaultScanPath?: string;
}

const ScanConfigModal: React.FC<ScanConfigModalProps> = ({ 
  isOpen, 
  onClose, 
  onScan, 
  defaultScanPath = '' 
}) => {
  const [config, setConfig] = useState<ScanConfig>({
    scanPath: defaultScanPath,
    outputPath: '',
    includeNodeModules: false,
    includeGit: false
  });

  const [validation, setValidation] = useState({
    scanPathError: '',
    outputPathError: ''
  });

  const [isValidating, setIsValidating] = useState(false);

  // Initialize paths when modal opens
  useEffect(() => {
    if (isOpen && defaultScanPath) {
      const newConfig = {
        ...config,
        scanPath: defaultScanPath,
        outputPath: `${defaultScanPath}/output`
      };
      setConfig(newConfig);
      validatePaths(newConfig);
    }
  }, [isOpen, defaultScanPath]);

  // Auto-update output path when scan path changes
  useEffect(() => {
    if (config.scanPath && !config.outputPath.includes('output')) {
      const newOutputPath = `${config.scanPath}/output`;
      setConfig(prev => ({ ...prev, outputPath: newOutputPath }));
    }
  }, [config.scanPath]);

  // Validate paths when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validatePaths(config);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [config.scanPath, config.outputPath]);

  const validatePaths = async (configToValidate: ScanConfig) => {
    if (!configToValidate.scanPath || !configToValidate.outputPath) return;
    
    setIsValidating(true);
    
    try {
      // Request validation from main process
      const result = await window.electronAPI.validatePaths({
        scanPath: configToValidate.scanPath,
        outputPath: configToValidate.outputPath
      });
      
      setValidation({
        scanPathError: result.scanPathValid ? '' : 'Directory does not exist',
        outputPathError: result.outputPathValid ? '' : 'Directory not writable'
      });
    } catch (error) {
      console.error('Path validation error:', error);
      setValidation({
        scanPathError: 'Unable to validate directory',
        outputPathError: 'Unable to validate directory'
      });
    }
    
    setIsValidating(false);
  };

  const handleScanPathChoose = async () => {
    try {
      const path = await window.electronAPI.chooseDirectory({
        title: 'Choose Directory to Scan',
        defaultPath: config.scanPath || defaultScanPath,
        buttonLabel: 'Choose'
      });
      
      if (path) {
        setConfig(prev => ({
          ...prev,
          scanPath: path,
          outputPath: `${path}/output`
        }));
      }
    } catch (error) {
      console.error('Error choosing scan directory:', error);
    }
  };

  const handleOutputPathChoose = async () => {
    try {
      const path = await window.electronAPI.chooseDirectory({
        title: 'Choose Output Directory',
        defaultPath: config.outputPath,
        buttonLabel: 'Choose'
      });
      
      if (path) {
        setConfig(prev => ({ ...prev, outputPath: path }));
      }
    } catch (error) {
      console.error('Error choosing output directory:', error);
    }
  };

  const handleScan = async () => {
    if (validation.scanPathError || validation.outputPathError || isValidating) {
      return;
    }
    
    onScan(config);
    // Don't close here - let the App component handle modal transitions
  };

  const canScan = !validation.scanPathError && 
                 !validation.outputPathError && 
                 !isValidating && 
                 config.scanPath && 
                 config.outputPath;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-background-primary border border-border-primary rounded-md max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <h2 className="text-lg font-semibold text-foreground-primary">Scan Application</h2>
          <button
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Scan Path */}
          <div>
            <label className="block text-sm font-medium text-foreground-primary mb-2">
              Scan Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.scanPath}
                onChange={(e) => setConfig(prev => ({ ...prev, scanPath: e.target.value }))}
                className="flex-1 px-3 py-2 bg-background-secondary border border-border-primary rounded text-foreground-primary text-sm focus:border-accent-primary focus:outline-none"
                placeholder="Enter directory path to scan"
              />
              <button
                onClick={handleScanPathChoose}
                className="px-4 py-2 bg-background-tertiary border border-border-primary rounded text-foreground-primary text-sm hover:bg-background-secondary transition-colors flex items-center gap-2"
              >
                <Folder size={16} />
                Choose…
              </button>
            </div>
            {validation.scanPathError && (
              <p className="text-sm text-red-400 mt-1">{validation.scanPathError}</p>
            )}
          </div>

          {/* Output Path */}
          <div>
            <label className="block text-sm font-medium text-foreground-primary mb-2">
              Output Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.outputPath}
                onChange={(e) => setConfig(prev => ({ ...prev, outputPath: e.target.value }))}
                className="flex-1 px-3 py-2 bg-background-secondary border border-border-primary rounded text-foreground-primary text-sm focus:border-accent-primary focus:outline-none"
                placeholder="Enter output directory path"
              />
              <button
                onClick={handleOutputPathChoose}
                className="px-4 py-2 bg-background-tertiary border border-border-primary rounded text-foreground-primary text-sm hover:bg-background-secondary transition-colors flex items-center gap-2"
              >
                <Folder size={16} />
                Choose…
              </button>
            </div>
            {validation.outputPathError && (
              <p className="text-sm text-red-400 mt-1">{validation.outputPathError}</p>
            )}
          </div>

          {/* Include node_modules */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground-primary">
              Include node_modules
            </label>
            <button
              onClick={() => setConfig(prev => ({ ...prev, includeNodeModules: !prev.includeNodeModules }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.includeNodeModules ? 'bg-accent-primary' : 'bg-background-tertiary'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.includeNodeModules ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Include .git directory */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground-primary">
              Include .git directory
            </label>
            <button
              onClick={() => setConfig(prev => ({ ...prev, includeGit: !prev.includeGit }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.includeGit ? 'bg-accent-primary' : 'bg-background-tertiary'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.includeGit ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border-primary">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleScan}
            disabled={!canScan}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              canScan 
                ? 'bg-accent-primary text-white hover:bg-blue-600' 
                : 'bg-background-tertiary text-foreground-muted cursor-not-allowed'
            }`}
          >
            {isValidating ? 'Validating...' : 'Scan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanConfigModal;
import React, { useState, useEffect, useRef, useCallback } from 'react';
import MillerColumns, { MillerColumnsRef } from './components/MillerColumns';
import BottomPanel from './components/BottomPanel';
import DetailPanel from './components/DetailPanel';
import ScanConfigModal from './components/ScanConfigModal';
import ScanProgressModal from './components/ScanProgressModal';
import { createRendererLogger } from '../../shared/logging/rendererLogger';

// Interface for Miller column entries with metadata support
interface MillerColumnEntry {
  item_name?: string;
  lucide_icon?: string;
  children?: MillerColumnEntry[];
  name?: string;
  icon?: string;
  metadata?: any;
}

function App() {
  // Initialize simple renderer logger
  const logger = createRendererLogger('App');
  logger.info('App component mounting');
  
  const [selectedItem, setSelectedItem] = useState<MillerColumnEntry | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanProgressOpen, setScanProgressOpen] = useState(false);
  const [defaultScanPath, setDefaultScanPath] = useState('');
  const [currentScanConfig, setCurrentScanConfig] = useState<{ scanPath: string; outputPath: string; includeNodeModules: boolean; includeGit: boolean; autoOpenFiles: boolean } | null>(null);
  const [currentColumnIndex, setCurrentColumnIndex] = useState<number>(0);
  const [scanRoot, setScanRoot] = useState<string | null>(null); // Track scan root path for resolving relative file paths
  
  // Use ref to avoid stale closure issues with currentScanConfig
  const currentScanConfigRef = useRef(currentScanConfig);
  
  // Ref for miller columns to enable grid row clicks
  const millerColumnsRef = useRef<MillerColumnsRef>(null);
  
  // Track listener registration state to prevent race conditions
  const listenersRegistered = useRef(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    currentScanConfigRef.current = currentScanConfig;
  }, [currentScanConfig]);

  // Load default scan path on startup
  useEffect(() => {
    const loadDefaultScanPath = async () => {
      try {
        const stored = await window.electronAPI.getDefaultScanPath();
        if (stored) {
          setDefaultScanPath(stored);
          logger.info('Loaded stored default scan path on startup', { path: stored });
        }
      } catch (error) {
        logger.error('Failed to load default scan path on startup', { error });
      }
    };

    loadDefaultScanPath();
  }, []);

  logger.debug('App state initialized');

  const handleItemSelection = (item: MillerColumnEntry | null) => {
    setSelectedItem(item);
  };

  const handleColumnStateChange = (columnIndex: number) => {
    setCurrentColumnIndex(columnIndex);
  };

  const handleScanRootChange = (root: string | null) => {
    setScanRoot(root);
    logger.debug('Scan root updated', { root });
  };


  const handleScanConfigClose = () => {
    setScanModalOpen(false);
  };

  const handleScan = (config: { scanPath: string; outputPath: string; includeNodeModules: boolean; includeGit: boolean; autoOpenFiles: boolean }) => {
    logger.info('Handling scan request', {
      previousConfig: currentScanConfig,
      newConfig: config,
      expectedAutoLoadPath: `${config.outputPath}/abscan.json`
    });
    
    // Store the scan config for later use with auto-open
    setCurrentScanConfig(config);
    currentScanConfigRef.current = config;
    logger.debug('Stored scan config for auto-load', { config: currentScanConfigRef.current });
    
    // Close config modal and open progress modal immediately
    setScanModalOpen(false);
    setScanProgressOpen(true);
    
    // Start the scan process
    console.log('Starting scan process...');
    window.electronAPI.executeConfiguredScan(config).catch(error => {
      console.error('Error executing scan:', error);
    });
  };

  const handleScanProgressClose = () => {
    setScanProgressOpen(false);
  };

  // Setup IPC event listeners with race condition protection
  useEffect(() => {
    const handleScanConfigOpen = (defaultPath: string) => {
      logger.info('Opening scan config modal', {
        previousPath: defaultScanPath,
        newPath: defaultPath,
        currentConfig: currentScanConfig
      });
      
      setDefaultScanPath(defaultPath);
      setScanModalOpen(true);
    };

    const handleScanStatus = async (status: { status: string; message?: string }) => {
      logger.info('Received scan status', { status: status.status, message: status.message });
      
      // Add visual indicator that scan status was received
      document.title = `abscan-viewer - Status: ${status.status}`;
      
      if (status.status === 'complete') {
        logger.info('Scan completed, handling auto-load', { 
          scanConfig: currentScanConfigRef.current 
        });
        
        const delay = 1500; // Wait for success message to be visible
        const timeoutId = setTimeout(async () => {
          logger.debug('Auto-load timeout fired', { delay });
          setScanProgressOpen(false);
          
          // Auto-load the generated file if auto-open is enabled
          if (currentScanConfigRef.current?.autoOpenFiles) {
            try {
              const abscanPath = `${currentScanConfigRef.current.outputPath}/abscan.json`;
              
              logger.info('Attempting auto-load', {
                abscanPath,
                scanPath: currentScanConfigRef.current.scanPath,
                outputPath: currentScanConfigRef.current.outputPath
              });
              
              const result = await window.electronAPI.autoLoadFile(abscanPath);
              logger.info('Auto-load completed successfully', { result });
            } catch (error) {
              logger.error('Auto-load failed', { error: error.message, abscanPath });
            }
          } else {
            logger.debug('Auto-load skipped', { 
              reason: 'Auto-open disabled or no scan config',
              config: currentScanConfigRef.current 
            });
          }
        }, delay);
        
        logger.debug('Auto-load timeout scheduled', { timeoutId, delay });
      } else if (status.status === 'cancelled') {
        setScanProgressOpen(false);
      }
    };

    // Register listeners with handler dependency tracking
    if (typeof window !== 'undefined' && window.electronAPI) {
      logger.info('Registering IPC event listeners');
      
      window.electronAPI.onOpenScanConfig(handleScanConfigOpen);
      window.electronAPI.onScanStatus(handleScanStatus);
      listenersRegistered.current = true;
      
      logger.debug('IPC listeners registered successfully');
    } else if (!window.electronAPI) {
      // Retry if electronAPI not available yet
      const timeout = setTimeout(() => {
        if (!listenersRegistered.current && window.electronAPI) {
          logger.info('Registering IPC listeners on retry');
          
          window.electronAPI.onOpenScanConfig(handleScanConfigOpen);
          window.electronAPI.onScanStatus(handleScanStatus);
          listenersRegistered.current = true;
          
          logger.debug('IPC listeners registered on retry');
        }
      }, 100);
      
      return () => clearTimeout(timeout);
    }

    // Cleanup only on unmount
    return () => {
      if (listenersRegistered.current && typeof window !== 'undefined' && window.electronAPI) {
        logger.info('Cleaning up IPC event listeners on unmount');
        window.electronAPI.removeAllListeners('open-scan-config');
        window.electronAPI.removeAllListeners('scan-status');
        listenersRegistered.current = false;
      }
    };
  }); // Remove dependency array to run on every render

  // Set up global right-click context menu
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();

      // Only show context menu if electronAPI is available
      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.showContextMenu();
      }
    };

    // Add event listener to document
    document.addEventListener('contextmenu', handleContextMenu);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div className="h-screen bg-background-primary text-foreground-primary grid grid-cols-[3fr_1fr] gap-0 min-w-[800px] min-h-[600px] overflow-hidden">
      {/* Left Panel - 75% */}
      <div className="flex flex-col overflow-hidden">
        {/* Miller Columns - 55% of left panel height */}
        <div className="flex-[0.55] bg-background-secondary border-r border-border-primary min-h-0 overflow-hidden">
          <div className="h-full p-2">
            <div className="h-full rounded border border-border-secondary overflow-hidden">
              <MillerColumns
                ref={millerColumnsRef}
                onItemSelect={handleItemSelection}
                onColumnStateChange={handleColumnStateChange}
                onScanRootChange={handleScanRootChange}
              />
            </div>
          </div>
        </div>
        
        {/* Bottom Panel - 45% of left panel height */}
        <div className="flex-[0.45] bg-background-secondary border-r border-t border-border-primary min-h-0 overflow-hidden">
          <div className="h-full p-2">
            <div className="h-full rounded border border-border-secondary overflow-hidden">
              <BottomPanel
                selectedItem={selectedItem}
                millerColumnsRef={millerColumnsRef}
                currentColumnIndex={currentColumnIndex}
                scanRoot={scanRoot}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - 25% */}
      <div className="bg-background-primary overflow-hidden min-w-0">
        <div className="h-full p-2">
          <div className="h-full rounded border border-border-primary overflow-hidden">
            <DetailPanel selectedItem={selectedItem} />
          </div>
        </div>
      </div>
      
      {/* Scan Configuration Modal */}
      <ScanConfigModal 
        isOpen={scanModalOpen}
        onClose={handleScanConfigClose}
        onScan={handleScan}
        defaultScanPath={defaultScanPath}
      />
      
      {/* Scan Progress Modal */}
      <ScanProgressModal 
        isOpen={scanProgressOpen}
        onCancel={handleScanProgressClose}
      />
    </div>
  );
}

export default App;
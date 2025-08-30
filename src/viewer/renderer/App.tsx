import React, { useState, useEffect, useRef } from 'react';
import MillerColumns from './components/MillerColumns';
import BottomPanel from './components/BottomPanel';
import DetailPanel from './components/DetailPanel';
import ScanConfigModal from './components/ScanConfigModal';
import ScanProgressModal from './components/ScanProgressModal';

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
  console.log('=== APP COMPONENT MOUNTING ===');
  
  const [selectedItem, setSelectedItem] = useState<MillerColumnEntry | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanProgressOpen, setScanProgressOpen] = useState(false);
  const [defaultScanPath, setDefaultScanPath] = useState('');
  const [currentScanConfig, setCurrentScanConfig] = useState<{ scanPath: string; outputPath: string; includeNodeModules: boolean; includeGit: boolean; autoOpenFiles: boolean } | null>(null);
  
  // Use ref to avoid stale closure issues with currentScanConfig
  const currentScanConfigRef = useRef(currentScanConfig);
  
  // Keep ref in sync with state
  useEffect(() => {
    currentScanConfigRef.current = currentScanConfig;
  }, [currentScanConfig]);
  
  console.log('App state initialized');

  const handleItemSelection = (item: MillerColumnEntry | null) => {
    setSelectedItem(item);
  };

  const handleScanConfigOpen = (defaultPath: string) => {
    setDefaultScanPath(defaultPath);
    setScanModalOpen(true);
  };

  const handleScanConfigClose = () => {
    setScanModalOpen(false);
  };

  const handleScan = (config: { scanPath: string; outputPath: string; includeNodeModules: boolean; includeGit: boolean; autoOpenFiles: boolean }) => {
    console.log('=== HANDLE SCAN CALLED ===');
    console.log('Scan config received:', config);
    console.log('Auto-open enabled:', config.autoOpenFiles);
    
    // Store the scan config for later use with auto-open
    setCurrentScanConfig(config);
    currentScanConfigRef.current = config;
    console.log('Stored scan config for auto-load');
    
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

  // Listen for scan config modal open requests and scan status
  useEffect(() => {
    const handleScanStatus = async (status: { status: string; message?: string }) => {
      console.log('=== RECEIVED SCAN STATUS ===');
      console.log('Status:', status);
      
      // Add visual indicator that scan status was received
      document.title = `abscan-viewer - Status: ${status.status}`;
      
      if (status.status === 'complete') {
        console.log('=== SCAN COMPLETED, HANDLING AUTO-LOAD ===');
        // Handle successful scan completion
        console.log('=== STARTING AUTO-LOAD DELAY ===');
        console.log('Current scan config at completion:', currentScanConfigRef.current);
        
        const delay = 1500; // Wait for success message to be visible
        setTimeout(async () => {
          console.log('=== AUTO-LOAD DELAY COMPLETED ===');
          setScanProgressOpen(false);
          console.log('Progress modal closed');
          
          // Auto-load the generated file if auto-open is enabled
          console.log('Checking auto-open conditions...');
          console.log('currentScanConfig exists:', !!currentScanConfigRef.current);
          console.log('autoOpenFiles enabled:', currentScanConfigRef.current?.autoOpenFiles);
          
          if (currentScanConfigRef.current?.autoOpenFiles) {
            try {
              const abscanPath = `${currentScanConfigRef.current.outputPath}/abscan.json`;
              console.log('=== ATTEMPTING AUTO-LOAD ===');
              console.log('Auto-loading scan results from:', abscanPath);
              console.log('Full scan config:', currentScanConfigRef.current);
              
              const result = await window.electronAPI.autoLoadFile(abscanPath);
              console.log('=== AUTO-LOAD API CALL COMPLETED ===');
              console.log('Auto-load result:', result);
            } catch (error) {
              console.error('=== AUTO-LOAD ERROR ===');
              console.error('Error auto-loading scan results:', error);
            }
          } else {
            console.log('=== AUTO-LOAD SKIPPED ===');
            console.log('Auto-open is disabled or no scan config available');
            console.log('Current scan config:', currentScanConfigRef.current);
            console.log('Auto-open value:', currentScanConfigRef.current?.autoOpenFiles);
          }
        }, delay);
      } else if (status.status === 'cancelled') {
        // Handle cancelled scan
        setScanProgressOpen(false);
      }
    };

    const setupListener = () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        console.log('=== SETTING UP APP EVENT LISTENERS ===');
        window.electronAPI.onOpenScanConfig(handleScanConfigOpen);
        window.electronAPI.onScanStatus(handleScanStatus);
        console.log('Scan status listener registered in App.tsx');
        return true;
      }
      console.log('electronAPI not available yet, will retry...');
      return false;
    };

    if (!setupListener()) {
      const timeout = setTimeout(setupListener, 100);
      return () => clearTimeout(timeout);
    }

    return () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.removeAllListeners('open-scan-config');
        window.electronAPI.removeAllListeners('scan-status');
      }
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
              <MillerColumns onItemSelect={handleItemSelection} />
            </div>
          </div>
        </div>
        
        {/* Bottom Panel - 45% of left panel height */}
        <div className="flex-[0.45] bg-background-secondary border-r border-t border-border-primary min-h-0 overflow-hidden">
          <div className="h-full p-2">
            <div className="h-full rounded border border-border-secondary overflow-hidden">
              <BottomPanel selectedItem={selectedItem} />
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
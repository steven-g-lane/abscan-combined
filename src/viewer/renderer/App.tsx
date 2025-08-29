import React, { useState, useEffect } from 'react';
import MillerColumns from './components/MillerColumns';
import ExpandedGrid from './components/ExpandedGrid';
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
  const [selectedItem, setSelectedItem] = useState<MillerColumnEntry | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanProgressOpen, setScanProgressOpen] = useState(false);
  const [defaultScanPath, setDefaultScanPath] = useState('');

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

  const handleScan = (config: { scanPath: string; outputPath: string; includeNodeModules: boolean; includeGit: boolean }) => {
    // Close config modal and open progress modal immediately
    setScanModalOpen(false);
    setScanProgressOpen(true);
    
    // Start the scan process
    window.electronAPI.executeConfiguredScan(config).catch(error => {
      console.error('Error executing scan:', error);
    });
  };

  const handleScanProgressClose = () => {
    setScanProgressOpen(false);
  };

  // Listen for scan config modal open requests and scan status
  useEffect(() => {
    const handleScanStatus = (status: { status: string; message?: string }) => {
      if (status.status === 'complete' || status.status === 'cancelled') {
        // Auto-close progress modal on completion (with delay for success message)
        const delay = status.status === 'complete' ? 1500 : 0;
        setTimeout(() => {
          setScanProgressOpen(false);
        }, delay);
      }
    };

    const setupListener = () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.onOpenScanConfig(handleScanConfigOpen);
        window.electronAPI.onScanStatus(handleScanStatus);
        return true;
      }
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
        
        {/* Expanded Grid - 45% of left panel height */}
        <div className="flex-[0.45] bg-background-secondary border-r border-t border-border-primary min-h-0 overflow-hidden">
          <div className="h-full p-2">
            <div className="h-full rounded border border-border-secondary overflow-hidden">
              <ExpandedGrid />
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
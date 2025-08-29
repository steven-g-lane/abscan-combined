import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ScanProgressModalProps {
  isOpen: boolean;
  onCancel: () => void;
}

const ScanProgressModal: React.FC<ScanProgressModalProps> = ({ isOpen, onCancel }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [scanState, setScanState] = useState<'running' | 'success' | 'error' | 'cancelled'>('running');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Listen for scan progress updates
  useEffect(() => {
    if (!isOpen) return;

    const handleScanProgress = (data: { type: 'stdout' | 'stderr'; message: string }) => {
      setLogs(prev => [...prev, `${data.type.toUpperCase()}: ${data.message}`]);
    };

    const handleScanStatus = (status: { status: string; message?: string }) => {
      if (status.status === 'complete') {
        setScanState('success');
        setLogs(prev => [...prev, 'SCAN: Completed successfully']);
      } else if (status.status === 'error') {
        setScanState('error');
        setErrorMessage(status.message || 'Scan failed');
        setLogs(prev => [...prev, `ERROR: ${status.message || 'Scan failed'}`]);
      } else if (status.status === 'cancelled') {
        setScanState('cancelled');
        setLogs(prev => [...prev, 'SCAN: Cancelled by user']);
      }
    };

    const setupListeners = () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.onScanProgress(handleScanProgress);
        window.electronAPI.onScanStatus(handleScanStatus);
        return true;
      }
      return false;
    };

    if (!setupListeners()) {
      const timeout = setTimeout(setupListeners, 100);
      return () => clearTimeout(timeout);
    }

    return () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.removeAllListeners('scan-progress');
        window.electronAPI.removeAllListeners('scan-status');
      }
    };
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLogs(['SCAN: Starting scan process...']);
      setScanState('running');
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleCancel = async () => {
    if (scanState === 'running') {
      try {
        await window.electronAPI.cancelScan();
        setScanState('cancelled');
      } catch (error) {
        console.error('Error cancelling scan:', error);
      }
    }
  };

  const handleClose = () => {
    if (scanState === 'success' || scanState === 'cancelled') {
      onCancel();
    }
  };

  const handleErrorAck = () => {
    setScanState('cancelled');
    onCancel();
  };

  // Auto-close on success after brief delay
  useEffect(() => {
    if (scanState === 'success') {
      const timeout = setTimeout(() => {
        onCancel();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [scanState, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-background-primary border border-border-primary rounded-md w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <h2 className="text-lg font-semibold text-foreground-primary">Scanning Application</h2>
          {scanState !== 'running' && (
            <button
              onClick={handleClose}
              className="text-foreground-secondary hover:text-foreground-primary transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Progress Content */}
        <div className="flex-1 p-6 min-h-0">
          {scanState === 'error' && (
            <div className="mb-4 p-4 bg-red-900 bg-opacity-20 border border-red-400 rounded flex items-start gap-3">
              <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <h3 className="text-sm font-medium text-red-400 mb-1">Scan Failed</h3>
                <p className="text-sm text-red-300">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Log Display */}
          <div className="bg-background-secondary border border-border-primary rounded p-4 h-96 overflow-hidden">
            <h3 className="text-sm font-medium text-foreground-primary mb-3">Scan Activity</h3>
            <div 
              ref={scrollRef}
              className="h-full overflow-y-auto font-mono text-xs text-foreground-secondary space-y-1"
            >
              {logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap break-words">
                  {log}
                </div>
              ))}
              {scanState === 'running' && (
                <div className="text-accent-primary animate-pulse">
                  ▊ Processing...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border-primary">
          {scanState === 'running' && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          )}
          
          {scanState === 'error' && (
            <button
              onClick={handleErrorAck}
              className="px-4 py-2 text-sm font-medium bg-accent-primary text-white rounded hover:bg-blue-600 transition-colors"
            >
              OK
            </button>
          )}

          {scanState === 'success' && (
            <div className="text-sm text-green-400 font-medium">
              Scan completed successfully
            </div>
          )}

          {scanState === 'cancelled' && (
            <div className="text-sm text-foreground-muted font-medium">
              Scan cancelled
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanProgressModal;
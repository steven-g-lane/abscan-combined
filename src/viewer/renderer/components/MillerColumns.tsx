import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Folder, icons } from 'lucide-react';

interface MillerColumnEntry {
  name: string;
  icon: string;
  children?: MillerColumnEntry[];
  metadata?: any;
}

interface MillerData {
  items: MillerColumnEntry[];
  root?: string; // Scan root path for resolving relative file paths
}

interface MillerColumnsProps {
  onItemSelect?: (item: MillerColumnEntry | null) => void;
  // Expose current column index for external use (grid clicks)
  onColumnStateChange?: (currentColumnIndex: number) => void;
  // Callback to notify when scan root is available
  onScanRootChange?: (scanRoot: string | null) => void;
}

// Expose the component methods via ref
export interface MillerColumnsRef {
  handleItemClick: (item: MillerColumnEntry, columnIndex: number, itemIndex: number) => void;
}

const MillerColumns = forwardRef<MillerColumnsRef, MillerColumnsProps>(({ onItemSelect, onColumnStateChange, onScanRootChange }, ref) => {
  console.log('=== MILLER COLUMNS COMPONENT MOUNTING ===');
  
  const [columns, setColumns] = useState<MillerColumnEntry[][]>([]);
  const [selectedPath, setSelectedPath] = useState<number[]>([]);
  const [selectedItems, setSelectedItems] = useState<MillerColumnEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState<boolean>(false);
  const [currentColumnIndex, setCurrentColumnIndex] = useState<number>(0);

  // Expose methods via ref for external use (grid clicks)
  useImperativeHandle(ref, () => ({
    handleItemClick: (item: MillerColumnEntry, columnIndex: number, itemIndex: number) => {
      handleItemClick(item, columnIndex, itemIndex);
    }
  }), [selectedPath, selectedItems, columns]);

  // Initialize empty state
  useEffect(() => {
    const initialColumns = new Array(4).fill([]);
    setColumns(initialColumns);
  }, []);

  // Listen for data from main process
  useEffect(() => {
    const handleLoadData = (data: any) => {
      console.log('=== MILLER COLUMNS RECEIVED DATA ===');
      console.log('Data type:', typeof data);
      console.log('Data keys:', data ? Object.keys(data) : 'null/undefined');
      console.log('Full data:', data);
      setLoading(true);
      setError(null);
      
      try {
        const millerData: MillerData = data;
        
        // Use standardized items format
        if (!data?.items || !Array.isArray(data.items)) {
          console.warn('Invalid data format - expected {items: [...]}:', data);
          setError('Invalid data format');
          setLoading(false);
          return;
        }
        
        const rootEntries: MillerColumnEntry[] = data.items;

        console.log('Root entries found:', rootEntries.length);
        console.log('Scan root path:', data.root);

        // Notify parent component about scan root for file path resolution
        if (onScanRootChange) {
          onScanRootChange(data.root || null);
        }

        // Initialize with root level data in first column
        const initialColumns = new Array(4).fill([]);
        initialColumns[0] = rootEntries;
        setColumns(initialColumns);
        setSelectedPath([]);
        setSelectedItems([]);
        setHasData(true);
        setLoading(false);
      } catch (err) {
        console.error('Error processing loaded data:', err);
        setError('Failed to process loaded data: ' + err.message);
        setLoading(false);
      }
    };

    const handleLoadError = (errorMessage: string) => {
      console.error('Miller columns received error:', errorMessage);
      setError(errorMessage);
      setLoading(false);
    };

    // Scan status handling moved to App.tsx for auto-load functionality

    // Wait for electronAPI to be available
    const setupListeners = () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        console.log('=== MILLER COLUMNS SETTING UP LISTENERS ===');
        window.electronAPI.onLoadMillerData(handleLoadData);
        window.electronAPI.onLoadMillerDataError(handleLoadError);
        console.log('Miller Columns listeners registered successfully');
        // Note: scan-status handling moved to App.tsx for auto-load functionality
        return true;
      }
      console.log('electronAPI not available for Miller Columns yet');
      return false;
    };

    // Try to set up listeners immediately
    if (!setupListeners()) {
      // If not available, wait a bit and try again
      const timeout = setTimeout(() => {
        if (!setupListeners()) {
          console.warn('electronAPI not available after timeout');
        }
      }, 100);
      
      return () => clearTimeout(timeout);
    }

    return () => {
      // Cleanup listeners
      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.removeAllListeners('load-miller-data');
        window.electronAPI.removeAllListeners('load-miller-data-error');
        // Note: scan-status cleanup handled in App.tsx
      }
    };
  }, []);

  const handleItemClick = (item: MillerColumnEntry, columnIndex: number, itemIndex: number) => {
    // Update selected path
    const newSelectedPath = selectedPath.slice(0, columnIndex);
    newSelectedPath[columnIndex] = itemIndex;
    setSelectedPath(newSelectedPath);
    
    // Update selected items path
    const newSelectedItems = selectedItems.slice(0, columnIndex);
    newSelectedItems[columnIndex] = item;
    setSelectedItems(newSelectedItems);

    // Track current column index for external use (grid clicks)
    setCurrentColumnIndex(columnIndex);
    
    // Notify parent of column state change
    if (onColumnStateChange) {
      onColumnStateChange(columnIndex);
    }

    // Scroll the selected item into view
    setTimeout(() => {
      const columnElement = document.querySelector(`[data-column-index="${columnIndex}"]`);
      const itemElement = columnElement?.querySelector(`[data-item-index="${itemIndex}"]`);

      if (itemElement && columnElement) {
        // Scroll the item into view, centered if possible
        itemElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 0);

    // Notify parent component of the selection
    if (onItemSelect) {
      onItemSelect(item);
    }

    if (item.children && item.children.length > 0) {
      // Calculate how many columns we need: selection path + children column + 1 blank
      const neededColumns = Math.max(4, columnIndex + 3);
      
      const newColumns = [...columns];
      
      // Ensure we have enough columns
      while (newColumns.length < neededColumns) {
        newColumns.push([]);
      }
      
      // Populate next column with children
      newColumns[columnIndex + 1] = item.children;
      
      // Clear columns after the children column
      for (let i = columnIndex + 2; i < newColumns.length; i++) {
        newColumns[i] = [];
      }
      
      setColumns(newColumns);
    } else {
      // Item has no children, clear subsequent columns but maintain minimum 4
      const newColumns = [...columns];
      for (let i = columnIndex + 1; i < newColumns.length; i++) {
        newColumns[i] = [];
      }
      setColumns(newColumns);
    }
  };

  // Dynamic icon rendering
  const renderIcon = (item: MillerColumnEntry) => {
    const iconName = item.icon || 'folder';
    
    try {
      // Convert kebab-case to PascalCase (e.g., 'circle-arrow-right' -> 'CircleArrowRight')
      const pascalCase = iconName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      
      const IconComponent = icons[pascalCase as keyof typeof icons] as React.ComponentType<any>;
      
      if (IconComponent) {
        return <IconComponent size={16} />;
      }
    } catch (error) {
      console.warn(`Icon '${iconName}' not found, using fallback`);
    }
    
    // Fallback to folder icon
    return <Folder size={16} />;
  };

  // Get item name for Miller column display
  const getItemName = (item: MillerColumnEntry): string => {
    return item.name || 'Unnamed Item';
  };

  // Get item name for breadcrumb display (includes filename for Source entries)
  const getBreadcrumbItemName = (item: MillerColumnEntry): string => {
    const itemName = item.name || 'Unnamed Item';

    // For Source entries, append the filename and line number to the breadcrumb
    if (itemName === 'Source' && item.metadata?.sourceFile) {
      const fullPath = item.metadata.sourceFile;
      const filename = fullPath.split('/').pop() || fullPath.split('\\').pop() || fullPath;
      const startLine = item.metadata.startLine;

      if (startLine !== undefined && startLine !== null) {
        return `${itemName} > ${filename}:${startLine}`;
      } else {
        return `${itemName} > ${filename}`;
      }
    }

    return itemName;
  };

  if (loading) {
    const displayMessage = scanStatus?.message || 'Loading data...';
    const footerMessage = scanStatus?.status === 'scanning' ? 'Scanning...' : 'Loading...';
    
    return (
      <div className="h-full relative bg-background-tertiary">
        <div className="absolute inset-0 bottom-[40px] flex items-center justify-center bg-background-secondary">
          <span className="text-sm text-foreground-secondary">{displayMessage}</span>
        </div>
        {/* Breadcrumb Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-[40px] p-2 border-t border-border-primary bg-background-secondary">
          <div className="text-xs text-foreground-muted">
            <span>{footerMessage}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full relative bg-background-tertiary">
        <div className="absolute inset-0 bottom-[40px] flex items-center justify-center bg-background-secondary">
          <div className="text-center">
            <span className="text-sm text-foreground-muted block mb-2">Error loading data</span>
            <span className="text-xs text-foreground-muted">{error}</span>
          </div>
        </div>
        {/* Breadcrumb Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-[40px] p-2 border-t border-border-primary bg-background-secondary">
          <div className="text-xs text-foreground-muted">
            <span>Error</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-background-tertiary overflow-hidden">
      <div className="w-full h-full flex flex-col">
        <div className="w-full flex-1 border border-[#262626] flex overflow-x-auto overflow-y-hidden min-h-0">
          {columns.map((columnData, columnIndex) => (
            <div
              key={columnIndex}
              data-column-index={columnIndex}
              className="w-[150px] h-full border-r border-[#262626] shrink-0 overflow-y-auto last:border-r-0 min-h-0 min-w-0"
            >
              {columnData?.length > 0 ? (
                <ul className="list-none p-0 m-0">
                  {columnData.map((item, itemIndex) => (
                    <li
                      key={`${columnIndex}-${itemIndex}`}
                      data-item-index={itemIndex}
                      onClick={() => handleItemClick(item, columnIndex, itemIndex)}
                      className={`px-[8px] py-[3px] leading-[1.2] text-[11px] text-[#cccccc] hover:bg-[#333] cursor-pointer ${
                        selectedPath[columnIndex] === itemIndex ? 'bg-[#555] text-white' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="shrink-0">
                          {renderIcon(item)}
                        </span>
                        <span className="truncate">{getItemName(item)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[11px] text-[#cccccc]">
                    {columnIndex === 0 ? (hasData ? 'No data' : 'Select File > Load File… to load data') : 'Empty'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="h-[30px] w-full bg-[#1a1a1a] border border-[#262626] border-t-0 flex items-center px-3 text-[13px] text-[#cccccc]">
          {selectedItems.length > 0 ? (
            <span>{selectedItems.map(item => getBreadcrumbItemName(item)).join(' > ')}</span>
          ) : (
            <span>No selection</span>
          )}
        </div>
      </div>
    </div>
  );
});

export default MillerColumns;
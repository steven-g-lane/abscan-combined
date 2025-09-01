import React, { useState, useEffect } from 'react';
import CodeDisplay from './CodeDisplay';
import ChildItemsGrid from './ChildItemsGrid';
import { directoryGridColumns, featurelessGridColumns } from './gridConfigurations';

interface BottomPanelItem {
  name?: string;
  item_name?: string;
  children?: BottomPanelItem[];
  metadata?: any;
}

interface BottomPanelProps {
  selectedItem?: BottomPanelItem | null;
}

const BottomPanel: React.FC<BottomPanelProps> = ({ selectedItem }) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if item is a file (leaf node with no children) or has children
  const isFile = selectedItem && (!selectedItem.children || selectedItem.children.length === 0);
  const hasChildren = selectedItem && selectedItem.children && selectedItem.children.length > 0;
  
  // Get file path from metadata
  const getFilePath = (item: BottomPanelItem): string | null => {
    return item?.metadata?.fullPath || item?.metadata?.path || null;
  };

  // Load file content when a file is selected
  useEffect(() => {
    const loadFileContent = async () => {
      if (!isFile || !selectedItem) {
        setFileContent(null);
        setError(null);
        return;
      }

      const filePath = getFilePath(selectedItem);
      if (!filePath) {
        setError('File path not available in metadata');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const content = await window.electronAPI.readFileContent(filePath);
        
        if (content.isBinary) {
          setError('Binary file - cannot display contents');
          setFileContent(null);
        } else if (content.lineCount > 5000) {
          setError(`File too large to display (${content.lineCount} lines)`);
          setFileContent(null);
        } else {
          setFileContent(content.text);
          setError(null);
        }
      } catch (err) {
        console.error('Error reading file:', err);
        setError(`Error reading file: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setFileContent(null);
      } finally {
        setLoading(false);
      }
    };

    loadFileContent();
  }, [selectedItem, isFile]);

  // Debug logging
  useEffect(() => {
    console.log('BottomPanel selectedItem changed:', {
      selectedItem: selectedItem,
      hasChildren: hasChildren,
      isFile: isFile,
      childrenLength: selectedItem?.children?.length,
      featurelessChildren: selectedItem?.metadata?.featurelessChildren
    });
  }, [selectedItem, hasChildren, isFile]);

  // Render content based on state
  const renderContent = () => {
    if (!selectedItem) {
      return (
        <div className="flex items-center justify-center h-full">
          <span className="text-foreground-muted text-sm">
            No item selected
          </span>
        </div>
      );
    }

    // Show data grid for items with children
    if (hasChildren) {
      try {
        // Check if the selected item has featureless children
        const isFeatureless = selectedItem.metadata?.featurelessChildren === true;
        const gridColumns = isFeatureless ? featurelessGridColumns : directoryGridColumns;
        
        return (
          <ChildItemsGrid
            data={selectedItem.children || []}
            columns={gridColumns}
            defaultSorting={[{ id: 'name', desc: false }]}
          />
        );
      } catch (error) {
        console.error('Error rendering ChildItemsGrid:', error);
        return (
          <div className="flex items-center justify-center h-full">
            <span className="text-foreground-muted text-sm">
              Error displaying child items: {error instanceof Error ? error.message : 'Unknown error'}
            </span>
          </div>
        );
      }
    }

    if (!isFile) {
      return (
        <div className="flex items-center justify-center h-full">
          <span className="text-foreground-muted text-sm">
            No item selected
          </span>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <span className="text-foreground-muted text-sm">
            Loading file contents...
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <span className="text-foreground-muted text-sm">
            {error}
          </span>
        </div>
      );
    }

    if (fileContent) {
      // Check if file has code type information for syntax highlighting
      const fileTypeInfo = selectedItem?.metadata?.fileTypeInfo;
      const isCode = fileTypeInfo?.isCode || false;
      const languageHint = fileTypeInfo?.languageHint;

      return (
        <CodeDisplay 
          content={fileContent}
          isCode={isCode}
          languageHint={languageHint}
        />
      );
    }

    return null;
  };

  return (
    <div className="h-full bg-background-primary border border-border-primary rounded overflow-hidden">
      {renderContent()}
    </div>
  );
};

export default BottomPanel;
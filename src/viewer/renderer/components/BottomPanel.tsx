import React, { useState, useEffect } from 'react';
import CodeDisplay from './CodeDisplay';
import ChildItemsGrid from './ChildItemsGrid';
import { directoryGridColumns, featurelessGridColumns, classSummaryGridColumns } from './gridConfigurations';

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
  
  // Check if item is a source navigation item (Source, method, or property)
  const isSourceNavigation = selectedItem?.metadata?.type && 
    ['source', 'method', 'property'].includes(selectedItem.metadata.type);
  const sourceFile = selectedItem?.metadata?.sourceFile;
  const startLine = selectedItem?.metadata?.startLine;
  const endLine = selectedItem?.metadata?.endLine;
  
  // Get file path from metadata
  const getFilePath = (item: BottomPanelItem): string | null => {
    return item?.metadata?.fullPath || item?.metadata?.path || null;
  };


  // Load file content when a file is selected or source navigation is requested
  useEffect(() => {
    const loadFileContent = async () => {
      // Handle source navigation (Source, method, property clicks)
      if (isSourceNavigation && sourceFile) {
        setLoading(true);
        setError(null);

        try {
          const content = await window.electronAPI.readFileContent(sourceFile);
          
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
          console.error('Error reading source file:', err);
          setError(`Error reading source file: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setFileContent(null);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Handle regular file selection
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
  }, [selectedItem, isFile, isSourceNavigation, sourceFile]);

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
        // Check if this is a class summary display
        const isClassSummary = selectedItem.metadata?.type === 'class_summary';
        if (isClassSummary && selectedItem.metadata?.summaryData) {
          return (
            <ChildItemsGrid
              data={selectedItem.metadata.summaryData}
              columns={classSummaryGridColumns}
              defaultSorting={[{ id: 'className', desc: false }]}
            />
          );
        }
        
        // Check if the selected item has featureless children
        const isFeatureless = selectedItem.metadata?.featurelessChildren === true;
        const gridColumns = isFeatureless ? featurelessGridColumns : directoryGridColumns;
        
        return (
          <ChildItemsGrid
            data={selectedItem.children || []}
            columns={gridColumns}
            defaultSorting={[]}
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

      // For source navigation, always treat as code and use stored language info
      const shouldUseSourceScrolling = isSourceNavigation;
      const sourceFileTypeInfo = selectedItem?.metadata?.fileTypeInfo;
      const codeLanguage = shouldUseSourceScrolling ? sourceFileTypeInfo?.languageHint || 'typescript' : languageHint;

      return (
        <CodeDisplay 
          content={fileContent}
          isCode={isCode || shouldUseSourceScrolling}
          languageHint={codeLanguage}
          scrollToLine={shouldUseSourceScrolling ? startLine : undefined}
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
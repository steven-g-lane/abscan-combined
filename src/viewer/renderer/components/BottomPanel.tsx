import React, { useState, useEffect } from 'react';
import CodeDisplay from './CodeDisplay';
import ChildItemsGrid from './ChildItemsGrid';
import ErrorBoundary from './ErrorBoundary';
import { directoryGridColumns, featurelessGridColumns, classSummaryGridColumns, methodReferenceGridColumns, methodGridColumns, functionsGridColumns } from './gridConfigurations';
import { MillerColumnsRef } from './MillerColumns';

interface BottomPanelItem {
  name?: string;
  item_name?: string;
  children?: BottomPanelItem[];
  metadata?: any;
}

interface BottomPanelProps {
  selectedItem?: BottomPanelItem | null;
  // Miller columns integration for grid row clicks
  millerColumnsRef?: React.RefObject<MillerColumnsRef>;
  currentColumnIndex?: number;
}

const BottomPanel: React.FC<BottomPanelProps> = ({ selectedItem, millerColumnsRef, currentColumnIndex }) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generic handler for grid row clicks - connects to miller column logic
  const handleGridRowClick = (clickedItem: any, rowIndex: number) => {
    console.log('🔄 Grid row clicked:', { clickedItem, rowIndex, currentColumnIndex, selectedItem: selectedItem?.name });
    
    if (!millerColumnsRef?.current) {
      console.warn('❌ Miller columns ref not available for grid click');
      return;
    }

    if (typeof currentColumnIndex !== 'number') {
      console.warn('❌ currentColumnIndex not available for grid click');
      return;
    }

    try {
      let targetItem = null;
      let targetColumnIndex = currentColumnIndex;
      let targetItemIndex = rowIndex;

      // Handle different grid types with different data mappings
      const isClassSummary = selectedItem?.metadata?.type === 'class_summary';
      const isFunctionSummary = selectedItem?.metadata?.type === 'function_summary';
      const isFunctionsSection = selectedItem?.name === 'Functions';
      const isMethodsSection = selectedItem?.name === 'Methods';

      if (isClassSummary || isFunctionSummary) {
        // Summary grids use processed data - need to map back to original items
        console.log('📊 Handling summary grid click');
        
        if (!selectedItem?.children || !Array.isArray(selectedItem.children)) {
          console.error('❌ Summary grid: selectedItem.children not available');
          return;
        }

        // Map grid row back to original item in selectedItem.children
        // The grid shows processed data, but we need the original navigation item
        if (rowIndex >= selectedItem.children.length) {
          console.error('❌ Grid row index out of bounds:', rowIndex, 'vs', selectedItem.children.length);
          return;
        }

        targetItem = selectedItem.children[rowIndex];
        // For summary grids, we want to navigate to the next column level
        targetColumnIndex = currentColumnIndex + 1;
        targetItemIndex = rowIndex;

        console.log('📊 Summary grid mapping:', { targetItem: targetItem?.name, targetColumnIndex, targetItemIndex });

      } else if (isFunctionsSection || isMethodsSection) {
        // Section grids use selectedItem.children directly - this should work as-is
        console.log('📋 Handling section grid click');
        
        if (!selectedItem?.children || !Array.isArray(selectedItem.children)) {
          console.error('❌ Section grid: selectedItem.children not available');
          return;
        }

        // For section grids, clickedItem should be the original navigation item
        targetItem = clickedItem;
        targetColumnIndex = currentColumnIndex + 1; // Navigate to next level
        targetItemIndex = rowIndex;

        console.log('📋 Section grid mapping:', { targetItem: targetItem?.name, targetColumnIndex, targetItemIndex });

      } else {
        // Directory or other grids - use clickedItem as-is
        console.log('📁 Handling directory/other grid click');
        targetItem = clickedItem;
        targetColumnIndex = currentColumnIndex + 1; // Navigate to next level
        targetItemIndex = rowIndex;

        console.log('📁 Directory grid mapping:', { targetItem: targetItem?.name, targetColumnIndex, targetItemIndex });
      }

      // Validate the target item has required navigation structure
      if (!targetItem) {
        console.error('❌ Could not determine target item for grid click');
        return;
      }

      if (!targetItem.name && !targetItem.item_name) {
        console.error('❌ Target item missing name property:', targetItem);
        return;
      }

      console.log('✅ Calling handleItemClick with:', {
        item: targetItem.name || targetItem.item_name,
        columnIndex: targetColumnIndex,
        itemIndex: targetItemIndex
      });

      // Call the miller column click handler with the properly mapped item
      millerColumnsRef.current.handleItemClick(targetItem, targetColumnIndex, targetItemIndex);

    } catch (error) {
      console.error('❌ Error in handleGridRowClick:', error);
    }
  };

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
              onRowClick={handleGridRowClick}
            />
          );
        }

        // Check if this is a function summary display
        const isFunctionSummary = selectedItem.metadata?.type === 'function_summary';
        if (isFunctionSummary && selectedItem.metadata?.summaryData) {
          return (
            <ChildItemsGrid
              data={selectedItem.metadata.summaryData}
              columns={functionsGridColumns}
              defaultSorting={[{ id: 'functionSignature', desc: false }]}
              onRowClick={handleGridRowClick}
            />
          );
        }

        // Check if this is a Functions section display
        const isFunctionsSection = selectedItem.name === 'Functions' && selectedItem.children;
        if (isFunctionsSection) {
          return (
            <ChildItemsGrid
              data={selectedItem.children}
              columns={functionsGridColumns}
              defaultSorting={[{ id: 'functionSignature', desc: false }]}
              onRowClick={handleGridRowClick}
            />
          );
        }

        // Check if this is a Methods section display
        const isMethodsSection = selectedItem.name === 'Methods' && selectedItem.children;
        if (isMethodsSection) {
          return (
            <ChildItemsGrid
              data={selectedItem.children}
              columns={methodGridColumns}
              defaultSorting={[{ id: 'methodSignature', desc: false }]}
              onRowClick={handleGridRowClick}
            />
          );
        }

        // Check if this is a method references display
        const isMethodReferences = selectedItem.metadata?.type === 'method_references';
        if (isMethodReferences && selectedItem.metadata?.referencesData) {
          return (
            <ChildItemsGrid
              data={selectedItem.metadata.referencesData.map((ref: any, index: number) => ({
                item_name: `Reference ${index + 1}`,
                metadata: {
                  type: 'method_reference',
                  sourceFile: ref.location.file,
                  line: ref.location.line,
                  contextLine: ref.contextLine,
                  context: ref.context,
                  referenceIndex: index
                }
              }))}
              columns={methodReferenceGridColumns}
              defaultSorting={[{ id: 'sourceFileName', desc: false }]}
              onRowClick={handleGridRowClick}
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
            onRowClick={handleGridRowClick}
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
        <ErrorBoundary fallback={
          <div className="flex items-center justify-center h-full">
            <span className="text-foreground-muted text-sm">
              Error displaying file content
            </span>
          </div>
        }>
          <CodeDisplay 
            content={fileContent}
            isCode={isCode || shouldUseSourceScrolling}
            languageHint={codeLanguage}
            scrollToLine={shouldUseSourceScrolling ? startLine : undefined}
          />
        </ErrorBoundary>
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
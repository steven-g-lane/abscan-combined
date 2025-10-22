import React, { useState, useEffect } from 'react';
import CodeDisplay from './CodeDisplay';
import ChildItemsGrid from './ChildItemsGrid';
import FilterableChildItemsGrid from './FilterableChildItemsGrid';
import ErrorBoundary from './ErrorBoundary';
import { directoryGridColumns, featurelessGridColumns, classSummaryGridColumns, methodReferenceGridColumns, classReferenceGridColumns, interfaceSummaryGridColumns, interfaceReferenceGridColumns, enumSummaryGridColumns, enumReferenceGridColumns, typeSummaryGridColumns, typeReferenceGridColumns, methodGridColumns, propertyGridColumns, functionsGridColumns, componentsGridColumns, interfaceFunctionGridColumns, flattenedMethodsGridColumns, flattenedFilesGridColumns } from './gridConfigurations';
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

  // Handler for grid row selection (single-click) - just for visual feedback, no navigation
  const handleGridRowSelection = (clickedItem: any, rowIndex: number) => {
    console.log('🔘 Grid row selected (no navigation):', { clickedItem, rowIndex });
    // Future: Could add selection state management here if needed
  };

  // Handler for grid row navigation (double-click) - connects to miller column logic
  const handleGridRowNavigation = (clickedItem: any, rowIndex: number) => {
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
      const isComponentSummary = selectedItem?.metadata?.type === 'component_summary';
      const isInterfaceSummary = selectedItem?.metadata?.type === 'interface_summary';
      const isInterfaceMethods = selectedItem?.metadata?.type === 'interface_methods';
      const isInterfaceProperties = selectedItem?.metadata?.type === 'interface_properties';
      const isEnumSummary = selectedItem?.metadata?.type === 'enum_summary';
      const isTypeSummary = selectedItem?.metadata?.type === 'type_summary';
      const isFlattenedMethodsSummary = selectedItem?.metadata?.type === 'flattened_methods_summary';
      const isFlattenedFilesSummary = selectedItem?.metadata?.type === 'flattened_files_summary';
      const isFunctionsSection = selectedItem?.name === 'Functions';
      const isComponentsSection = selectedItem?.name === 'Components';
      const isMethodsSection = selectedItem?.name === 'Methods';

      if (isClassSummary || isFunctionSummary || isComponentSummary || isInterfaceSummary || isInterfaceMethods || isInterfaceProperties || isEnumSummary || isTypeSummary || isFlattenedMethodsSummary || isFlattenedFilesSummary) {
        // Summary grids use processed data - need to map back to original items
        console.log('📊 Handling summary grid click');
        
        if (!selectedItem?.children || !Array.isArray(selectedItem.children)) {
          console.error('❌ Summary grid: selectedItem.children not available');
          return;
        }

        // For summary grids, we need to find the actual Miller column navigation item
        // that corresponds to the clicked summary item
        targetItem = null;
        targetItemIndex = -1;

        // First, try to find the match in selectedItem.children (the actual Miller column items)
        if (selectedItem?.children && Array.isArray(selectedItem.children)) {
          for (let i = 0; i < selectedItem.children.length; i++) {
            const child = selectedItem.children[i];
            if (child && child.item_name === clickedItem.item_name) {
              targetItem = child;
              targetItemIndex = i;
              break;
            }
          }
        }

        // If not found in children, try to find it in the original unfiltered data (summaryData)
        // and use that index to get the corresponding child
        if (targetItemIndex === -1 && selectedItem?.metadata?.summaryData && Array.isArray(selectedItem.metadata.summaryData)) {
          console.log('Could not find in selectedItem.children, trying metadata approach');
          for (let i = 0; i < selectedItem.metadata.summaryData.length; i++) {
            const summaryItem = selectedItem.metadata.summaryData[i];
            if (summaryItem && summaryItem.item_name === clickedItem.item_name) {
              targetItemIndex = i;
              // Get the corresponding Miller column item
              if (selectedItem.children && selectedItem.children[i]) {
                targetItem = selectedItem.children[i];
              }
              break;
            }
          }
        }

        if (!targetItem || targetItemIndex === -1) {
          console.error('❌ Could not find matching Miller column item for:', clickedItem.item_name);
          console.log('Available children:', selectedItem.children?.slice(0, 10).map(c => c?.item_name));
          return;
        }

        // For summary grids, we want to navigate to the next column level
        targetColumnIndex = currentColumnIndex + 1;

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
      console.error('❌ Error in handleGridRowNavigation:', error);
    }
  };

  // Check if item is a file (leaf node with no children) or has children
  const isFile = selectedItem && (!selectedItem.children || selectedItem.children.length === 0);
  const hasChildren = selectedItem && selectedItem.children && selectedItem.children.length > 0;
  
  // Check if item is a source navigation item (Source, method, property, method_reference, function_reference, class_reference, interface_reference, enum_reference, type_reference, property_source, property_reference, method_source)
  const isSourceNavigation = selectedItem?.metadata?.type && 
    ['source', 'method', 'property', 'method_reference', 'function_reference', 'class_reference', 'interface_reference', 'enum_reference', 'type_reference', 'property_source', 'property_reference', 'method_source'].includes(selectedItem.metadata.type);
  const sourceFile = selectedItem?.metadata?.sourceFile;
  const startLine = selectedItem?.metadata?.startLine;
  const endLine = selectedItem?.metadata?.endLine;
  
  // For method references, function references, class references, interface references, enum references, type references, and property references, use the line property as both scroll and highlight target
  const isMethodReference = selectedItem?.metadata?.type === 'method_reference';
  const isFunctionReference = selectedItem?.metadata?.type === 'function_reference';
  const isClassReference = selectedItem?.metadata?.type === 'class_reference';
  const isInterfaceReference = selectedItem?.metadata?.type === 'interface_reference';
  const isEnumReference = selectedItem?.metadata?.type === 'enum_reference';
  const isTypeReference = selectedItem?.metadata?.type === 'type_reference';
  const isPropertyReference = selectedItem?.metadata?.type === 'property_reference';
  const referenceLine = (isMethodReference || isFunctionReference || isClassReference || isInterfaceReference || isEnumReference || isTypeReference || isPropertyReference) ? selectedItem?.metadata?.line : undefined;
  
  // Get file path from metadata
  const getFilePath = (item: BottomPanelItem): string | null => {
    return item?.metadata?.fullPath || item?.metadata?.path || item?.metadata?.sourceFile || null;
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
            <FilterableChildItemsGrid
              data={selectedItem.metadata.summaryData}
              columns={classSummaryGridColumns}
              defaultSorting={[{ id: 'className', desc: false }]}
              onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
              filterPlaceholder="Class Name"
              filterColumn="className"
            />
          );
        }

        // Check if this is a flattened methods summary display (Issue #74)
        const isFlattenedMethodsSummary = selectedItem.metadata?.type === 'flattened_methods_summary';
        if (isFlattenedMethodsSummary && selectedItem.metadata?.summaryData) {
          return (
            <FilterableChildItemsGrid
              data={selectedItem.metadata.summaryData}
              columns={flattenedMethodsGridColumns}
              defaultSorting={[{ id: 'methodName', desc: false }]}
              onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
              filterPlaceholder="Method Name"
              filterColumn="methodName"
            />
          );
        }

        // Check if this is a flattened files summary display (Issue #76)
        const isFlattenedFilesSummary = selectedItem.metadata?.type === 'flattened_files_summary';
        if (isFlattenedFilesSummary && selectedItem.metadata?.summaryData) {
          return (
            <FilterableChildItemsGrid
              data={selectedItem.metadata.summaryData}
              columns={flattenedFilesGridColumns}
              defaultSorting={[{ id: 'fileName', desc: false }]}
              onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
              filterPlaceholder="Name"
              filterColumn="fileName"
            />
          );
        }

        // Check if this is a function summary display
        const isFunctionSummary = selectedItem.metadata?.type === 'function_summary';
        if (isFunctionSummary && selectedItem.metadata?.summaryData) {
          return (
            <FilterableChildItemsGrid
              data={selectedItem.metadata.summaryData}
              columns={functionsGridColumns}
              defaultSorting={[{ id: 'functionSignature', desc: false }]}
              onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
              filterPlaceholder="Function Name"
              filterColumn="functionSignature"
            />
          );
        }

        // Check if this is a component summary display
        const isComponentSummary = selectedItem.metadata?.type === 'component_summary';
        if (isComponentSummary && selectedItem.metadata?.summaryData) {
          return (
            <FilterableChildItemsGrid
              data={selectedItem.metadata.summaryData}
              columns={componentsGridColumns}
              defaultSorting={[{ id: 'componentName', desc: false }]}
              onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
              filterPlaceholder="Component Name"
              filterColumn="componentName"
            />
          );
        }

        // Check if this is an interface summary display
        const isInterfaceSummary = selectedItem.metadata?.type === 'interface_summary';
        if (isInterfaceSummary && selectedItem.metadata?.summaryData) {
          return (
            <FilterableChildItemsGrid
              data={selectedItem.metadata.summaryData}
              columns={interfaceSummaryGridColumns}
              defaultSorting={[{ id: 'interfaceName', desc: false }]}
              onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
              filterPlaceholder="Interface Name"
              filterColumn="interfaceName"
            />
          );
        }

        // Check if this is an interface methods display
        const isInterfaceMethods = selectedItem.metadata?.type === 'interface_methods';
        if (isInterfaceMethods && selectedItem.metadata?.summaryData) {
          return (
            <FilterableChildItemsGrid
              data={selectedItem.metadata.summaryData}
              columns={interfaceFunctionGridColumns}
              defaultSorting={[{ id: 'functionName', desc: false }]}
              onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
              filterPlaceholder="Function Name"
              filterColumn="functionName"
            />
          );
        }

        // Check if this is an interface properties display
        const isInterfaceProperties = selectedItem.metadata?.type === 'interface_properties';
        if (isInterfaceProperties && selectedItem.metadata?.summaryData) {
          return (
            <FilterableChildItemsGrid
              data={selectedItem.metadata.summaryData}
              columns={propertyGridColumns}
              defaultSorting={[{ id: 'propertyName', desc: false }]}
              onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
              filterPlaceholder="Property Name"
              filterColumn="propertyName"
            />
          );
        }

        // Check if this is an enum summary display
        const isEnumSummary = selectedItem.metadata?.type === 'enum_summary';
        if (isEnumSummary && selectedItem.metadata?.summaryData) {
          return (
            <FilterableChildItemsGrid
              data={selectedItem.metadata.summaryData}
              columns={enumSummaryGridColumns}
              defaultSorting={[{ id: 'enumName', desc: false }]}
              onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
              filterPlaceholder="Enum Name"
              filterColumn="enumName"
            />
          );
        }

        // Check if this is a type summary display
        const isTypeSummary = selectedItem.metadata?.type === 'type_summary';
        if (isTypeSummary && selectedItem.metadata?.summaryData) {
          return (
            <FilterableChildItemsGrid
              data={selectedItem.metadata.summaryData}
              columns={typeSummaryGridColumns}
              defaultSorting={[{ id: 'typeName', desc: false }]}
              onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
              filterPlaceholder="Type Name"
              filterColumn="typeName"
            />
          );
        }

        // Check if this is a Functions section display
        const isFunctionsSection = selectedItem.name === 'Functions' && selectedItem.children;
        if (isFunctionsSection) {
          return (
            <FilterableChildItemsGrid
              data={selectedItem.children}
              columns={functionsGridColumns}
              defaultSorting={[{ id: 'functionSignature', desc: false }]}
              onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
              filterPlaceholder="Function Name"
              filterColumn="functionSignature"
            />
          );
        }

        // Check if this is a Methods section display (handles "Methods (N)" format)
        const isMethodsSection = selectedItem.name?.startsWith('Methods') && selectedItem.children;
        if (isMethodsSection) {
          return (
            <FilterableChildItemsGrid
              data={selectedItem.children}
              columns={methodGridColumns}
              defaultSorting={[{ id: 'methodName', desc: false }]}
              onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
              filterPlaceholder="Method Name"
              filterColumn="methodName"
            />
          );
        }

        // Check if this is a method references display
        const isMethodReferences = selectedItem.metadata?.type === 'method_references';
        console.log('🔍 REFERENCES DEBUG: Checking method references', {
          isMethodReferences,
          hasReferencesData: !!selectedItem.metadata?.referencesData,
          featurelessChildren: selectedItem.metadata?.featurelessChildren,
          selectedItemName: selectedItem.name || selectedItem.item_name
        });
        
        if (isMethodReferences && selectedItem.metadata?.referencesData) {
          // If References should display as featureless, skip this special handling
          // and let it fall through to regular children display with meaningful names
          const useFeaturelessForReferences = selectedItem.metadata?.featurelessChildren === true;
          console.log('🔍 REFERENCES DEBUG: Method references handling', {
            useFeaturelessForReferences,
            willSkipSpecialHandling: useFeaturelessForReferences,
            childrenLength: selectedItem.children?.length
          });
          
          if (!useFeaturelessForReferences) {
            return (
              <FilterableChildItemsGrid
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
                onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
                filterPlaceholder="Source File"
                filterColumn="sourceFileName"
              />
            );
          }
          // If featureless, fall through to use actual children with meaningful names
        }
        
        // Check if this is a class references display
        const isClassReferences = selectedItem.metadata?.type === 'class_references';
        console.log('🔍 CLASS REFERENCES DEBUG: Checking class references', {
          isClassReferences,
          hasReferencesData: !!selectedItem.metadata?.referencesData,
          featurelessChildren: selectedItem.metadata?.featurelessChildren,
          selectedItemName: selectedItem.name || selectedItem.item_name
        });
        
        if (isClassReferences && selectedItem.metadata?.referencesData) {
          // If References should display as featureless, skip this special handling
          // and let it fall through to regular children display with meaningful names
          const useFeaturelessForReferences = selectedItem.metadata?.featurelessChildren === true;
          console.log('🔍 CLASS REFERENCES DEBUG: Class references handling', {
            useFeaturelessForReferences,
            willSkipSpecialHandling: useFeaturelessForReferences,
            childrenLength: selectedItem.children?.length
          });
          
          if (!useFeaturelessForReferences) {
            return (
              <FilterableChildItemsGrid
                data={selectedItem.metadata.referencesData.map((ref: any, index: number) => ({
                  item_name: `Reference ${index + 1}`,
                  metadata: {
                    type: 'class_reference',
                    sourceFile: ref.location.file,
                    line: ref.location.line,
                    contextLine: ref.contextLine,
                    context: ref.context,
                    referenceIndex: index
                  }
                }))}
                columns={classReferenceGridColumns}
                defaultSorting={[{ id: 'sourceFileName', desc: false }]}
                onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
                filterPlaceholder="Source File"
                filterColumn="sourceFileName"
              />
            );
          }
          // If featureless, fall through to use actual children with meaningful names
        }
        
        // Check if this is an interface references display
        const isInterfaceReferences = selectedItem.metadata?.type === 'interface_references';
        console.log('🔍 INTERFACE REFERENCES DEBUG: Checking interface references', {
          isInterfaceReferences,
          hasReferencesData: !!selectedItem.metadata?.referencesData,
          featurelessChildren: selectedItem.metadata?.featurelessChildren,
          selectedItemName: selectedItem.name || selectedItem.item_name
        });
        
        if (isInterfaceReferences && selectedItem.metadata?.referencesData) {
          // If References should display as featureless, skip this special handling
          // and let it fall through to regular children display with meaningful names
          const useFeaturelessForReferences = selectedItem.metadata?.featurelessChildren === true;
          console.log('🔍 INTERFACE REFERENCES DEBUG: Interface references handling', {
            useFeaturelessForReferences,
            willSkipSpecialHandling: useFeaturelessForReferences,
            childrenLength: selectedItem.children?.length
          });
          
          if (!useFeaturelessForReferences) {
            return (
              <FilterableChildItemsGrid
                data={selectedItem.metadata.referencesData.map((ref: any, index: number) => ({
                  item_name: `Reference ${index + 1}`,
                  metadata: {
                    type: 'interface_reference',
                    sourceFile: ref.location.file,
                    line: ref.location.line,
                    contextLine: ref.contextLine,
                    context: ref.context,
                    referenceIndex: index
                  }
                }))}
                columns={interfaceReferenceGridColumns}
                defaultSorting={[{ id: 'sourceFileName', desc: false }]}
                onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
                filterPlaceholder="Source File"
                filterColumn="sourceFileName"
              />
            );
          }
          // If featureless, fall through to use actual children with meaningful names
        }
        
        // Check if this is a property references display
        const isPropertyReferences = selectedItem.metadata?.type === 'property_references';
        console.log('🔍 PROPERTY REFERENCES DEBUG: Checking property references', {
          isPropertyReferences,
          hasReferencesData: !!selectedItem.metadata?.referencesData,
          featurelessChildren: selectedItem.metadata?.featurelessChildren,
          selectedItemName: selectedItem.name || selectedItem.item_name
        });
        
        if (isPropertyReferences && selectedItem.metadata?.referencesData) {
          // If References should display as featureless, skip this special handling
          // and let it fall through to regular children display with meaningful names
          const useFeaturelessForReferences = selectedItem.metadata?.featurelessChildren === true;
          console.log('🔍 PROPERTY REFERENCES DEBUG: Property references handling', {
            useFeaturelessForReferences,
            willSkipSpecialHandling: useFeaturelessForReferences,
            childrenLength: selectedItem.children?.length
          });
          
          if (!useFeaturelessForReferences) {
            return (
              <FilterableChildItemsGrid
                data={selectedItem.metadata.referencesData.map((ref: any, index: number) => ({
                  item_name: `Reference ${index + 1}`,
                  metadata: {
                    type: 'property_reference',
                    sourceFile: ref.location.file,
                    line: ref.location.line,
                    contextLine: ref.contextLine,
                    context: ref.context,
                    propertyName: selectedItem.metadata?.propertyName,
                    interfaceName: selectedItem.metadata?.interfaceName,
                    referenceIndex: index
                  }
                }))}
                columns={methodReferenceGridColumns} // Reuse method reference columns as they have similar structure
                defaultSorting={[{ id: 'sourceFileName', desc: false }]}
                onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
                filterPlaceholder="Source File"
                filterColumn="sourceFileName"
              />
            );
          }
          // If featureless, fall through to use actual children with meaningful names
        }
        
        // Check if this is an enum references display
        const isEnumReferences = selectedItem.metadata?.type === 'enum_references';
        console.log('🔍 ENUM REFERENCES DEBUG: Checking enum references', {
          isEnumReferences,
          hasReferencesData: !!selectedItem.metadata?.referencesData,
          featurelessChildren: selectedItem.metadata?.featurelessChildren,
          selectedItemName: selectedItem.name || selectedItem.item_name
        });
        
        if (isEnumReferences && selectedItem.metadata?.referencesData) {
          // If References should display as featureless, skip this special handling
          // and let it fall through to regular children display with meaningful names
          const useFeaturelessForReferences = selectedItem.metadata?.featurelessChildren === true;
          console.log('🔍 ENUM REFERENCES DEBUG: Enum references handling', {
            useFeaturelessForReferences,
            willSkipSpecialHandling: useFeaturelessForReferences,
            childrenLength: selectedItem.children?.length
          });
          
          if (!useFeaturelessForReferences) {
            return (
              <FilterableChildItemsGrid
                data={selectedItem.metadata.referencesData.map((ref: any, index: number) => ({
                  item_name: `Reference ${index + 1}`,
                  metadata: {
                    type: 'enum_reference',
                    sourceFile: ref.location.file,
                    line: ref.location.line,
                    contextLine: ref.contextLine,
                    context: ref.context,
                    referenceIndex: index
                  }
                }))}
                columns={enumReferenceGridColumns}
                defaultSorting={[{ id: 'sourceFileName', desc: false }]}
                onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
                filterPlaceholder="Source File"
                filterColumn="sourceFileName"
              />
            );
          }
          // If featureless, fall through to use actual children with meaningful names
        }
        
        // Check if this is a type references display
        const isTypeReferences = selectedItem.metadata?.type === 'type_references';
        console.log('🔍 TYPE REFERENCES DEBUG: Checking type references', {
          isTypeReferences,
          hasReferencesData: !!selectedItem.metadata?.referencesData,
          featurelessChildren: selectedItem.metadata?.featurelessChildren,
          selectedItemName: selectedItem.name || selectedItem.item_name
        });
        
        if (isTypeReferences && selectedItem.metadata?.referencesData) {
          // If References should display as featureless, skip this special handling
          // and let it fall through to regular children display with meaningful names
          const useFeaturelessForReferences = selectedItem.metadata?.featurelessChildren === true;
          console.log('🔍 TYPE REFERENCES DEBUG: Type references handling', {
            useFeaturelessForReferences,
            willSkipSpecialHandling: useFeaturelessForReferences,
            childrenLength: selectedItem.children?.length
          });
          
          if (!useFeaturelessForReferences) {
            return (
              <FilterableChildItemsGrid
                data={selectedItem.metadata.referencesData.map((ref: any, index: number) => ({
                  item_name: `Reference ${index + 1}`,
                  metadata: {
                    type: 'type_reference',
                    sourceFile: ref.location.file,
                    line: ref.location.line,
                    contextLine: ref.contextLine,
                    context: ref.context,
                    referenceIndex: index
                  }
                }))}
                columns={typeReferenceGridColumns}
                defaultSorting={[{ id: 'sourceFileName', desc: false }]}
                onRowClick={handleGridRowSelection}
              onRowDoubleClick={handleGridRowNavigation}
                filterPlaceholder="Source File"
                filterColumn="sourceFileName"
              />
            );
          }
          // If featureless, fall through to use actual children with meaningful names
        }
        
        // Check if the selected item has featureless children or contains individual methods/properties
        const isFeatureless = selectedItem.metadata?.featurelessChildren === true ||
                             selectedItem.children?.some(child =>
                               child.metadata?.type === 'method' ||
                               child.metadata?.type === 'property' ||
                               child.metadata?.type === 'function' ||
                               child.metadata?.type === 'interface_property' ||
                               child.metadata?.type === 'interface_function'
                             );
        const gridColumns = isFeatureless ? featurelessGridColumns : directoryGridColumns;
        
        console.log('🔍 REFERENCES DEBUG: Regular children display', {
          isFeatureless,
          gridColumnsType: isFeatureless ? 'featurelessGridColumns' : 'directoryGridColumns',
          columnsCount: gridColumns.length,
          firstColumnId: gridColumns[0]?.id,
          childrenCount: selectedItem.children?.length,
          firstChildName: selectedItem.children?.[0]?.name || selectedItem.children?.[0]?.item_name
        });
        
        return (
          <FilterableChildItemsGrid
            data={selectedItem.children || []}
            columns={gridColumns}
            defaultSorting={[]}
            onRowClick={handleGridRowSelection}
            onRowDoubleClick={handleGridRowNavigation}
            filterPlaceholder="Name"
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
            scrollToLine={shouldUseSourceScrolling ? ((isMethodReference || isFunctionReference || isClassReference || isInterfaceReference || isEnumReference || isTypeReference) ? referenceLine : startLine) : undefined}
            highlightLine={(isMethodReference || isFunctionReference || isClassReference || isInterfaceReference || isEnumReference || isTypeReference) ? referenceLine : undefined}
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
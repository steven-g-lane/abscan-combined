import fs from 'fs-extra';
import path from 'path';
import { ComprehensiveFunctionSummary } from '../models';
import { FileSystemResult, FileSystemEntry } from '../scanner/fileSystemScanner';

export interface ComponentMillerColumnsEntry {
  item_name: string;
  lucide_icon: string;
  children?: ComponentMillerColumnsEntry[];
  metadata?: any;
}

export interface ComponentMillerColumnsResult {
  root: string;
  transformedAt: string;
  column_entries: ComponentMillerColumnsEntry[];
}

// Helper function to find file type info from file system scan results
function findFileTypeInfo(filePath: string, fileSystemData?: FileSystemResult): any {
  if (!fileSystemData) return undefined;
  
  function searchEntries(entries: FileSystemEntry[]): any {
    for (const entry of entries) {
      if (entry.metadata?.fullPath === filePath) {
        return entry.metadata?.fileTypeInfo;
      }
      if (entry.children) {
        const found = searchEntries(entry.children);
        if (found) return found;
      }
    }
    return undefined;
  }
  
  return searchEntries(fileSystemData.entries);
}

export function transformComponentToMillerColumns(
  componentData: ComprehensiveFunctionSummary,
  fileSystemData?: FileSystemResult
): ComponentMillerColumnsEntry {
  const paramStr = componentData.parameters.map(p => 
    `${p.name}${p.displayType ? `: ${p.displayType}` : ''}`
  ).join(', ');
  
  const signature = `${componentData.name}(${paramStr})${componentData.resolvedReturnType ? `: ${componentData.resolvedReturnType}` : ''}`;
  
  const entry: ComponentMillerColumnsEntry = {
    item_name: signature,
    lucide_icon: 'wrench',
    children: [],
    metadata: {
      ...componentData,
      type: 'component',
      featurelessChildren: true
    }
  };

  // Source section - provides direct navigation to component definition
  const fileTypeInfo = findFileTypeInfo(componentData.location.file, fileSystemData);
  const sourceSection: ComponentMillerColumnsEntry = {
    item_name: 'Source',
    lucide_icon: 'file-text',
    metadata: {
      type: 'source',
      sourceFile: componentData.location.file,
      startLine: componentData.location.line,
      endLine: componentData.location.endLine || componentData.location.line,
      functionName: componentData.name,
      fileTypeInfo: fileTypeInfo
    }
  };
  entry.children!.push(sourceSection);

  // Note: We continue reference counting for components but don't display References section
  // as per the story requirements

  // Remove empty children array if no children were added
  if (entry.children!.length === 0) {
    delete entry.children;
  }

  return entry;
}

export function createComponentMillerColumnsResult(
  components: ComprehensiveFunctionSummary[],
  projectRoot: string,
  fileSystemData?: FileSystemResult
): ComponentMillerColumnsResult {
  // Create individual component entries for drill-down navigation
  const componentEntries = components
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(componentData => transformComponentToMillerColumns(componentData, fileSystemData));

  // Create component summary entries for root-level grid display
  // Only 3 columns: Signature, Source File, Line Count (no reference count)
  const componentSummaryEntries = components.map(componentData => ({
    item_name: componentData.name,
    lucide_icon: 'wrench',
    metadata: {
      name: componentData.name,
      sourceFilename: componentData.sourceFilename,
      sourceLOC: componentData.sourceLOC,
      isExported: componentData.isExported
      // Note: referenceCount is intentionally omitted
    }
  }));

  const millerColumnsResult: ComponentMillerColumnsResult = {
    root: projectRoot,
    transformedAt: new Date().toISOString(),
    column_entries: [
      {
        item_name: `Components (${components.length})`,
        lucide_icon: 'wrench',
        children: componentEntries,
        metadata: {
          type: 'component_summary',
          summaryData: componentSummaryEntries
        }
      }
    ]
  };

  return millerColumnsResult;
}
import fs from 'fs-extra';
import path from 'path';
import { InterfaceAnalysisResult, ComprehensiveInterfaceSummary } from '../models';
import { FileSystemResult, FileSystemEntry } from '../scanner/fileSystemScanner';

export interface InterfaceMillerColumnsEntry {
  item_name: string;
  lucide_icon: string;
  styling?: string;
  isLocal?: boolean;
  children?: InterfaceMillerColumnsEntry[];
  metadata?: any; // Optional metadata from source data
}

export interface InterfaceMillerColumnsResult {
  root: string;
  transformedAt: string;
  column_entries: InterfaceMillerColumnsEntry[];
}

// Helper function to find file type info from file system scan results
function findFileTypeInfo(filePath: string, fileSystemData?: FileSystemResult): any {
  if (!fileSystemData) return undefined;
  
  // Recursively search through file system entries
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

export function transformInterfaceToMillerColumns(
  interfaceData: ComprehensiveInterfaceSummary,
  fileSystemData?: FileSystemResult
): InterfaceMillerColumnsEntry {
  const entry: InterfaceMillerColumnsEntry = {
    item_name: interfaceData.name,
    lucide_icon: interfaceData.isLocal ? 'file-type' : 'file-down',
    isLocal: interfaceData.isLocal,
    children: [],
    metadata: {
      ...interfaceData,
      featurelessChildren: true // Flag interface entries as having featureless children
    }
  };

  // For local interfaces, create Source section
  if (interfaceData.isLocal) {
    // Source section - provides direct navigation to interface definition
    if (interfaceData.location) {
      const fileTypeInfo = findFileTypeInfo(interfaceData.location.file, fileSystemData);
      const sourceSection: InterfaceMillerColumnsEntry = {
        item_name: 'Source',
        lucide_icon: 'file-text',
        metadata: {
          type: 'source',
          sourceFile: interfaceData.location.file,
          startLine: interfaceData.location.line,
          endLine: interfaceData.location.endLine || interfaceData.location.line,
          interfaceName: interfaceData.name,
          fileTypeInfo: fileTypeInfo
        }
      };
      entry.children!.push(sourceSection);
    }
  }

  // References section for all interfaces (local and imported)
  if (interfaceData.references && interfaceData.references.length > 0) {
    const referencesSection: InterfaceMillerColumnsEntry = {
      item_name: `References (${interfaceData.references.length})`,
      lucide_icon: 'arrow-right-left',
      children: interfaceData.references.map((ref, index) => {
        // Extract filename from full path
        const filename = ref.location.file.split('/').pop() || ref.location.file;
        return {
          item_name: `${filename}:${ref.location.line}${ref.context ? ` (${ref.context})` : ''}`,
          lucide_icon: 'arrow-right-left',
          metadata: {
            type: 'interface_reference',
            sourceFile: ref.location.file,
            line: ref.location.line,
            contextLine: ref.contextLine,
            context: ref.context,
            referenceIndex: index
          }
        };
      }),
      metadata: {
        type: 'interface_references',
        interfaceName: interfaceData.name,
        referencesData: interfaceData.references,
        featurelessChildren: true // References entries display as simple name-only navigation
      }
    };
    entry.children!.push(referencesSection);
  }

  // Remove empty children array if no children were added
  if (entry.children!.length === 0) {
    delete entry.children;
  }

  return entry;
}

export async function transformInterfaceAnalysisToMillerColumns(
  interfaceAnalysisResult: InterfaceAnalysisResult,
  fileSystemData?: FileSystemResult
): Promise<InterfaceMillerColumnsResult> {
  // Create individual interface entries for drill-down navigation
  const interfaceEntries = interfaceAnalysisResult.interfaces
    .sort((a, b) => {
      // Sort local interfaces first, then by name
      if (a.isLocal && !b.isLocal) return -1;
      if (!a.isLocal && b.isLocal) return 1;
      return a.name.localeCompare(b.name);
    })
    .map(interfaceData => transformInterfaceToMillerColumns(interfaceData, fileSystemData));

  // Create interface summary entries for root-level grid display
  const interfaceSummaryEntries = interfaceAnalysisResult.interfaces.map(interfaceData => ({
    item_name: interfaceData.name,
    lucide_icon: interfaceData.isLocal ? 'file-type' : 'file-down',
    metadata: {
      name: interfaceData.name,
      sourceFilename: interfaceData.sourceFilename,
      sourceLOC: interfaceData.sourceLOC,
      referenceCount: interfaceData.referenceCount,
      isLocal: interfaceData.isLocal
    }
  }));

  const millerColumnsResult: InterfaceMillerColumnsResult = {
    root: interfaceAnalysisResult.projectRoot,
    transformedAt: new Date().toISOString(),
    column_entries: [
      {
        item_name: `Interfaces (${interfaceAnalysisResult.interfaces.length})`,
        lucide_icon: 'file-type',
        children: interfaceEntries,
        metadata: {
          type: 'interface_summary',
          summaryData: interfaceSummaryEntries
        }
      }
    ]
  };

  return millerColumnsResult;
}

export async function emitInterfaceMillerColumnsJson(
  interfaceMillerColumnsResult: InterfaceMillerColumnsResult, 
  outputPath: string
): Promise<void> {
  await fs.writeJson(outputPath, interfaceMillerColumnsResult, { spaces: 2 });
}

export async function loadInterfaceAnalysis(filePath: string): Promise<InterfaceAnalysisResult> {
  return await fs.readJson(filePath);
}
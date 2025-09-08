import fs from 'fs-extra';
import path from 'path';
import { TypeAnalysisResult, ComprehensiveTypeSummary } from '../models';
import { FileSystemResult, FileSystemEntry } from '../scanner/fileSystemScanner';

export interface TypeMillerColumnsEntry {
  item_name: string;
  lucide_icon: string;
  styling?: string;
  isLocal?: boolean;
  children?: TypeMillerColumnsEntry[];
  metadata?: any; // Optional metadata from source data
}

export interface TypeMillerColumnsResult {
  root: string;
  transformedAt: string;
  column_entries: TypeMillerColumnsEntry[];
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

export function transformTypeToMillerColumns(
  typeData: ComprehensiveTypeSummary,
  fileSystemData?: FileSystemResult
): TypeMillerColumnsEntry {
  const entry: TypeMillerColumnsEntry = {
    item_name: typeData.name,
    lucide_icon: typeData.isLocal ? 'type' : 'file-down',
    isLocal: typeData.isLocal,
    children: [],
    metadata: {
      ...typeData,
      featurelessChildren: true // Flag type entries as having featureless children
    }
  };

  // For local types, create Source section
  if (typeData.isLocal) {
    // Source section - provides direct navigation to type definition
    if (typeData.location) {
      const fileTypeInfo = findFileTypeInfo(typeData.location.file, fileSystemData);
      const sourceSection: TypeMillerColumnsEntry = {
        item_name: 'Source',
        lucide_icon: 'file-text',
        metadata: {
          type: 'source',
          sourceFile: typeData.location.file,
          startLine: typeData.location.line,
          endLine: typeData.location.endLine || typeData.location.line,
          typeName: typeData.name,
          fileTypeInfo: fileTypeInfo
        }
      };
      entry.children!.push(sourceSection);
    }
  }

  // References section for all types (local and imported)
  if (typeData.references && typeData.references.length > 0) {
    const referencesSection: TypeMillerColumnsEntry = {
      item_name: `References (${typeData.references.length})`,
      lucide_icon: 'arrow-right-left',
      children: typeData.references.map((ref, index) => {
        // Extract filename from full path
        const filename = ref.location.file.split('/').pop() || ref.location.file;
        return {
          item_name: `${filename}:${ref.location.line}${ref.context ? ` (${ref.context})` : ''}`,
          lucide_icon: 'arrow-right-left',
          metadata: {
            type: 'type_reference',
            sourceFile: ref.location.file,
            line: ref.location.line,
            contextLine: ref.contextLine,
            context: ref.context,
            referenceIndex: index
          }
        };
      }),
      metadata: {
        type: 'type_references',
        typeName: typeData.name,
        referencesData: typeData.references,
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

export async function transformTypeAnalysisToMillerColumns(
  typeAnalysisResult: TypeAnalysisResult,
  fileSystemData?: FileSystemResult
): Promise<TypeMillerColumnsResult> {
  // Create individual type entries for drill-down navigation
  const typeEntries = typeAnalysisResult.types
    .sort((a, b) => {
      // Sort local types first, then by name
      if (a.isLocal && !b.isLocal) return -1;
      if (!a.isLocal && b.isLocal) return 1;
      return a.name.localeCompare(b.name);
    })
    .map(typeData => transformTypeToMillerColumns(typeData, fileSystemData));

  // Create type summary entries for root-level grid display
  const typeSummaryEntries = typeAnalysisResult.types.map(typeData => ({
    item_name: typeData.name,
    lucide_icon: typeData.isLocal ? 'type' : 'file-down',
    metadata: {
      name: typeData.name,
      sourceFilename: typeData.sourceFilename,
      sourceLOC: typeData.sourceLOC,
      referenceCount: typeData.referenceCount,
      isLocal: typeData.isLocal,
      typeDefinition: typeData.typeDefinition
    }
  }));

  const millerColumnsResult: TypeMillerColumnsResult = {
    root: typeAnalysisResult.projectRoot,
    transformedAt: new Date().toISOString(),
    column_entries: [
      {
        item_name: `Types (${typeAnalysisResult.types.length})`,
        lucide_icon: 'type',
        children: typeEntries,
        metadata: {
          type: 'type_summary',
          summaryData: typeSummaryEntries
        }
      }
    ]
  };

  return millerColumnsResult;
}

export async function emitTypeMillerColumnsJson(
  typeMillerColumnsResult: TypeMillerColumnsResult, 
  outputPath: string
): Promise<void> {
  await fs.writeJson(outputPath, typeMillerColumnsResult, { spaces: 2 });
}

export async function loadTypeAnalysis(filePath: string): Promise<TypeAnalysisResult> {
  return await fs.readJson(filePath);
}
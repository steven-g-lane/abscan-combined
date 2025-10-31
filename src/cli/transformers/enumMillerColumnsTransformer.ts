import fs from 'fs-extra';
import path from 'path';
import { EnumAnalysisResult, ComprehensiveEnumSummary } from '../models';
import { FileSystemResult, FileSystemEntry } from '../scanner/fileSystemScanner';
import { formatClassReferenceTitle } from '../utils/referenceDisplayUtils';

export interface EnumMillerColumnsEntry {
  item_name: string;
  lucide_icon: string;
  styling?: string;
  isLocal?: boolean;
  children?: EnumMillerColumnsEntry[];
  metadata?: any; // Optional metadata from source data
}

export interface EnumMillerColumnsResult {
  root: string;
  transformedAt: string;
  column_entries: EnumMillerColumnsEntry[];
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

export function transformEnumToMillerColumns(
  enumData: ComprehensiveEnumSummary,
  fileSystemData?: FileSystemResult
): EnumMillerColumnsEntry {
  const entry: EnumMillerColumnsEntry = {
    item_name: enumData.name,
    lucide_icon: enumData.isLocal ? 'list' : 'file-down',
    isLocal: enumData.isLocal,
    children: [],
    metadata: {
      ...enumData,
      featurelessChildren: true // Flag enum entries as having featureless children
    }
  };

  // For local enums, create Source section
  if (enumData.isLocal) {
    // Source section - provides direct navigation to enum definition
    if (enumData.location) {
      const fileTypeInfo = findFileTypeInfo(enumData.location.file, fileSystemData);
      const sourceSection: EnumMillerColumnsEntry = {
        item_name: 'Source',
        lucide_icon: 'file-text',
        metadata: {
          type: 'source',
          sourceFile: enumData.location.file,
          startLine: enumData.location.line,
          endLine: enumData.location.endLine || enumData.location.line,
          enumName: enumData.name,
          fileTypeInfo: fileTypeInfo
        }
      };
      entry.children!.push(sourceSection);
    }
  }

  // References section for all enums (local and imported)
  if (enumData.references && enumData.references.length > 0) {
    const referencesSection: EnumMillerColumnsEntry = {
      item_name: formatClassReferenceTitle(enumData),
      lucide_icon: 'arrow-right-left',
      children: enumData.references.map((ref, index) => {
        // Extract filename from full path
        const filename = ref.location.file.split('/').pop() || ref.location.file;
        return {
          item_name: `${filename}:${ref.location.line}${ref.context ? ` (${ref.context})` : ''}`,
          lucide_icon: 'arrow-right-left',
          metadata: {
            type: 'enum_reference',
            sourceFile: ref.location.file,
            line: ref.location.line,
            contextLine: ref.contextLine,
            context: ref.context,
            referenceIndex: index
          }
        };
      }),
      metadata: {
        type: 'enum_references',
        enumName: enumData.name,
        referencesData: enumData.references,
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

export async function transformEnumAnalysisToMillerColumns(
  enumAnalysisResult: EnumAnalysisResult,
  fileSystemData?: FileSystemResult
): Promise<EnumMillerColumnsResult> {
  // Create individual enum entries for drill-down navigation
  const enumEntries = enumAnalysisResult.enums
    .sort((a, b) => {
      // Sort local enums first, then by name
      if (a.isLocal && !b.isLocal) return -1;
      if (!a.isLocal && b.isLocal) return 1;
      return a.name.localeCompare(b.name);
    })
    .map(enumData => transformEnumToMillerColumns(enumData, fileSystemData));

  // Create enum summary entries for root-level grid display
  const enumSummaryEntries = enumAnalysisResult.enums.map(enumData => ({
    item_name: enumData.name,
    lucide_icon: enumData.isLocal ? 'list' : 'file-down',
    metadata: {
      name: enumData.name,
      sourceFilename: enumData.sourceFilename,
      sourceLOC: enumData.sourceLOC,
      referenceCount: enumData.referenceCount,
      isLocal: enumData.isLocal
    }
  }));

  const millerColumnsResult: EnumMillerColumnsResult = {
    root: enumAnalysisResult.projectRoot,
    transformedAt: new Date().toISOString(),
    column_entries: [
      {
        item_name: `Enums (${enumAnalysisResult.enums.length})`,
        lucide_icon: 'list',
        children: enumEntries,
        metadata: {
          type: 'enum_summary',
          summaryData: enumSummaryEntries
        }
      }
    ]
  };

  return millerColumnsResult;
}

export async function emitEnumMillerColumnsJson(
  enumMillerColumnsResult: EnumMillerColumnsResult, 
  outputPath: string
): Promise<void> {
  await fs.writeJson(outputPath, enumMillerColumnsResult, { spaces: 2 });
}

export async function loadEnumAnalysis(filePath: string): Promise<EnumAnalysisResult> {
  return await fs.readJson(filePath);
}
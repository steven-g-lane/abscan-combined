import fs from 'fs-extra';
import path from 'path';
import { FunctionAnalysisResult, ComprehensiveFunctionSummary } from '../models';
import { FileSystemResult, FileSystemEntry } from '../scanner/fileSystemScanner';

export interface FunctionMillerColumnsEntry {
  item_name: string;
  lucide_icon: string;
  children?: FunctionMillerColumnsEntry[];
  metadata?: any;
}

export interface FunctionMillerColumnsResult {
  root: string;
  transformedAt: string;
  column_entries: FunctionMillerColumnsEntry[];
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

export function transformFunctionToMillerColumns(
  functionData: ComprehensiveFunctionSummary,
  fileSystemData?: FileSystemResult
): FunctionMillerColumnsEntry {
  const paramStr = functionData.parameters.map(p => 
    `${p.name}${p.displayType ? `: ${p.displayType}` : ''}`
  ).join(', ');
  
  const signature = `${functionData.name}(${paramStr})${functionData.resolvedReturnType ? `: ${functionData.resolvedReturnType}` : ''}`;
  
  const entry: FunctionMillerColumnsEntry = {
    item_name: signature,
    lucide_icon: 'zap',
    children: [],
    metadata: {
      ...functionData,
      type: 'function',
      featurelessChildren: true
    }
  };

  // Source section - provides direct navigation to function definition
  const fileTypeInfo = findFileTypeInfo(functionData.location.file, fileSystemData);
  const sourceSection: FunctionMillerColumnsEntry = {
    item_name: 'Source',
    lucide_icon: 'file-text',
    metadata: {
      type: 'source',
      sourceFile: functionData.location.file,
      startLine: functionData.location.line,
      endLine: functionData.location.endLine || functionData.location.line,
      functionName: functionData.name,
      fileTypeInfo: fileTypeInfo
    }
  };
  entry.children!.push(sourceSection);

  // References section (if references exist)
  if (functionData.references && functionData.references.length > 0) {
    const referencesSection: FunctionMillerColumnsEntry = {
      item_name: `References (${functionData.references.length})`,
      lucide_icon: 'arrow-right-left',
      children: functionData.references.map(ref => {
        const filename = path.basename(ref.location.file);
        return {
          item_name: `${filename}:${ref.location.line}`,
          lucide_icon: 'arrow-right-left',
          metadata: {
            type: 'function_reference',
            sourceFile: ref.location.file,
            line: ref.location.line,
            contextLine: ref.contextLine,
            context: ref.context
          }
        };
      }),
      metadata: {
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

export async function transformFunctionAnalysisToMillerColumns(
  functionAnalysisResult: FunctionAnalysisResult,
  fileSystemData?: FileSystemResult
): Promise<FunctionMillerColumnsResult> {
  // Create individual function entries for drill-down navigation
  const functionEntries = functionAnalysisResult.functions
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(functionData => transformFunctionToMillerColumns(functionData, fileSystemData));

  // Create function summary entries for root-level grid display
  const functionSummaryEntries = functionAnalysisResult.functions.map(functionData => ({
    item_name: functionData.name,
    lucide_icon: 'zap',
    metadata: {
      name: functionData.name,
      sourceFilename: functionData.sourceFilename,
      sourceLOC: functionData.sourceLOC,
      referenceCount: functionData.referenceCount,
      isExported: functionData.isExported
    }
  }));

  const millerColumnsResult: FunctionMillerColumnsResult = {
    root: functionAnalysisResult.projectRoot,
    transformedAt: new Date().toISOString(),
    column_entries: [
      {
        item_name: 'Functions',
        lucide_icon: 'zap',
        children: functionEntries,
        metadata: {
          type: 'function_summary',
          summaryData: functionSummaryEntries
        }
      }
    ]
  };

  return millerColumnsResult;
}

export async function emitFunctionMillerColumnsJson(
  functionMillerColumnsResult: FunctionMillerColumnsResult, 
  outputPath: string
): Promise<void> {
  await fs.writeJson(outputPath, functionMillerColumnsResult, { spaces: 2 });
}

export async function loadFunctionAnalysis(filePath: string): Promise<FunctionAnalysisResult> {
  return await fs.readJson(filePath);
}
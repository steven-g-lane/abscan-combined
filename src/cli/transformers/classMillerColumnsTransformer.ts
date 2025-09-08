import fs from 'fs-extra';
import path from 'path';
import { ClassAnalysisResult, ComprehensiveClassSummary } from '../models';
import { FileSystemResult, FileSystemEntry } from '../scanner/fileSystemScanner';

export interface ClassMillerColumnsEntry {
  item_name: string;
  lucide_icon: string;
  styling?: string;
  isLocal?: boolean;
  children?: ClassMillerColumnsEntry[];
  metadata?: any; // Optional metadata from source data
}

export interface ClassMillerColumnsResult {
  root: string;
  transformedAt: string;
  column_entries: ClassMillerColumnsEntry[];
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

export function transformClassToMillerColumns(
  classData: ComprehensiveClassSummary,
  fileSystemData?: FileSystemResult
): ClassMillerColumnsEntry {
  const entry: ClassMillerColumnsEntry = {
    item_name: classData.name,
    lucide_icon: classData.isLocal ? 'file-code-2' : 'file-down',
    isLocal: classData.isLocal,
    children: [],
    metadata: {
      ...classData,
      featurelessChildren: true // Flag class entries as having featureless children
    }
  };

  // For local classes, create Source, Properties, and Methods sections
  if (classData.isLocal) {
    // Source section - provides direct navigation to class definition
    if (classData.location) {
      const fileTypeInfo = findFileTypeInfo(classData.location.file, fileSystemData);
      const sourceSection: ClassMillerColumnsEntry = {
        item_name: 'Source',
        lucide_icon: 'file-text',
        metadata: {
          type: 'source',
          sourceFile: classData.location.file,
          startLine: classData.location.line,
          endLine: classData.location.endLine || classData.location.line,
          className: classData.name,
          fileTypeInfo: fileTypeInfo
        }
      };
      entry.children!.push(sourceSection);
    }

    // Properties section
    if (classData.properties && classData.properties.length > 0) {
      const propertiesSection: ClassMillerColumnsEntry = {
        item_name: 'Properties',
        lucide_icon: 'settings',
        children: classData.properties.map(prop => {
          const propFileTypeInfo = findFileTypeInfo(prop.location.file, fileSystemData);
          return {
            item_name: `${prop.name}: ${prop.displayType || prop.type || 'unknown'}${prop.isStatic ? ' (static)' : ''}${prop.visibility !== 'public' ? ` (${prop.visibility})` : ''}`,
            lucide_icon: 'variable',
            metadata: {
              type: 'property',
              sourceFile: prop.location.file,
              startLine: prop.location.line,
              endLine: prop.location.endLine || prop.location.line,
              propertyName: prop.name,
              fileTypeInfo: propFileTypeInfo
            }
          };
        }),
        metadata: {
          featurelessChildren: true // Properties entries display as simple name-only navigation
        }
      };
      entry.children!.push(propertiesSection);
    }

    // Methods section
    if (classData.methods && classData.methods.length > 0) {
      const methodsSection: ClassMillerColumnsEntry = {
        item_name: 'Methods',
        lucide_icon: 'zap',
        children: classData.methods.map(method => {
          const paramStr = method.parameters.map(p => `${p.name}${p.displayType ? `: ${p.displayType}` : ''}`).join(', ');
          const methodSignature = `${method.name}(${paramStr})${method.displayReturnType ? `: ${method.displayReturnType}` : ''}`;
          const modifiers = [
            method.isStatic ? 'static' : '',
            method.isAbstract ? 'abstract' : '',
            method.visibility !== 'public' ? method.visibility : ''
          ].filter(Boolean).join(' ');

          const methodFileTypeInfo = findFileTypeInfo(method.location.file, fileSystemData);
          const methodEntry: ClassMillerColumnsEntry = {
            item_name: `${methodSignature}${modifiers ? ` (${modifiers})` : ''}`,
            lucide_icon: 'braces',
            metadata: {
              type: 'method',
              sourceFile: method.location.file,
              startLine: method.location.line,
              endLine: method.location.endLine || method.location.line,
              methodName: method.name,
              fileTypeInfo: methodFileTypeInfo,
              method: method // Include full method data for reference access
            }
          };

          // Add References child if method has references
          if (method.references && method.references.length > 0) {
            methodEntry.children = [{
              item_name: 'References',
              lucide_icon: 'arrow-right-left',
              children: method.references.map((ref, index) => {
                const filename = path.basename(ref.location.file);
                return {
                  item_name: `${filename}:${ref.location.line}`,
                  lucide_icon: 'arrow-right-left',
                  metadata: {
                    type: 'method_reference',
                    sourceFile: ref.location.file,
                    line: ref.location.line,
                    contextLine: ref.contextLine,
                    context: ref.context,
                    referenceIndex: index
                  }
                };
              }),
              metadata: {
                type: 'method_references',
                method: method,
                referencesData: method.references
              }
            }];
            
            // Mark method as having featureless children (References entry should display as navigation-only)
            methodEntry.metadata = {
              ...methodEntry.metadata,
              featurelessChildren: true
            };
          }

          return methodEntry;
        })
      };
      entry.children!.push(methodsSection);
    }
  }

  // References section for all classes (local and imported)
  if (classData.references && classData.references.length > 0) {
    const referencesSection: ClassMillerColumnsEntry = {
      item_name: `References (${classData.references.length})`,
      lucide_icon: 'arrow-right-left',
      children: classData.references.map((ref, index) => {
        // Extract filename from full path
        const filename = ref.location.file.split('/').pop() || ref.location.file;
        return {
          item_name: `${filename}:${ref.location.line}${ref.context ? ` (${ref.context})` : ''}`,
          lucide_icon: 'arrow-right-left',
          metadata: {
            type: 'class_reference',
            sourceFile: ref.location.file,
            line: ref.location.line,
            contextLine: ref.contextLine,
            context: ref.context,
            referenceIndex: index
          }
        };
      }),
      metadata: {
        type: 'class_references',
        className: classData.name,
        referencesData: classData.references,
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

export async function transformClassAnalysisToMillerColumns(
  classAnalysisResult: ClassAnalysisResult,
  fileSystemData?: FileSystemResult
): Promise<ClassMillerColumnsResult> {
  // Create individual class entries for drill-down navigation
  const classEntries = classAnalysisResult.classes
    .sort((a, b) => {
      // Sort local classes first, then by name
      if (a.isLocal && !b.isLocal) return -1;
      if (!a.isLocal && b.isLocal) return 1;
      return a.name.localeCompare(b.name);
    })
    .map(classData => transformClassToMillerColumns(classData, fileSystemData));

  // Create class summary entries for root-level grid display
  const classSummaryEntries = classAnalysisResult.classes.map(classData => ({
    item_name: classData.name,
    lucide_icon: classData.isLocal ? 'file-code-2' : 'file-down',
    metadata: {
      name: classData.name,
      sourceFilename: classData.sourceFilename,
      sourceLOC: classData.sourceLOC,
      referenceCount: classData.referenceCount,
      isLocal: classData.isLocal
    }
  }));

  const millerColumnsResult: ClassMillerColumnsResult = {
    root: classAnalysisResult.projectRoot,
    transformedAt: new Date().toISOString(),
    column_entries: [
      {
        item_name: `Classes (${classAnalysisResult.classes.length})`,
        lucide_icon: 'file-code-2',
        children: classEntries,
        metadata: {
          type: 'class_summary',
          summaryData: classSummaryEntries
        }
      }
    ]
  };

  return millerColumnsResult;
}

export async function emitClassMillerColumnsJson(
  classMillerColumnsResult: ClassMillerColumnsResult, 
  outputPath: string
): Promise<void> {
  await fs.writeJson(outputPath, classMillerColumnsResult, { spaces: 2 });
}

export async function loadClassAnalysis(filePath: string): Promise<ClassAnalysisResult> {
  return await fs.readJson(filePath);
}
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

    // Get function-type properties (properties with function types that should be treated as methods)
    const functionTypeProperties = interfaceData.properties?.filter(p => p.isFunctionType) || [];
    const allMethods = [...(interfaceData.methods || []), ...functionTypeProperties];

    // Functions section - provides navigation to interface methods and function-type properties
    if (allMethods.length > 0) {
      const functionsSection: InterfaceMillerColumnsEntry = {
        item_name: `Functions (${allMethods.length})`,
        lucide_icon: 'zap',
        children: allMethods.map(method => {
          // Handle display for both actual methods and function-type properties
          const isActualMethod = 'parameters' in method && method.parameters !== undefined;
          const displayName = isActualMethod 
            ? `${method.name}(${method.parameters?.map(p => `${p.name}:${p.type || 'any'}`).join(', ') || ''})`
            : `${method.name}: ${method.type || 'function'}`;
            
          return {
            item_name: displayName,
            lucide_icon: 'zap',
            children: [
              // Source for each method/function-type property
              {
                item_name: 'Source',
                lucide_icon: 'file-text',
                metadata: {
                  type: isActualMethod ? 'method_source' : 'property_source',
                  sourceFile: method.location.file,
                  startLine: method.location.line,
                  endLine: method.location.endLine || method.location.line,
                  methodName: method.name,
                  propertyName: method.name, // For compatibility with property_source
                  interfaceName: interfaceData.name,
                  featurelessChildren: true
                }
              },
              // References for each method/function-type property
              ...(method.references && method.references.length > 0 ? [{
                item_name: `References (${method.references.length})`,
                lucide_icon: 'arrow-right-left',
                children: method.references.map((ref, index) => {
                  const filename = ref.location.file.split('/').pop() || ref.location.file;
                  return {
                    item_name: `${filename}:${ref.location.line}${ref.context ? ` (${ref.context})` : ''}`,
                    lucide_icon: 'arrow-right-left',
                    metadata: {
                      type: isActualMethod ? 'method_reference' : 'property_reference',
                      sourceFile: ref.location.file,
                      line: ref.location.line,
                      contextLine: ref.contextLine,
                      context: ref.context,
                      methodName: method.name,
                      propertyName: method.name, // For compatibility with property_reference
                      interfaceName: interfaceData.name,
                      referenceIndex: index,
                      featurelessChildren: true
                    }
                  };
                }),
                metadata: {
                  type: isActualMethod ? 'method_references' : 'property_references',
                  methodName: method.name,
                  propertyName: method.name, // For compatibility with property_references
                  interfaceName: interfaceData.name,
                  referencesData: method.references,
                  featurelessChildren: true
                }
              }] : [])
            ],
            metadata: {
              ...method,
              type: isActualMethod ? 'interface_method' : 'interface_property',
              interfaceName: interfaceData.name,
              featurelessChildren: true // Method children (Source/References) should be featureless
            }
          };
        }),
        metadata: {
          type: 'interface_methods',
          interfaceName: interfaceData.name,
          methodsData: interfaceData.methods,
          summaryData: allMethods.map(method => {
            const isActualMethod = 'parameters' in method && method.parameters !== undefined;
            
            return {
              item_name: method.name, // Just the function name for the grid
              metadata: {
                functionName: method.name,
                methodName: method.name,
                propertyName: method.name, // For compatibility
                method: isActualMethod ? {
                  name: method.name,
                  parameters: method.parameters || [],
                  returnType: method.returnType || 'void',
                  displayReturnType: method.displayReturnType || method.returnType || 'void',
                  referenceCount: method.referenceCount || 0,
                  visibility: method.visibility || 'public'
                } : undefined,
                property: !isActualMethod ? {
                  name: method.name,
                  type: method.type || 'function',
                  displayType: method.type || 'function',
                  referenceCount: method.referenceCount || 0,
                  visibility: method.visibility || 'public'
                } : undefined,
                function: {
                  name: method.name,
                  signature: isActualMethod 
                    ? `(${method.parameters?.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type || 'any'}`).join(', ') || ''}) => ${method.returnType || 'void'}`
                    : method.type || 'function',
                  parameters: isActualMethod ? method.parameters || [] : undefined,
                  returnType: isActualMethod ? method.returnType || 'void' : undefined,
                  referenceCount: method.referenceCount || 0
                },
                type: isActualMethod ? 'interface_method_summary' : 'interface_property_summary'
              }
            };
          })
        }
      };
      entry.children!.push(functionsSection);
    }

    // Properties section - provides navigation to interface properties (excluding function-type properties)
    const dataProperties = interfaceData.properties?.filter(p => !p.isFunctionType) || [];
    if (dataProperties.length > 0) {
      const propertiesSection: InterfaceMillerColumnsEntry = {
        item_name: `Properties (${dataProperties.length})`,
        lucide_icon: 'list',
        children: dataProperties.map(property => ({
          item_name: `${property.name}:${property.type || 'any'}`,
          lucide_icon: 'circle-dot',
          children: [
            // Source for each property
            {
              item_name: 'Source',
              lucide_icon: 'file-text',
              metadata: {
                type: 'property_source',
                sourceFile: property.location.file,
                startLine: property.location.line,
                endLine: property.location.endLine || property.location.line,
                propertyName: property.name,
                interfaceName: interfaceData.name,
                featurelessChildren: true
              }
            },
            // References for each property
            ...(property.references && property.references.length > 0 ? [{
              item_name: `References (${property.references.length})`,
              lucide_icon: 'arrow-right-left',
              children: property.references.map((ref, index) => {
                const filename = ref.location.file.split('/').pop() || ref.location.file;
                return {
                  item_name: `${filename}:${ref.location.line}${ref.context ? ` (${ref.context})` : ''}`,
                  lucide_icon: 'arrow-right-left',
                  metadata: {
                    type: 'property_reference',
                    sourceFile: ref.location.file,
                    line: ref.location.line,
                    contextLine: ref.contextLine,
                    context: ref.context,
                    propertyName: property.name,
                    interfaceName: interfaceData.name,
                    referenceIndex: index,
                    featurelessChildren: true
                  }
                };
              }),
              metadata: {
                type: 'property_references',
                propertyName: property.name,
                interfaceName: interfaceData.name,
                referencesData: property.references,
                featurelessChildren: true
              }
            }] : [])
          ],
          metadata: {
            ...property,
            type: 'interface_property',
            interfaceName: interfaceData.name,
            featurelessChildren: true // Property children (Source/References) should be featureless
          }
        })),
        metadata: {
          type: 'interface_properties',
          interfaceName: interfaceData.name,
          propertiesData: dataProperties,
          summaryData: dataProperties.map(property => ({
            item_name: `${property.name}:${property.type || 'any'}`,
            metadata: {
              propertyName: property.name,
              property: {
                name: property.name,
                type: property.type || 'any',
                displayType: property.type || 'any',
                referenceCount: property.referenceCount || 0,
                visibility: property.visibility || 'public'
              },
              type: 'interface_property_summary'
            }
          }))
        }
      };
      entry.children!.push(propertiesSection);
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
import fs from 'fs-extra';
import { ProjectSummary, DependencyGraph, ClassAnalysisResult } from '../models';
import { buildDependencyGraph } from '../graph/dependencyBuilder';
import { FileSystemResult } from '../scanner/fileSystemScanner';
import { MillerColumnsResult } from '../transformers/millerColumnsTransformer';
import { ClassMillerColumnsResult } from '../transformers/classMillerColumnsTransformer';
import { aggregateData } from './aggregator';

export async function emitArchitectureJson(summary: ProjectSummary, outputPath: string): Promise<void> {
  await fs.writeJson(outputPath, summary, { spaces: 2 });
}

export async function emitArchitectureMd(summary: ProjectSummary, outputPath: string, typePathMode: 'clean' | 'filename' | 'full' = 'clean'): Promise<void> {
  const markdown = generateMarkdown(summary, typePathMode);
  await fs.writeFile(outputPath, markdown);
}

export async function emitDependenciesJson(summary: ProjectSummary, outputPath: string): Promise<void> {
  const dependencyGraph = buildDependencyGraph(summary);
  await fs.writeJson(outputPath, dependencyGraph, { spaces: 2 });
}

export async function emitFileSystemJson(fileSystemResult: FileSystemResult, outputPath: string): Promise<void> {
  await fs.writeJson(outputPath, fileSystemResult, { spaces: 2 });
}

export async function emitMillerColumnsJson(millerColumnsResult: MillerColumnsResult, outputPath: string): Promise<void> {
  await fs.writeJson(outputPath, millerColumnsResult, { spaces: 2 });
}

export async function emitClassAnalysisJson(classAnalysisResult: ClassAnalysisResult, outputPath: string): Promise<void> {
  await fs.writeJson(outputPath, classAnalysisResult, { spaces: 2 });
}

export async function emitClassMillerColumnsJson(classMillerColumnsResult: ClassMillerColumnsResult, outputPath: string): Promise<void> {
  await fs.writeJson(outputPath, classMillerColumnsResult, { spaces: 2 });
}

export async function emitAggregatedJson(outputDir: string): Promise<void> {
  await aggregateData(outputDir);
}

function generateMarkdown(summary: ProjectSummary, typePathMode: 'clean' | 'filename' | 'full' = 'clean'): string {
  let markdown = `# Architecture Summary\n\n`;
  markdown += `**Project Root:** ${summary.projectRoot}\n`;
  markdown += `**Scanned At:** ${summary.scannedAt}\n`;
  markdown += `**Files Analyzed:** ${summary.files.length}\n\n`;

  markdown += `## Files by Type\n\n`;
  const filesByKind = summary.files.reduce((acc, file) => {
    acc[file.kind] = (acc[file.kind] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(filesByKind).forEach(([kind, count]) => {
    markdown += `- **${kind}**: ${count} files\n`;
  });

  // Add Type Catalog section
  markdown += `\n## Type Catalog\n\n`;
  markdown += `**Total Types:** ${summary.typeCatalog.entries.length}\n\n`;
  
  // Group types by kind
  const typesByKind = summary.typeCatalog.entries.reduce((acc, entry) => {
    acc[entry.kind] = (acc[entry.kind] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(typesByKind).forEach(([kind, count]) => {
    markdown += `- **${kind}**: ${count} entries\n`;
  });
  
  // Show type entries grouped by file
  const typesByFile = summary.typeCatalog.entries.reduce((acc, entry) => {
    const key = entry.isLocal ? entry.filename : `${entry.filename} (imported)`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {} as Record<string, any[]>);
  
  Object.entries(typesByFile).forEach(([filename, entries]) => {
    if (entries.length > 0) {
      markdown += `\n### ${filename}\n`;
      entries.forEach(entry => {
        markdown += `- **${entry.name}** (${entry.kind}) (${entry.location.line}:${entry.location.column})\n`;
        
        if (entry.jsdocDescription) {
          markdown += `  - Description: ${entry.jsdocDescription}\n`;
        }
        
        if (entry.extends?.length) {
          markdown += `  - Extends: ${entry.extends.join(', ')}\n`;
        }
        
        if (entry.genericParameters?.length) {
          const genericStr = entry.genericParameters.map((g: any) => {
            let str = g.name;
            if (g.constraint) str += ` extends ${g.constraint}`;
            if (g.defaultType) str += ` = ${g.defaultType}`;
            return str;
          }).join(', ');
          markdown += `  - Generics: <${genericStr}>\n`;
        }
        
        if (entry.unionTypes?.length) {
          markdown += `  - Union Types: ${entry.unionTypes.join(' | ')}\n`;
        }
        
        if (entry.intersectionTypes?.length) {
          markdown += `  - Intersection Types: ${entry.intersectionTypes.join(' & ')}\n`;
        }
        
        // Show type usage references
        if (entry.references?.length) {
          markdown += `  - Used in ${entry.references.length} location(s):\n`;
          
          // Group references by context for better organization
          const refsByContext = entry.references.reduce((acc: any, ref: any) => {
            if (!acc[ref.context]) acc[ref.context] = [];
            acc[ref.context].push(ref);
            return acc;
          }, {});
          
          Object.entries(refsByContext).forEach(([context, refs]: [string, any]) => {
            markdown += `    - **${context}** (${refs.length}):\n`;
            refs.forEach((ref: any) => {
              markdown += `      - ${ref.location.file}:${ref.location.line}`;
              if (ref.contextDetails) {
                markdown += ` (${ref.contextDetails})`;
              }
              markdown += '\n';
            });
          });
        } else {
          markdown += `  - **Unused** - No references found\n`;
        }
      });
    }
  });

  markdown += `\n## Classes\n\n`;
  summary.files.forEach(file => {
    if (file.exports.classes?.length) {
      markdown += `### ${file.path}\n`;
      file.exports.classes.forEach(cls => {
        markdown += `- **${cls.name}** (${cls.location.line}:${cls.location.column})\n`;
        
        // Add generic parameters
        if (cls.genericParameters?.length) {
          const genericStr = cls.genericParameters.map(g => {
            let str = g.name;
            if (g.constraint) str += ` extends ${g.constraint}`;
            if (g.defaultType) str += ` = ${g.defaultType}`;
            return str;
          }).join(', ');
          markdown += `  - Generics: <${genericStr}>\n`;
        }
        
        // Add JSDoc description
        if (cls.jsdocDescription) {
          markdown += `  - Description: ${cls.jsdocDescription}\n`;
        }
        
        // Add inheritance info
        if (cls.extends) {
          markdown += `  - Extends: ${cls.extends}\n`;
        }
        if (cls.implements?.length) {
          markdown += `  - Implements: ${cls.implements.join(', ')}\n`;
        }
        
        // Add constructors
        if (cls.constructors.length > 0) {
          markdown += `  - Constructors: ${cls.constructors.length}\n`;
        }
        
        // Add methods with enhanced information
        if (cls.methods.length > 0) {
          markdown += `  - Methods:\n`;
          cls.methods.forEach(method => {
            markdown += `    - **${method.name}**`;
            if (method.isStatic) markdown += ' (static)';
            if (method.isAbstract) markdown += ' (abstract)';
            if (method.visibility !== 'public') markdown += ` (${method.visibility})`;
            
            // Add parameters
            if (method.parameters.length > 0) {
              const paramStr = method.parameters.map(p => {
                let str = p.name;
                if (p.type) str += `: ${formatTypeReference(p.type, typePathMode)}`;
                if (p.optional) str += '?';
                return str;
              }).join(', ');
              markdown += `(${paramStr})`;
            } else {
              markdown += '()';
            }
            
            // Add return type
            if (method.returnType) {
              markdown += `: ${formatTypeReference(method.returnType, typePathMode)}`;
            }
            
            markdown += '\n';
          });
        }
        
        // Add properties
        if (cls.properties.length > 0) {
          markdown += `  - Properties: `;
          const propStrs = cls.properties.map(prop => {
            let str = prop.name;
            if (prop.type) str += `: ${formatTypeReference(prop.type, typePathMode)}`;
            if (prop.isStatic) str += ' (static)';
            if (prop.visibility !== 'public') str += ` (${prop.visibility})`;
            return str;
          });
          markdown += propStrs.join(', ') + '\n';
        }
      });
      markdown += `\n`;
    }
  });

  markdown += `## Functions\n\n`;
  summary.files.forEach(file => {
    if (file.exports.functions?.length) {
      markdown += `### ${file.path}\n`;
      file.exports.functions.forEach(fn => {
        markdown += `- **${fn.name}** (${fn.location.line}:${fn.location.column})\n`;
        
        // Add parameter information
        if (fn.parameters.length > 0) {
          markdown += `  - Parameters: `;
          const paramStrings = fn.parameters.map(param => {
            let paramStr = param.name;
            if (param.type) paramStr += `: ${formatTypeReference(param.type, typePathMode)}`;
            if (param.optional) paramStr += '?';
            if (param.isRest) paramStr = '...' + paramStr;
            if (param.defaultValue) paramStr += ` = ${param.defaultValue}`;
            return paramStr;
          });
          markdown += paramStrings.join(', ') + '\n';
        }
        
        // Add return type
        if (fn.returnType) {
          markdown += `  - Returns: ${formatTypeReference(fn.returnType, typePathMode)}\n`;
        }
        
        // Add JSDoc description
        if (fn.jsdocDescription) {
          markdown += `  - Description: ${fn.jsdocDescription}\n`;
        }
        
        // Add generic parameters
        if (fn.genericParameters?.length) {
          const genericStr = fn.genericParameters.map(g => {
            let str = g.name;
            if (g.constraint) str += ` extends ${g.constraint}`;
            if (g.defaultType) str += ` = ${g.defaultType}`;
            return str;
          }).join(', ');
          markdown += `  - Generics: <${genericStr}>\n`;
        }
        
        // Add overloads
        if (fn.overloads?.length) {
          markdown += `  - Overloads: ${fn.overloads.length}\n`;
        }
      });
      markdown += `\n`;
    }
  });

  markdown += `## React Components\n\n`;
  summary.files.forEach(file => {
    if (file.exports.components?.length) {
      markdown += `### ${file.path}\n`;
      file.exports.components.forEach(comp => {
        markdown += `- **${comp.name}** (${comp.type}) (${comp.location.line}:${comp.location.column})\n`;
      });
      markdown += `\n`;
    }
  });

  markdown += `## IPC Usage\n\n`;
  summary.files.forEach(file => {
    if (file.ipc) {
      markdown += `### ${file.path}\n`;
      if (file.ipc.handlers.length > 0) {
        markdown += `**Handlers:**\n`;
        file.ipc.handlers.forEach(handler => {
          markdown += `- ${handler.type}: \`${handler.channel}\` (${handler.location.line}:${handler.location.column})\n`;
        });
      }
      if (file.ipc.invocations.length > 0) {
        markdown += `**Invocations:**\n`;
        file.ipc.invocations.forEach(inv => {
          markdown += `- ${inv.type}: \`${inv.channel}\` (${inv.location.line}:${inv.location.column})\n`;
        });
      }
      markdown += `\n`;
    }
  });

  return markdown;
}

function formatTypeReference(typeString: string, typePathMode: 'clean' | 'filename' | 'full'): string {
  if (typePathMode === 'full') {
    return typeString;
  }
  
  if (typePathMode === 'filename') {
    // Extract just the filename and type name from complex type paths
    const match = typeString.match(/".*?([^/]+)"\.(.*)/);
    if (match) {
      return `${match[1]}.${match[2]}`;
    }
    return typeString;
  }
  
  if (typePathMode === 'clean') {
    // Extract just the type name, removing module paths
    const match = typeString.match(/".*?"\.(.*)/) || typeString.match(/([^/.]+)$/);
    if (match) {
      return match[1] || match[0];
    }
    return typeString;
  }
  
  return typeString;
}
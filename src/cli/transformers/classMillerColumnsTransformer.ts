import fs from 'fs-extra';
import { ClassAnalysisResult, ComprehensiveClassSummary } from '../models';

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

export function transformClassToMillerColumns(
  classData: ComprehensiveClassSummary
): ClassMillerColumnsEntry {
  const entry: ClassMillerColumnsEntry = {
    item_name: classData.name,
    lucide_icon: classData.isLocal ? 'file-code-2' : 'file-down',
    isLocal: classData.isLocal,
    children: [],
    metadata: classData // Include the full class data as metadata
  };

  // For local classes, create Properties, Methods, and References sections
  if (classData.isLocal) {
    // Properties section
    if (classData.properties && classData.properties.length > 0) {
      const propertiesSection: ClassMillerColumnsEntry = {
        item_name: 'Properties',
        lucide_icon: 'settings',
        children: classData.properties.map(prop => ({
          item_name: `${prop.name}: ${prop.type || 'unknown'}${prop.isStatic ? ' (static)' : ''}${prop.visibility !== 'public' ? ` (${prop.visibility})` : ''}`,
          lucide_icon: 'variable'
        }))
      };
      entry.children!.push(propertiesSection);
    }

    // Methods section
    if (classData.methods && classData.methods.length > 0) {
      const methodsSection: ClassMillerColumnsEntry = {
        item_name: 'Methods',
        lucide_icon: 'zap',
        children: classData.methods.map(method => {
          const paramStr = method.parameters.map(p => `${p.name}${p.type ? `: ${p.type}` : ''}`).join(', ');
          const methodSignature = `${method.name}(${paramStr})${method.returnType ? `: ${method.returnType}` : ''}`;
          const modifiers = [
            method.isStatic ? 'static' : '',
            method.isAbstract ? 'abstract' : '',
            method.visibility !== 'public' ? method.visibility : ''
          ].filter(Boolean).join(' ');

          return {
            item_name: `${methodSignature}${modifiers ? ` (${modifiers})` : ''}`,
            lucide_icon: 'braces'
          };
        })
      };
      entry.children!.push(methodsSection);
    }

    // Constructors section (if any)
    if (classData.constructors && classData.constructors.length > 0) {
      const constructorsSection: ClassMillerColumnsEntry = {
        item_name: 'Constructors',
        lucide_icon: 'wrench',
        children: classData.constructors.map(constructor => {
          const paramStr = constructor.parameters.map(p => `${p.name}${p.type ? `: ${p.type}` : ''}`).join(', ');
          const constructorSignature = `${constructor.name}(${paramStr})`;
          const modifiers = constructor.visibility !== 'public' ? constructor.visibility : '';

          return {
            item_name: `${constructorSignature}${modifiers ? ` (${modifiers})` : ''}`,
            lucide_icon: 'wrench'
          };
        })
      };
      entry.children!.push(constructorsSection);
    }
  }

  // References section for all classes (local and imported)
  if (classData.references && classData.references.length > 0) {
    const referencesSection: ClassMillerColumnsEntry = {
      item_name: 'References',
      lucide_icon: 'arrow-right-left',
      children: classData.references.map(ref => {
        // Extract filename from full path
        const filename = ref.location.file.split('/').pop() || ref.location.file;
        return {
          item_name: `${filename}:${ref.location.line}${ref.context ? ` (${ref.context})` : ''}`,
          lucide_icon: 'arrow-right-left'
        };
      })
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
  classAnalysisResult: ClassAnalysisResult
): Promise<ClassMillerColumnsResult> {
  const millerColumnsResult: ClassMillerColumnsResult = {
    root: classAnalysisResult.projectRoot,
    transformedAt: new Date().toISOString(),
    column_entries: [
      {
        item_name: 'Classes',
        lucide_icon: 'file-code-2',
        children: classAnalysisResult.classes
          .sort((a, b) => {
            // Sort local classes first, then by name
            if (a.isLocal && !b.isLocal) return -1;
            if (!a.isLocal && b.isLocal) return 1;
            return a.name.localeCompare(b.name);
          })
          .map(classData => transformClassToMillerColumns(classData))
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
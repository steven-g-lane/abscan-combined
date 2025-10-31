import fs from 'fs-extra';
import { FileSystemResult, FileSystemEntry } from '../scanner/fileSystemScanner';
import { ClassAnalysisResult, FunctionAnalysisResult, InterfaceAnalysisResult, EnumAnalysisResult, TypeAnalysisResult } from '../models';
import { formatMethodReferenceTitle } from '../utils/referenceDisplayUtils';

export interface MillerColumnsEntry {
  item_name: string;
  lucide_icon: string;
  children?: MillerColumnsEntry[];
  metadata?: any; // Optional metadata from source data
}

export interface MillerColumnsResult {
  root: string;
  transformedAt: string;
  column_entries: MillerColumnsEntry[];
}

export interface IconMapping {
  extensions: Record<string, string>;
  special: Record<string, string>;
  defaults: {
    file: string;
    directory: string;
  };
}

const defaultIconMapping: IconMapping = {
  extensions: {
    '.ts': 'file-code',
    '.tsx': 'file-code',
    '.js': 'file-code',
    '.jsx': 'file-code',
    '.py': 'file-code',
    '.java': 'file-code',
    '.cpp': 'file-code',
    '.c': 'file-code',
    '.h': 'file-code',
    '.hpp': 'file-code',
    '.rs': 'file-code',
    '.go': 'file-code',
    '.php': 'file-code',
    '.rb': 'file-code',
    '.swift': 'file-code',
    '.kt': 'file-code',
    '.scala': 'file-code',
    '.cs': 'file-code',
    '.vb': 'file-code',
    '.html': 'file-code',
    '.htm': 'file-code',
    '.css': 'file-code',
    '.scss': 'file-code',
    '.sass': 'file-code',
    '.less': 'file-code',
    '.json': 'file-json',
    '.xml': 'file-code',
    '.yaml': 'file-code',
    '.yml': 'file-code',
    '.toml': 'file-code',
    '.ini': 'settings',
    '.conf': 'settings',
    '.config': 'settings',
    '.md': 'file-text',
    '.mdx': 'file-text',
    '.txt': 'file-text',
    '.pdf': 'file-type-pdf',
    '.doc': 'file-type-word',
    '.docx': 'file-type-word',
    '.xls': 'file-type-excel',
    '.xlsx': 'file-type-excel',
    '.ppt': 'file-type-powerpoint',
    '.pptx': 'file-type-powerpoint',
    '.zip': 'file-archive',
    '.tar': 'file-archive',
    '.gz': 'file-archive',
    '.rar': 'file-archive',
    '.7z': 'file-archive',
    '.png': 'file-image',
    '.jpg': 'file-image',
    '.jpeg': 'file-image',
    '.gif': 'file-image',
    '.svg': 'file-image',
    '.ico': 'file-image',
    '.webp': 'file-image',
    '.mp3': 'file-audio',
    '.wav': 'file-audio',
    '.flac': 'file-audio',
    '.mp4': 'file-video',
    '.avi': 'file-video',
    '.mov': 'file-video',
    '.mkv': 'file-video',
    '.sh': 'file-terminal',
    '.bat': 'file-terminal',
    '.cmd': 'file-terminal',
    '.ps1': 'file-terminal',
    '.sql': 'database',
    '.db': 'database',
    '.sqlite': 'database',
    '.lock': 'lock',
    '.env': 'settings',
    '.gitignore': 'git-branch',
    '.gitattributes': 'git-branch',
    '.dockerignore': 'container',
    '.dockerfile': 'container'
  },
  special: {
    'package.json': 'file-json',
    'package-lock.json': 'file-json',
    'yarn.lock': 'file-json',
    'pnpm-lock.yaml': 'file-json',
    'Cargo.toml': 'file-json',
    'Cargo.lock': 'file-json',
    'requirements.txt': 'file-text',
    'Pipfile': 'file-text',
    'Pipfile.lock': 'file-text',
    'Gemfile': 'file-text',
    'Gemfile.lock': 'file-text',
    'composer.json': 'file-json',
    'composer.lock': 'file-json',
    'go.mod': 'file-text',
    'go.sum': 'file-text',
    'pubspec.yaml': 'file-text',
    'pubspec.lock': 'file-text',
    'README.md': 'file-text',
    'README.txt': 'file-text',
    'readme.md': 'file-text',
    'readme.txt': 'file-text',
    'LICENSE': 'file-text',
    'license': 'file-text',
    'LICENSE.txt': 'file-text',
    'LICENSE.md': 'file-text',
    'CHANGELOG.md': 'file-text',
    'CHANGES.md': 'file-text',
    'changelog.md': 'file-text',
    'changes.md': 'file-text',
    'Dockerfile': 'file-text',
    'docker-compose.yml': 'file-text',
    'docker-compose.yaml': 'file-text',
    'Makefile': 'file-text',
    'makefile': 'file-text',
    'CMakeLists.txt': 'file-text',
    'build.gradle': 'file-text',
    'pom.xml': 'file-text',
    'webpack.config.js': 'file-text',
    'vite.config.js': 'file-text',
    'vite.config.ts': 'file-text',
    'rollup.config.js': 'file-text',
    'babel.config.js': 'file-text',
    'eslint.config.js': 'file-text',
    '.eslintrc': 'file-text',
    '.eslintrc.js': 'file-text',
    '.eslintrc.json': 'file-json',
    'prettier.config.js': 'file-text',
    '.prettierrc': 'file-text',
    '.prettierrc.json': 'file-json',
    'tsconfig.json': 'file-json',
    'jsconfig.json': 'file-json',
    'tailwind.config.js': 'file-text',
    'tailwind.config.ts': 'file-text',
    'next.config.js': 'file-text',
    'nuxt.config.js': 'file-text',
    'vue.config.js': 'file-text',
    'angular.json': 'file-json',
    'ember-cli-build.js': 'file-text',
    '.gitignore': 'file-text',
    '.gitattributes': 'file-text',
    '.git': 'folder-open',
    'node_modules': 'folder-open',
    '.vscode': 'folder-open',
    '.idea': 'folder-open',
    'dist': 'folder-open',
    'build': 'folder-open',
    'public': 'folder-open',
    'static': 'folder-open',
    'assets': 'folder-open',
    'src': 'folder-open',
    'lib': 'folder-open',
    'components': 'folder-open',
    'pages': 'folder-open',
    'views': 'folder-open',
    'utils': 'folder-open',
    'helpers': 'folder-open',
    'services': 'folder-open',
    'api': 'folder-open',
    'models': 'folder-open',
    'types': 'folder-open',
    'interfaces': 'folder-open',
    'schemas': 'folder-open',
    'config': 'folder-open',
    'configs': 'folder-open',
    'scripts': 'folder-open',
    'bin': 'folder-open',
    'tools': 'folder-open',
    'docs': 'folder-open',
    'documentation': 'folder-open',
    'tests': 'folder-open',
    'test': 'folder-open',
    '__tests__': 'folder-open',
    'spec': 'folder-open',
    'specs': 'folder-open',
    'cypress': 'folder-open',
    'e2e': 'folder-open'
  },
  defaults: {
    file: 'file-code',
    directory: 'folder-open'
  }
};

export function getIconForEntry(entry: FileSystemEntry, iconMapping: IconMapping = defaultIconMapping): string {
  if (entry.type === 'directory') {
    if (iconMapping.special[entry.name]) {
      return iconMapping.special[entry.name];
    }
    return iconMapping.defaults.directory;
  }

  // Check special files first (exact filename match)
  if (iconMapping.special[entry.name]) {
    return iconMapping.special[entry.name];
  }

  // Check file extension
  if (entry.extension && iconMapping.extensions[entry.extension]) {
    return iconMapping.extensions[entry.extension];
  }

  // Check file extension in lowercase
  if (entry.extension && iconMapping.extensions[entry.extension.toLowerCase()]) {
    return iconMapping.extensions[entry.extension.toLowerCase()];
  }

  // Default file icon
  return iconMapping.defaults.file;
}

export function transformToMillerColumns(
  entry: FileSystemEntry,
  iconMapping: IconMapping = defaultIconMapping,
  analysisResults?: {
    classes?: ClassAnalysisResult;
    functions?: FunctionAnalysisResult;
    interfaces?: InterfaceAnalysisResult;
    enums?: EnumAnalysisResult;
    types?: TypeAnalysisResult;
  }
): MillerColumnsEntry {
  const result: MillerColumnsEntry = {
    item_name: entry.name,
    lucide_icon: getIconForEntry(entry, iconMapping),
    metadata: entry.metadata // Preserve metadata from the original entry
  };

  if (entry.children && entry.children.length > 0) {
    result.children = entry.children.map(child => transformToMillerColumns(child, iconMapping, analysisResults));
  } else if (entry.type === 'file' && analysisResults) {
    // Add file content categories for TypeScript/JavaScript files
    const fileContents = createFileContentCategories(entry, analysisResults);
    if (fileContents.length > 0) {
      result.children = fileContents;
    }
  }

  return result;
}

/**
 * Creates file content categories (classes, functions, etc.) for TypeScript/JavaScript files
 */
function createFileContentCategories(
  entry: FileSystemEntry,
  analysisResults: {
    classes?: ClassAnalysisResult;
    functions?: FunctionAnalysisResult;
    interfaces?: InterfaceAnalysisResult;
    enums?: EnumAnalysisResult;
    types?: TypeAnalysisResult;
  }
): MillerColumnsEntry[] {
  // Only process TypeScript and JavaScript files
  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  if (!entry.extension || !codeExtensions.includes(entry.extension.toLowerCase())) {
    return [];
  }

  const categories: MillerColumnsEntry[] = [];
  const filePath = entry.metadata?.fullPath || entry.metadata?.path || entry.name;

  // Helper function to normalize file paths for comparison
  const normalizeFilePath = (path: string): string => {
    return path.replace(/\\/g, '/'); // Normalize Windows paths
  };

  const normalizedFilePath = normalizeFilePath(filePath);

  // 1. Classes category
  if (analysisResults.classes) {
    const fileClasses = analysisResults.classes.classes.filter(cls => {
      // Ensure class has location and file properties
      if (!cls || !cls.location || !cls.location.file) {
        return false;
      }
      return normalizeFilePath(cls.location.file).endsWith(normalizedFilePath) ||
             normalizeFilePath(cls.location.file) === normalizedFilePath;
    });

    // Create children entries for individual classes
    const classChildren = fileClasses.map(cls => ({
      item_name: cls.name,
      lucide_icon: 'box',
      metadata: {
        type: 'class_detail',
        classData: cls,
        sourceFile: filePath
      },
      children: [
        {
          item_name: 'Source',
          lucide_icon: 'file-text',
          metadata: {
            type: 'class_source',
            classData: cls,
            sourceFile: cls.location.file,
            startLine: cls.location.line,
            endLine: cls.location.endLine
          }
        },
        {
          item_name: `Methods (${cls.methods?.length || 0})`,
          lucide_icon: 'zap',
          metadata: {
            type: 'class_methods',
            classData: cls,
            sourceFile: filePath
          },
          children: cls.methods?.map(method => ({
            item_name: method.name,
            lucide_icon: 'braces',
            metadata: {
              type: 'method',
              sourceFile: method.location?.file || filePath,
              startLine: method.location?.line,
              endLine: method.location?.endLine || method.location?.line,
              methodName: method.name,
              method: method
            },
            children: [
              {
                item_name: 'Source',
                lucide_icon: 'file-text',
                metadata: {
                  type: 'method_source',
                  sourceFile: method.location?.file || filePath,
                  startLine: method.location?.line,
                  endLine: method.location?.endLine || method.location?.line,
                  method: method
                }
              },
              {
                item_name: formatMethodReferenceTitle(method),
                lucide_icon: 'arrow-right-left',
                metadata: {
                  type: 'method_references',
                  method: method,
                  referencesData: method.references || [],
                  featurelessChildren: true
                },
                children: (method.references || []).map((ref, index) => ({
                  item_name: `${ref.location?.file?.split('/').pop() || 'Unknown'}:${ref.location?.line || 0}`,
                  lucide_icon: 'arrow-right-left',
                  metadata: {
                    type: 'method_reference',
                    sourceFile: ref.location?.file,
                    line: ref.location?.line,
                    contextLine: ref.contextLine,
                    context: ref.context,
                    referenceIndex: index
                  }
                }))
              }
            ]
          })) || []
        },
        {
          item_name: `Properties (${cls.properties?.length || 0})`,
          lucide_icon: 'settings',
          metadata: {
            type: 'class_properties',
            classData: cls,
            sourceFile: filePath
          },
          children: cls.properties?.map(property => ({
            item_name: property.name,
            lucide_icon: 'settings',
            metadata: {
              type: 'property',
              sourceFile: property.location?.file || filePath,
              startLine: property.location?.line,
              endLine: property.location?.endLine || property.location?.line,
              propertyName: property.name,
              property: property
            },
            children: [
              {
                item_name: 'Source',
                lucide_icon: 'file-text',
                metadata: {
                  type: 'property_source',
                  sourceFile: property.location?.file || filePath,
                  startLine: property.location?.line,
                  endLine: property.location?.endLine || property.location?.line,
                  property: property
                }
              }
            ]
          })) || []
        }
      ]
    }));

    categories.push({
      item_name: `Classes (${fileClasses.length})`,
      lucide_icon: 'box',
      metadata: {
        type: 'file_content_category',
        categoryType: 'classes',
        sourceFile: filePath,
        count: fileClasses.length,
        items: fileClasses
      },
      children: classChildren
    });
  }

  // 2. Functions category (placeholder - will implement later)
  if (analysisResults.functions) {
    const fileFunctions = analysisResults.functions.functions.filter(func => {
      // Ensure function has location and file properties
      if (!func || !func.location || !func.location.file) {
        return false;
      }
      return normalizeFilePath(func.location.file).endsWith(normalizedFilePath) ||
             normalizeFilePath(func.location.file) === normalizedFilePath;
    });

    categories.push({
      item_name: `Functions (${fileFunctions.length})`,
      lucide_icon: 'zap',
      metadata: {
        type: 'file_content_category',
        categoryType: 'functions',
        sourceFile: filePath,
        count: fileFunctions.length,
        items: fileFunctions
      }
    });
  }

  // 3. Interfaces category (placeholder - will implement later)
  if (analysisResults.interfaces) {
    const fileInterfaces = analysisResults.interfaces.interfaces.filter(iface => {
      // Ensure interface has location and file properties
      if (!iface || !iface.location || !iface.location.file) {
        return false;
      }
      return normalizeFilePath(iface.location.file).endsWith(normalizedFilePath) ||
             normalizeFilePath(iface.location.file) === normalizedFilePath;
    });

    categories.push({
      item_name: `Interfaces (${fileInterfaces.length})`,
      lucide_icon: 'layers',
      metadata: {
        type: 'file_content_category',
        categoryType: 'interfaces',
        sourceFile: filePath,
        count: fileInterfaces.length,
        items: fileInterfaces
      }
    });
  }

  // 4. Enums category (placeholder - will implement later)
  if (analysisResults.enums) {
    const fileEnums = analysisResults.enums.enums.filter(enumItem => {
      // Ensure enum has location and file properties
      if (!enumItem || !enumItem.location || !enumItem.location.file) {
        return false;
      }
      return normalizeFilePath(enumItem.location.file).endsWith(normalizedFilePath) ||
             normalizeFilePath(enumItem.location.file) === normalizedFilePath;
    });

    categories.push({
      item_name: `Enums (${fileEnums.length})`,
      lucide_icon: 'list',
      metadata: {
        type: 'file_content_category',
        categoryType: 'enums',
        sourceFile: filePath,
        count: fileEnums.length,
        items: fileEnums
      }
    });
  }

  // 5. Types category (placeholder - will implement later)
  if (analysisResults.types) {
    const fileTypes = analysisResults.types.types.filter(type => {
      // Ensure type has location and file properties
      if (!type || !type.location || !type.location.file) {
        return false;
      }
      return normalizeFilePath(type.location.file).endsWith(normalizedFilePath) ||
             normalizeFilePath(type.location.file) === normalizedFilePath;
    });

    categories.push({
      item_name: `Types (${fileTypes.length})`,
      lucide_icon: 'type',
      metadata: {
        type: 'file_content_category',
        categoryType: 'types',
        sourceFile: filePath,
        count: fileTypes.length,
        items: fileTypes
      }
    });
  }

  // Note: Imports, Exports, and Components categories will be added in future phases

  return categories;
}

// Helper function to recursively collect all files from the directory tree
function collectAllFiles(entries: FileSystemEntry[], currentPath: string = '', iconMapping: IconMapping): MillerColumnsEntry[] {
  const files: MillerColumnsEntry[] = [];

  entries.forEach(entry => {
    const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

    if (entry.type === 'file') {
      // Add file with full path information
      files.push({
        item_name: entry.name,
        lucide_icon: getIconForEntry(entry, iconMapping),
        metadata: {
          ...entry.metadata,
          fullPath: entryPath,
          directory: currentPath || '/',
          extension: entry.extension
        }
      });
    } else if (entry.type === 'directory' && entry.children) {
      // Recursively collect files from subdirectories
      files.push(...collectAllFiles(entry.children, entryPath, iconMapping));
    }
  });

  return files;
}

export async function transformFileSystemToMillerColumns(
  fileSystemResult: FileSystemResult,
  iconMapping: IconMapping = defaultIconMapping,
  analysisResults?: {
    classes?: ClassAnalysisResult;
    functions?: FunctionAnalysisResult;
    interfaces?: InterfaceAnalysisResult;
    enums?: EnumAnalysisResult;
    types?: TypeAnalysisResult;
  }
): Promise<MillerColumnsResult> {
  // Create flattened files collection from ALL files (Issue #76)
  const flattenedFiles = collectAllFiles(fileSystemResult.entries, '', iconMapping);

  const millerColumnsResult: MillerColumnsResult = {
    root: fileSystemResult.root,
    transformedAt: new Date().toISOString(),
    column_entries: [
      {
        item_name: "Files",
        lucide_icon: "layers",
        children: fileSystemResult.entries.map(entry => transformToMillerColumns(entry, iconMapping, analysisResults))
      },
      {
        item_name: `Files (flat) (${flattenedFiles.length})`,
        lucide_icon: "list",
        children: flattenedFiles,
        metadata: {
          type: 'flattened_files_summary',
          summaryData: flattenedFiles
        }
      }
    ]
  };

  return millerColumnsResult;
}

export async function emitMillerColumnsJson(millerColumnsResult: MillerColumnsResult, outputPath: string): Promise<void> {
  await fs.writeJson(outputPath, millerColumnsResult, { spaces: 2 });
}

export async function loadIconMapping(configPath?: string): Promise<IconMapping> {
  if (!configPath) {
    return defaultIconMapping;
  }

  try {
    if (await fs.pathExists(configPath)) {
      const customMapping = await fs.readJson(configPath);
      // Merge custom mapping with defaults
      return {
        extensions: { ...defaultIconMapping.extensions, ...customMapping.extensions },
        special: { ...defaultIconMapping.special, ...customMapping.special },
        defaults: { ...defaultIconMapping.defaults, ...customMapping.defaults }
      };
    }
  } catch (error) {
    console.warn(`Failed to load custom icon mapping from ${configPath}, using defaults:`, error);
  }

  return defaultIconMapping;
}

export async function saveIconMapping(iconMapping: IconMapping, configPath: string): Promise<void> {
  await fs.writeJson(configPath, iconMapping, { spaces: 2 });
}
import fs from 'fs-extra';
import { FileSystemResult, FileSystemEntry } from '../scanner/fileSystemScanner';

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

export function transformToMillerColumns(entry: FileSystemEntry, iconMapping: IconMapping = defaultIconMapping): MillerColumnsEntry {
  const result: MillerColumnsEntry = {
    item_name: entry.name,
    lucide_icon: getIconForEntry(entry, iconMapping),
    metadata: entry.metadata // Preserve metadata from the original entry
  };

  if (entry.children && entry.children.length > 0) {
    result.children = entry.children.map(child => transformToMillerColumns(child, iconMapping));
  }

  return result;
}

export async function transformFileSystemToMillerColumns(
  fileSystemResult: FileSystemResult,
  iconMapping: IconMapping = defaultIconMapping
): Promise<MillerColumnsResult> {
  const millerColumnsResult: MillerColumnsResult = {
    root: fileSystemResult.root,
    transformedAt: new Date().toISOString(),
    column_entries: [
      {
        item_name: "Files",
        lucide_icon: "layers",
        children: fileSystemResult.entries.map(entry => transformToMillerColumns(entry, iconMapping))
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
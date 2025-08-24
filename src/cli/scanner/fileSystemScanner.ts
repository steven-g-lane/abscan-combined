import fs from 'fs-extra';
import path from 'path';

export interface FileMetadata {
  // Common metadata for both files and directories
  fullPath: string;
  parentDirectory: string;
  name: string;
  creationTime: Date;
  modificationTime: Date;
  accessTime: Date;
  owner: string | null;
  group: string | null;
  permissions: string;
  hidden: boolean;
  isSymlink: boolean;
  symlinkTarget?: string;

  // File-specific metadata
  size?: number;
  extension?: string;
  isBinary?: boolean;
  lineCount?: number;

  // Directory-specific metadata
  depth?: number;
  isEmpty?: boolean;
}

export interface FileSystemEntry {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  fileType?: string;
  hidden: boolean;
  modifiedTime: Date;
  permissions: string;
  isSymlink: boolean;
  metadata: FileMetadata;
  children?: FileSystemEntry[];
}

export interface FileSystemScanOptions {
  includeNodeModules: boolean;
  includeGit: boolean;
  customIgnorePatterns: string[];
  outputFilename: string;
}

export interface FileSystemResult {
  root: string;
  scannedAt: string;
  entries: FileSystemEntry[];
  totalFiles: number;
  totalDirectories: number;
}

const DEFAULT_IGNORE_PATTERNS = [
  '.git',
  '.DS_Store',
  'Thumbs.db',
  '.vscode',
  '.idea',
  '*.tmp',
  '*.log'
];

const NODE_MODULES_PATTERN = 'node_modules';

/**
 * Maps file extensions to readable file types
 */
function getFileType(extension: string): string {
  const typeMap: Record<string, string> = {
    // Code files
    '.ts': 'typescript',
    '.tsx': 'typescript-react',
    '.js': 'javascript',
    '.jsx': 'javascript-react',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'header',
    '.cs': 'csharp',
    '.php': 'php',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.swift': 'swift',
    '.kt': 'kotlin',
    
    // Markup and styling
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    '.xml': 'xml',
    '.svg': 'svg',
    
    // Data and config
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.ini': 'config',
    '.env': 'environment',
    '.config': 'config',
    
    // Documentation
    '.md': 'markdown',
    '.txt': 'text',
    '.pdf': 'pdf',
    '.doc': 'document',
    '.docx': 'document',
    
    // Images
    '.png': 'image',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.gif': 'image',
    '.bmp': 'image',
    '.webp': 'image',
    '.ico': 'icon',
    
    // Media
    '.mp4': 'video',
    '.avi': 'video',
    '.mov': 'video',
    '.mp3': 'audio',
    '.wav': 'audio',
    '.flac': 'audio',
    
    // Archives
    '.zip': 'archive',
    '.tar': 'archive',
    '.gz': 'archive',
    '.rar': 'archive',
    '.7z': 'archive'
  };
  
  return typeMap[extension.toLowerCase()] || 'unknown';
}

/**
 * Gets file permissions as a readable string
 */
function getPermissions(stats: fs.Stats): string {
  const mode = stats.mode;
  let permissions = '';
  
  // Owner permissions
  permissions += (mode & 0o400) ? 'r' : '-';
  permissions += (mode & 0o200) ? 'w' : '-';
  permissions += (mode & 0o100) ? 'x' : '-';
  
  // Group permissions
  permissions += (mode & 0o040) ? 'r' : '-';
  permissions += (mode & 0o020) ? 'w' : '-';
  permissions += (mode & 0o010) ? 'x' : '-';
  
  // Other permissions
  permissions += (mode & 0o004) ? 'r' : '-';
  permissions += (mode & 0o002) ? 'w' : '-';
  permissions += (mode & 0o001) ? 'x' : '-';
  
  return permissions;
}

/**
 * Gets owner and group information from file stats
 */
function getOwnershipInfo(stats: fs.Stats): { owner: string | null; group: string | null } {
  let owner: string | null = null;
  let group: string | null = null;
  
  try {
    // On Unix-like systems, try to get uid/gid names
    if (process.platform !== 'win32') {
      owner = stats.uid?.toString() || null;
      group = stats.gid?.toString() || null;
    }
  } catch (error) {
    // Silently handle errors in ownership lookup
  }
  
  return { owner, group };
}

/**
 * Detects if a file is binary by examining its content
 */
async function detectBinaryFile(filePath: string): Promise<boolean> {
  try {
    const buffer = await fs.readFile(filePath, { encoding: null });
    
    // Check for null bytes which typically indicate binary content
    for (let i = 0; i < Math.min(buffer.length, 8192); i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }
    
    // Check for high percentage of non-printable characters
    let nonPrintable = 0;
    const sampleSize = Math.min(buffer.length, 8192);
    
    for (let i = 0; i < sampleSize; i++) {
      const byte = buffer[i];
      // Consider non-printable if not in typical text range
      if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
        nonPrintable++;
      }
    }
    
    // If more than 30% non-printable characters, consider binary
    return (nonPrintable / sampleSize) > 0.30;
  } catch (error) {
    // If we can't read the file, assume it's binary
    return true;
  }
}

/**
 * Counts lines in a text file
 */
async function countLines(filePath: string): Promise<number> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

/**
 * Checks if a directory is empty
 */
async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dirPath);
    return entries.length === 0;
  } catch (error) {
    return false;
  }
}

/**
 * Collects comprehensive metadata for a file or directory
 */
async function collectMetadata(
  fullPath: string, 
  stats: fs.Stats, 
  isSymlink: boolean,
  depth: number = 0,
  rootPath: string
): Promise<FileMetadata> {
  const parentDirectory = path.dirname(fullPath);
  const name = path.basename(fullPath);
  const { owner, group } = getOwnershipInfo(stats);
  
  let symlinkTarget: string | undefined;
  if (isSymlink) {
    try {
      symlinkTarget = await fs.readlink(fullPath);
    } catch (error) {
      // Handle broken symlinks
      symlinkTarget = undefined;
    }
  }

  const metadata: FileMetadata = {
    fullPath,
    parentDirectory,
    name,
    creationTime: stats.birthtime,
    modificationTime: stats.mtime,
    accessTime: stats.atime,
    owner,
    group,
    permissions: getPermissions(stats),
    hidden: name.startsWith('.'),
    isSymlink,
    symlinkTarget
  };

  if (stats.isFile()) {
    metadata.size = stats.size;
    metadata.extension = path.extname(name);
    
    try {
      metadata.isBinary = await detectBinaryFile(fullPath);
      if (!metadata.isBinary) {
        metadata.lineCount = await countLines(fullPath);
      }
    } catch (error) {
      // Handle errors gracefully
      metadata.isBinary = true;
      metadata.lineCount = 0;
    }
  } else if (stats.isDirectory()) {
    metadata.depth = depth;
    try {
      metadata.isEmpty = await isDirectoryEmpty(fullPath);
    } catch (error) {
      metadata.isEmpty = false;
    }
  }

  return metadata;
}

/**
 * Checks if a file or directory should be ignored
 */
function shouldIgnore(name: string, options: FileSystemScanOptions): boolean {
  // Check if it's node_modules and should be excluded
  if (name === NODE_MODULES_PATTERN && !options.includeNodeModules) {
    return true;
  }
  
  // Check if it's .git and should be excluded
  if (name === '.git' && !options.includeGit) {
    return true;
  }
  
  // Check default ignore patterns
  for (const pattern of DEFAULT_IGNORE_PATTERNS) {
    if (pattern.includes('*')) {
      // Handle wildcard patterns
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(name)) {
        return true;
      }
    } else if (name === pattern) {
      return true;
    }
  }
  
  // Check custom ignore patterns
  for (const pattern of options.customIgnorePatterns) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(name)) {
        return true;
      }
    } else if (name === pattern) {
      return true;
    }
  }
  
  return false;
}

/**
 * Recursively scans a directory and builds file system tree
 */
async function scanDirectory(
  dirPath: string,
  options: FileSystemScanOptions,
  progressCallback?: (processedCount: number, currentPath: string) => void,
  processedCount = { value: 0 },
  depth: number = 0,
  rootPath: string = dirPath
): Promise<FileSystemEntry[]> {
  const entries: FileSystemEntry[] = [];
  
  try {
    const dirContents = await fs.readdir(dirPath);
    
    for (const name of dirContents) {
      const fullPath = path.join(dirPath, name);
      
      // Skip ignored files/directories
      if (shouldIgnore(name, options)) {
        continue;
      }
      
      try {
        const stats = await fs.lstat(fullPath);
        const isSymlink = stats.isSymbolicLink();
        
        // If it's a symlink, get the target stats
        let actualStats = stats;
        if (isSymlink) {
          try {
            actualStats = await fs.stat(fullPath);
          } catch (error) {
            // Broken symlink - still collect metadata for the symlink itself
            actualStats = stats;
          }
        }
        
        // Collect comprehensive metadata
        const metadata = await collectMetadata(fullPath, actualStats, isSymlink, depth, rootPath);
        
        const entry: FileSystemEntry = {
          name,
          type: actualStats.isDirectory() ? 'directory' : 'file',
          hidden: name.startsWith('.'),
          modifiedTime: actualStats.mtime,
          permissions: getPermissions(actualStats),
          isSymlink,
          metadata
        };
        
        if (actualStats.isFile()) {
          entry.size = actualStats.size;
          entry.extension = path.extname(name);
          entry.fileType = getFileType(entry.extension);
        }
        
        if (actualStats.isDirectory()) {
          // Recursively scan subdirectory
          entry.children = await scanDirectory(
            fullPath,
            options,
            progressCallback,
            processedCount,
            depth + 1,
            rootPath
          );
        }
        
        entries.push(entry);
        
        // Update progress
        processedCount.value++;
        if (progressCallback) {
          progressCallback(processedCount.value, fullPath);
        }
        
      } catch (error) {
        // Skip files that can't be accessed
        console.warn(`Warning: Cannot access ${fullPath}: ${error}`);
        continue;
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}: ${error}`);
  }
  
  return entries;
}

/**
 * Counts total files and directories in the file system tree
 */
function countEntries(entries: FileSystemEntry[]): { files: number; directories: number } {
  let files = 0;
  let directories = 0;
  
  for (const entry of entries) {
    if (entry.type === 'file') {
      files++;
    } else if (entry.type === 'directory') {
      directories++;
      if (entry.children) {
        const childCounts = countEntries(entry.children);
        files += childCounts.files;
        directories += childCounts.directories;
      }
    }
  }
  
  return { files, directories };
}

/**
 * Scans the file system starting from the given root path
 */
export async function scanFileSystem(
  rootPath: string,
  options: Partial<FileSystemScanOptions> = {}
): Promise<FileSystemResult> {
  const fullOptions: FileSystemScanOptions = {
    includeNodeModules: false,
    includeGit: false,
    customIgnorePatterns: [],
    outputFilename: 'files.json',
    ...options
  };
  
  const absoluteRoot = path.resolve(rootPath);
  
  // Verify root path exists
  try {
    const stats = await fs.stat(absoluteRoot);
    if (!stats.isDirectory()) {
      throw new Error(`Path ${absoluteRoot} is not a directory`);
    }
  } catch (error) {
    throw new Error(`Cannot access root path ${absoluteRoot}: ${error}`);
  }
  
  console.log(`Scanning file system: ${absoluteRoot}`);
  if (!fullOptions.includeNodeModules) {
    console.log('Excluding node_modules (use --include-node-modules to include)');
  }
  
  let processedCount = 0;
  const progressCallback = (count: number, currentPath: string) => {
    processedCount = count;
    if (count % 100 === 0) {
      console.log(`Processed ${count} entries... (current: ${path.relative(absoluteRoot, currentPath)})`);
    }
  };
  
  const entries = await scanDirectory(
    absoluteRoot,
    fullOptions,
    progressCallback,
    { value: 0 },
    0,
    absoluteRoot
  );
  
  const { files, directories } = countEntries(entries);
  
  console.log(`Scan complete: Found ${files} files and ${directories} directories`);
  
  return {
    root: absoluteRoot,
    scannedAt: new Date().toISOString(),
    entries,
    totalFiles: files,
    totalDirectories: directories
  };
}
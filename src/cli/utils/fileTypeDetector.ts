import mimeTypes from 'mime-types';
import { fileTypeFromFile } from 'file-type';
import { isBinaryFile } from 'isbinaryfile';
import path from 'path';

export interface FileDetectionResult {
  isBinaryFile: boolean;
  mimeType: string;
  confidence: 'high' | 'medium' | 'low';
  detectionMethod: 'extension' | 'content' | 'fallback';
  fileSize?: number;
  encoding?: string;
  // Code detection fields
  isCode: boolean;
  languageHint: string;
  codeConfidence: 'high' | 'medium' | 'low';
  codeDetectionMethod: 'mime' | 'shebang' | 'modeline' | 'extension' | 'structure';
  // Executable detection fields
  isExecutable: boolean;
  executableConfidence: 'high' | 'medium' | 'low';
  executableReason: string; // Why it was flagged as executable
}

export class FileTypeDetector {
  // MIME type to code classification mappings
  private static readonly CODE_MIME_TYPES = new Set([
    'text/x-c', 'text/x-c++', 'text/x-csharp', 'text/x-java-source',
    'text/x-python', 'text/x-ruby', 'text/x-php', 'text/x-perl',
    'text/x-shellscript', 'text/x-sh', 'text/x-bash',
    'application/javascript', 'text/javascript', 'application/x-typescript',
    'text/html', 'text/css', 'application/json', 'application/xml', 'text/xml',
    'image/svg+xml', 'application/x-yaml', 'text/yaml',
    'application/x-toml', 'text/x-markdown', 'text/markdown',
    'application/x-ini', 'text/x-properties'
  ]);

  // Extension to language mappings
  private static readonly EXTENSION_LANGUAGE_MAP: Record<string, string> = {
    '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript',
    '.ts': 'typescript', '.tsx': 'typescript',
    '.py': 'python', '.pyw': 'python',
    '.rb': 'ruby', '.rbw': 'ruby',
    '.php': 'php', '.phar': 'php',
    '.java': 'java', '.class': 'java',
    '.c': 'c', '.h': 'c',
    '.cpp': 'cpp', '.cc': 'cpp', '.cxx': 'cpp', '.hpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.swift': 'swift',
    '.kt': 'kotlin', '.kts': 'kotlin',
    '.scala': 'scala',
    '.html': 'html', '.htm': 'html',
    '.css': 'css', '.scss': 'scss', '.sass': 'sass', '.less': 'less',
    '.json': 'json',
    '.xml': 'xml', '.xsd': 'xml', '.xsl': 'xml',
    '.yaml': 'yaml', '.yml': 'yaml',
    '.toml': 'toml',
    '.ini': 'ini', '.cfg': 'ini', '.conf': 'ini',
    '.md': 'markdown', '.markdown': 'markdown',
    '.sh': 'shell', '.bash': 'bash', '.zsh': 'shell',
    '.sql': 'sql',
    '.r': 'r', '.R': 'r',
    '.m': 'objective-c', '.mm': 'objective-c',
    '.pl': 'perl', '.pm': 'perl',
    '.lua': 'lua',
    '.vim': 'vimscript',
    '.dockerfile': 'dockerfile'
  };

  // Executable file extensions (likely to contain executable code)
  private static readonly EXECUTABLE_EXTENSIONS = new Set([
    '.js', '.jsx', '.mjs', '.cjs',     // JavaScript variants
    '.ts', '.tsx',                     // TypeScript variants
    '.sh', '.bash', '.zsh', '.fish',   // Shell scripts
    '.bat', '.cmd', '.ps1',            // Windows scripts
    '.py', '.pyw',                     // Python scripts
    '.rb',                             // Ruby scripts
    '.pl', '.pm'                       // Perl scripts
  ]);

  // Common executable file patterns (basename matching)
  private static readonly EXECUTABLE_BASENAMES = new Set([
    'index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts',
    'server.js', 'server.ts', 'cli.js', 'cli.ts', 'start.js', 'start.ts',
    'run.js', 'run.ts', 'script.js', 'script.ts'
  ]);

  // Directory paths that commonly contain executable files
  private static readonly EXECUTABLE_DIRECTORIES = new Set([
    'bin', 'scripts', 'cli', 'tools', 'build', 'tasks'
  ]);

  /**
   * Get appropriate MIME type for known code extensions
   */
  private getCodeMimeType(extension: string): string {
    const codeMimeMap: Record<string, string> = {
      '.ts': 'application/typescript',
      '.tsx': 'application/typescript',
      '.js': 'application/javascript',
      '.jsx': 'application/javascript',
      '.py': 'text/x-python',
      '.java': 'text/x-java',
      '.cpp': 'text/x-c++',
      '.c': 'text/x-c',
      '.cs': 'text/x-csharp',
      '.go': 'text/x-go',
      '.rs': 'text/x-rust',
      '.swift': 'text/x-swift',
      '.kt': 'text/x-kotlin',
      '.scala': 'text/x-scala',
      '.rb': 'text/x-ruby',
      '.php': 'text/x-php',
      '.html': 'text/html',
      '.css': 'text/css',
      '.scss': 'text/x-scss',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.yaml': 'application/x-yaml',
      '.yml': 'application/x-yaml'
    };
    
    return codeMimeMap[extension] || 'text/plain';
  }

  /**
   * Multi-stage file type detection strategy:
   * 1. Extension-based detection (mime-types)
   * 2. Content-based detection (file-type) 
   * 3. Binary detection fallback (isbinaryfile)
   * 4. Code detection pipeline
   */
  async detectFileType(filePath: string): Promise<FileDetectionResult> {
    try {
      // Stage 1: Extension-based detection (fastest, most reliable)
      const extensionResult = this.detectByExtension(filePath);
      if (extensionResult.confidence === 'high') {
        // Add code detection to high-confidence extension results
        const codeInfo = await this.detectCodeType(filePath, extensionResult);
        const fullResult = { ...extensionResult, ...codeInfo };
        const executableInfo = await this.detectExecutable(filePath, fullResult);
        return { ...fullResult, ...executableInfo };
      }

      // Stage 2: Content-based detection (slower, but more accurate for extensionless files)
      const contentResult = await this.detectByContent(filePath);
      if (contentResult.confidence === 'high') {
        const codeInfo = await this.detectCodeType(filePath, contentResult);
        const fullResult = { ...contentResult, ...codeInfo };
        const executableInfo = await this.detectExecutable(filePath, fullResult);
        return { ...fullResult, ...executableInfo };
      }

      // Stage 3: Fallback binary detection (last resort)
      const fallbackResult = await this.detectByFallback(filePath);
      const codeInfo = await this.detectCodeType(filePath, fallbackResult);
      const fullResult = { ...fallbackResult, ...codeInfo };
      const executableInfo = await this.detectExecutable(filePath, fullResult);
      return { ...fullResult, ...executableInfo };

    } catch (error) {
      // Ultimate fallback for any detection errors
      return {
        isBinaryFile: true,
        mimeType: 'application/octet-stream',
        confidence: 'low',
        detectionMethod: 'fallback',
        isCode: false,
        languageHint: 'unknown',
        codeConfidence: 'low',
        codeDetectionMethod: 'extension',
        isExecutable: false,
        executableConfidence: 'high',
        executableReason: 'Binary file - not executable code'
      };
    }
  }

  /**
   * Multi-stage code detection pipeline
   */
  private async detectCodeType(filePath: string, baseResult: Partial<FileDetectionResult>): Promise<Pick<FileDetectionResult, 'isCode' | 'languageHint' | 'codeConfidence' | 'codeDetectionMethod'>> {
    // Skip code detection for binary files
    if (baseResult.isBinaryFile) {
      return {
        isCode: false,
        languageHint: 'binary',
        codeConfidence: 'high',
        codeDetectionMethod: 'extension'
      };
    }

    // Stage 1: MIME type analysis
    if (baseResult.mimeType) {
      const mimeCodeInfo = this.detectCodeByMime(baseResult.mimeType, filePath);
      if (mimeCodeInfo.codeConfidence === 'high') {
        return mimeCodeInfo;
      }
    }

    // Stage 2: Content-based detection (shebang, modelines)
    const contentCodeInfo = await this.detectCodeByContent(filePath);
    if (contentCodeInfo.codeConfidence === 'high') {
      return contentCodeInfo;
    }

    // Stage 3: Extension fallback
    const extensionCodeInfo = this.detectCodeByExtension(filePath);
    if (extensionCodeInfo.codeConfidence === 'high') {
      return extensionCodeInfo;
    }

    // Stage 4: Structural analysis
    const structuralCodeInfo = await this.detectCodeByStructure(filePath);
    return structuralCodeInfo;
  }

  /**
   * Stage 1: Extension-based detection using mime-types package
   */
  private detectByExtension(filePath: string): FileDetectionResult {
    const ext = path.extname(filePath);
    
    if (!ext) {
      return {
        isBinaryFile: false,
        mimeType: 'text/plain',
        confidence: 'low',
        detectionMethod: 'extension',
        isCode: false,
        languageHint: 'text',
        codeConfidence: 'low',
        codeDetectionMethod: 'extension'
      };
    }

    // PRIORITY FIX: Check if extension is a known code type first
    // This prevents mime-types library from incorrectly mapping .ts to video/mp2t
    const lowerExt = ext.toLowerCase();
    const knownLanguage = FileTypeDetector.EXTENSION_LANGUAGE_MAP[lowerExt];
    
    if (knownLanguage) {
      // Override MIME detection for known code extensions
      const codeBasedMimeType = this.getCodeMimeType(lowerExt);
      return {
        isBinaryFile: false,
        mimeType: codeBasedMimeType,
        confidence: 'high',
        detectionMethod: 'extension',
        isCode: false, // Will be determined by detectCodeType
        languageHint: 'unknown',
        codeConfidence: 'low',
        codeDetectionMethod: 'extension'
      };
    }

    const mimeType = mimeTypes.lookup(ext);
    
    if (mimeType) {
      const isTextMime = mimeType.startsWith('text/') || 
                         mimeType === 'application/json' ||
                         mimeType === 'application/javascript' ||
                         mimeType === 'application/typescript' ||
                         mimeType.includes('xml');

      return {
        isBinaryFile: !isTextMime,
        mimeType: mimeType,
        confidence: 'high',
        detectionMethod: 'extension',
        isCode: false, // Will be determined by detectCodeType
        languageHint: 'unknown',
        codeConfidence: 'low',
        codeDetectionMethod: 'extension'
      };
    }

    // Unknown extension
    return {
      isBinaryFile: false,
      mimeType: 'text/plain',
      confidence: 'low',
      detectionMethod: 'extension',
      isCode: false,
      languageHint: 'text',
      codeConfidence: 'low',
      codeDetectionMethod: 'extension'
    };
  }

  /**
   * Stage 2: Content-based detection using file-type package
   */
  private async detectByContent(filePath: string): Promise<FileDetectionResult> {
    try {
      const fileType = await fileTypeFromFile(filePath);
      
      if (fileType) {
        const isTextMime = fileType.mime.startsWith('text/') || 
                          fileType.mime === 'application/json' ||
                          fileType.mime.includes('javascript') ||
                          fileType.mime.includes('xml');

        return {
          isBinaryFile: !isTextMime,
          mimeType: fileType.mime,
          confidence: 'high',
          detectionMethod: 'content',
          isCode: false,
          languageHint: 'unknown',
          codeConfidence: 'low',
          codeDetectionMethod: 'extension'
        };
      }

      // No magic number match found - likely text file
      return {
        isBinaryFile: false,
        mimeType: 'text/plain',
        confidence: 'medium',
        detectionMethod: 'content',
        isCode: false,
        languageHint: 'text',
        codeConfidence: 'low',
        codeDetectionMethod: 'extension'
      };

    } catch (error) {
      // Error reading file for content analysis
      return {
        isBinaryFile: true,
        mimeType: 'application/octet-stream',
        confidence: 'low',
        detectionMethod: 'content',
        isCode: false,
        languageHint: 'unknown',
        codeConfidence: 'low',
        codeDetectionMethod: 'extension'
      };
    }
  }

  /**
   * Stage 3: Binary detection fallback using isbinaryfile package
   */
  private async detectByFallback(filePath: string): Promise<FileDetectionResult> {
    try {
      const isBinary = await isBinaryFile(filePath);
      
      return {
        isBinaryFile: isBinary,
        mimeType: isBinary ? 'application/octet-stream' : 'text/plain',
        confidence: 'medium',
        detectionMethod: 'fallback',
        isCode: false,
        languageHint: isBinary ? 'binary' : 'text',
        codeConfidence: 'low',
        codeDetectionMethod: 'extension'
      };

    } catch (error) {
      // Final fallback for any errors
      return {
        isBinaryFile: true,
        mimeType: 'application/octet-stream',
        confidence: 'low',
        detectionMethod: 'fallback',
        isCode: false,
        languageHint: 'unknown',
        codeConfidence: 'low',
        codeDetectionMethod: 'extension'
      };
    }
  }

  /**
   * Code detection by MIME type analysis
   */
  private detectCodeByMime(mimeType: string, filePath: string): Pick<FileDetectionResult, 'isCode' | 'languageHint' | 'codeConfidence' | 'codeDetectionMethod'> {
    if (FileTypeDetector.CODE_MIME_TYPES.has(mimeType)) {
      const languageHint = this.mimeToLanguage(mimeType);
      return {
        isCode: true,
        languageHint,
        codeConfidence: 'high',
        codeDetectionMethod: 'mime'
      };
    }

    // Non-code MIME types
    if (mimeType === 'text/plain' || mimeType === 'text/csv' || mimeType === 'text/rtf') {
      return {
        isCode: false,
        languageHint: mimeType === 'text/csv' ? 'csv' : 'text',
        codeConfidence: 'high',
        codeDetectionMethod: 'mime'
      };
    }

    return {
      isCode: false,
      languageHint: 'unknown',
      codeConfidence: 'low',
      codeDetectionMethod: 'mime'
    };
  }

  /**
   * Code detection by file content (shebang, modelines)
   */
  private async detectCodeByContent(filePath: string): Promise<Pick<FileDetectionResult, 'isCode' | 'languageHint' | 'codeConfidence' | 'codeDetectionMethod'>> {
    try {
      // Read first few lines for shebang and modeline detection
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').slice(0, 10); // Check first 10 lines

      // Check for shebang
      const shebangResult = this.detectShebang(lines[0]);
      if (shebangResult.codeConfidence === 'high') {
        return shebangResult;
      }

      // Check for modelines in first/last few lines
      const modelineResult = this.detectModeline(lines);
      if (modelineResult.codeConfidence === 'high') {
        return modelineResult;
      }

      return {
        isCode: false,
        languageHint: 'text',
        codeConfidence: 'low',
        codeDetectionMethod: 'extension'
      };

    } catch (error) {
      return {
        isCode: false,
        languageHint: 'unknown',
        codeConfidence: 'low',
        codeDetectionMethod: 'extension'
      };
    }
  }

  /**
   * Code detection by extension
   */
  private detectCodeByExtension(filePath: string): Pick<FileDetectionResult, 'isCode' | 'languageHint' | 'codeConfidence' | 'codeDetectionMethod'> {
    const ext = path.extname(filePath).toLowerCase();
    const languageHint = FileTypeDetector.EXTENSION_LANGUAGE_MAP[ext];

    if (languageHint) {
      return {
        isCode: true,
        languageHint,
        codeConfidence: 'high',
        codeDetectionMethod: 'extension'
      };
    }

    return {
      isCode: false,
      languageHint: 'text',
      codeConfidence: 'low',
      codeDetectionMethod: 'extension'
    };
  }

  /**
   * Code detection by structural analysis
   */
  private async detectCodeByStructure(filePath: string): Promise<Pick<FileDetectionResult, 'isCode' | 'languageHint' | 'codeConfidence' | 'codeDetectionMethod'>> {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      const trimmed = content.trim();

      // JSON structure detection
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          JSON.parse(content);
          return {
            isCode: true,
            languageHint: 'json',
            codeConfidence: 'medium',
            codeDetectionMethod: 'structure'
          };
        } catch {}
      }

      // XML structure detection
      if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
        return {
          isCode: true,
          languageHint: 'xml',
          codeConfidence: 'medium',
          codeDetectionMethod: 'structure'
        };
      }

      // YAML structure detection (basic)
      if (content.includes(':\n') || content.includes(': ') || content.includes('---\n')) {
        return {
          isCode: true,
          languageHint: 'yaml',
          codeConfidence: 'low',
          codeDetectionMethod: 'structure'
        };
      }

      return {
        isCode: false,
        languageHint: 'text',
        codeConfidence: 'low',
        codeDetectionMethod: 'structure'
      };

    } catch (error) {
      return {
        isCode: false,
        languageHint: 'unknown',
        codeConfidence: 'low',
        codeDetectionMethod: 'structure'
      };
    }
  }

  /**
   * Detect shebang lines
   */
  private detectShebang(firstLine: string): Pick<FileDetectionResult, 'isCode' | 'languageHint' | 'codeConfidence' | 'codeDetectionMethod'> {
    if (!firstLine.startsWith('#!')) {
      return {
        isCode: false,
        languageHint: 'text',
        codeConfidence: 'low',
        codeDetectionMethod: 'shebang'
      };
    }

    const shebangMap: Record<string, string> = {
      'python': 'python',
      'python3': 'python',
      'node': 'javascript',
      'bash': 'bash',
      'sh': 'shell',
      'zsh': 'shell',
      'perl': 'perl',
      'ruby': 'ruby',
      'php': 'php'
    };

    for (const [key, language] of Object.entries(shebangMap)) {
      if (firstLine.includes(key)) {
        return {
          isCode: true,
          languageHint: language,
          codeConfidence: 'high',
          codeDetectionMethod: 'shebang'
        };
      }
    }

    return {
      isCode: true, // Has shebang, likely code even if unknown
      languageHint: 'script',
      codeConfidence: 'medium',
      codeDetectionMethod: 'shebang'
    };
  }

  /**
   * Detect editor modelines (Emacs and Vim)
   */
  private detectModeline(lines: string[]): Pick<FileDetectionResult, 'isCode' | 'languageHint' | 'codeConfidence' | 'codeDetectionMethod'> {
    for (const line of lines) {
      // Emacs modeline: -*- python -*-
      const emacsMatch = line.match(/-\*-\s*([a-zA-Z0-9-]+)\s*-\*-/);
      if (emacsMatch) {
        return {
          isCode: true,
          languageHint: emacsMatch[1].toLowerCase(),
          codeConfidence: 'high',
          codeDetectionMethod: 'modeline'
        };
      }

      // Vim modeline: /* vim: set filetype=javascript: */
      const vimMatch = line.match(/vim:\s*.*filetype=([a-zA-Z0-9-]+)/);
      if (vimMatch) {
        return {
          isCode: true,
          languageHint: vimMatch[1].toLowerCase(),
          codeConfidence: 'high',
          codeDetectionMethod: 'modeline'
        };
      }
    }

    return {
      isCode: false,
      languageHint: 'text',
      codeConfidence: 'low',
      codeDetectionMethod: 'modeline'
    };
  }

  /**
   * Map MIME types to language hints
   */
  private mimeToLanguage(mimeType: string): string {
    const mimeLanguageMap: Record<string, string> = {
      'text/x-c': 'c',
      'text/x-c++': 'cpp',
      'text/x-csharp': 'csharp',
      'text/x-java-source': 'java',
      'text/x-python': 'python',
      'text/x-ruby': 'ruby',
      'text/x-php': 'php',
      'text/x-perl': 'perl',
      'text/x-shellscript': 'shell',
      'text/x-sh': 'shell',
      'text/x-bash': 'bash',
      'application/javascript': 'javascript',
      'text/javascript': 'javascript',
      'application/x-typescript': 'typescript',
      'text/html': 'html',
      'text/css': 'css',
      'application/json': 'json',
      'application/xml': 'xml',
      'text/xml': 'xml',
      'image/svg+xml': 'svg',
      'application/x-yaml': 'yaml',
      'text/yaml': 'yaml',
      'application/x-toml': 'toml',
      'text/x-markdown': 'markdown',
      'text/markdown': 'markdown',
      'application/x-ini': 'ini',
      'text/x-properties': 'properties'
    };

    return mimeLanguageMap[mimeType] || 'unknown';
  }

  /**
   * Detect if a file is executable based on multiple criteria
   */
  private async detectExecutable(filePath: string, baseResult: Partial<FileDetectionResult>): Promise<Pick<FileDetectionResult, 'isExecutable' | 'executableConfidence' | 'executableReason'>> {
    const reasons: string[] = [];
    let confidence: 'high' | 'medium' | 'low' = 'low';
    
    // Only consider code files for executable detection
    if (!baseResult.isCode) {
      return {
        isExecutable: false,
        executableConfidence: 'high',
        executableReason: 'Not a code file'
      };
    }

    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath).toLowerCase();
    const dirname = path.dirname(filePath);
    const dirName = path.basename(dirname).toLowerCase();

    // Check extension-based executable detection
    if (FileTypeDetector.EXECUTABLE_EXTENSIONS.has(ext)) {
      reasons.push(`executable extension: ${ext}`);
      confidence = 'medium';
    }

    // Check basename patterns
    if (FileTypeDetector.EXECUTABLE_BASENAMES.has(basename)) {
      reasons.push(`executable basename: ${basename}`);
      confidence = 'high';
    }

    // Check directory context
    if (FileTypeDetector.EXECUTABLE_DIRECTORIES.has(dirName)) {
      reasons.push(`executable directory: ${dirName}`);
      confidence = confidence === 'high' ? 'high' : 'medium';
    }

    // Check for shebang in first line
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      const firstLine = content.split('\n')[0];
      
      if (firstLine.startsWith('#!')) {
        reasons.push('shebang line detected');
        confidence = 'high';
      }
    } catch (error) {
      // Can't read file content, rely on other detection methods
    }

    const isExecutable = reasons.length > 0;
    const finalConfidence = isExecutable ? confidence : 'high';
    const reason = isExecutable ? reasons.join(', ') : 'No executable indicators found';

    return {
      isExecutable,
      executableConfidence: finalConfidence,
      executableReason: reason
    };
  }

  /**
   * Optimized detection for large files - only read small sample
   */
  async detectFileTypeOptimized(filePath: string, maxSampleSize: number = 8192): Promise<FileDetectionResult> {
    // For large files, still do extension detection first
    const extensionResult = this.detectByExtension(filePath);
    if (extensionResult.confidence === 'high') {
      const codeInfo = await this.detectCodeType(filePath, extensionResult);
      return { ...extensionResult, ...codeInfo };
    }

    // For content detection on large files, we'll rely on file-type's internal buffering
    // The package handles large files efficiently by only reading the necessary bytes
    const contentResult = await this.detectByContent(filePath);
    const codeInfo = await this.detectCodeType(filePath, contentResult);
    return { ...contentResult, ...codeInfo };
  }
}
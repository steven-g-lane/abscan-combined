import { Project, SourceFile, EnumDeclaration, ImportDeclaration, Node, SyntaxKind } from 'ts-morph';
import { 
  ComprehensiveEnumSummary, 
  EnumReference, 
  EnumAnalysisResult, 
  CodeLocation, 
  EnumMember 
} from '../models';
import { globalProfiler } from '../utils/profiler';

export class EnumAnalyzer {
  private project: Project;
  private enumRegistry: Map<string, ComprehensiveEnumSummary> = new Map();
  private importedEnumRegistry: Map<string, string> = new Map(); // enumName -> sourceModule
  private enumNameIndex: Map<string, string[]> = new Map(); // enumName -> enumIds[]

  constructor(project: Project) {
    this.project = project;
  }

  public analyzeEnums(filteredFiles?: SourceFile[]): EnumAnalysisResult {
    return globalProfiler.measure('analyzeEnums_total', () => {
      this.enumRegistry.clear();
      this.importedEnumRegistry.clear();
      this.enumNameIndex.clear();

      const sourceFiles = filteredFiles || this.project.getSourceFiles();
      
      globalProfiler.start('enum_cataloging_phase', { 
        fileCount: sourceFiles.length
      });
      
      // First pass: catalog all local enums and imported enums
      for (const sourceFile of sourceFiles) {
        this.catalogLocalEnums(sourceFile);
        this.catalogImportedEnums(sourceFile);
      }
      
      globalProfiler.end('enum_cataloging_phase');
      globalProfiler.start('enum_reference_finding_phase', { fileCount: sourceFiles.length });

      // Second pass: find all enum references
      for (const sourceFile of sourceFiles) {
        this.findEnumReferences(sourceFile);
      }
      
      globalProfiler.end('enum_reference_finding_phase');
      
      // Calculate reference counts for all enums
      this.calculateReferenceCounts();

      return {
        projectRoot: this.project.getRootDirectories()[0]?.getPath() || '',
        scannedAt: new Date().toISOString(),
        enums: Array.from(this.enumRegistry.values())
      };
    }) as EnumAnalysisResult;
  }

  private catalogLocalEnums(sourceFile: SourceFile): void {
    // Get all enum declarations using ts-morph native capabilities
    const enumDeclarations = sourceFile.getEnums();
    
    enumDeclarations.forEach(enumDeclaration => {
      const enumName = enumDeclaration.getName();
      const id = this.generateEnumId(enumName, sourceFile.getFilePath());
      
      // Extract enum members
      const members = this.extractEnumMembers(enumDeclaration);
      
      // Calculate source LOC for the enum
      const sourceLOC = this.calculateEnumLOC(enumDeclaration);
      const sourceFilename = sourceFile.getBaseName();
      
      // Get JSDoc description
      const jsdocDescription = this.extractJSDocDescription(enumDeclaration);
      
      const comprehensiveEnum: ComprehensiveEnumSummary = {
        name: enumName,
        id,
        isLocal: true,
        location: this.getLocation(enumDeclaration, sourceFile.getFilePath()),
        members,
        jsdocDescription,
        references: [],
        sourceLOC,
        sourceFilename
      };

      this.enumRegistry.set(id, comprehensiveEnum);
      
      // Build enum name index for O(1) lookups
      const existingIds = this.enumNameIndex.get(enumName) || [];
      existingIds.push(id);
      this.enumNameIndex.set(enumName, existingIds);
    });
  }

  private catalogImportedEnums(sourceFile: SourceFile): void {
    // DISABLED: Imported enum detection is unreliable because we can't determine
    // from import statements alone whether an identifier is actually an enum.
    // This was causing false positives with React components, classes, and types.
    // 
    // To properly detect imported enums, we would need to:
    // 1. Parse the source modules being imported
    // 2. Or use TypeScript's type checker to determine the symbol type
    // 3. Or rely on naming conventions that are much more specific
    //
    // For now, we only detect locally defined enums which can be reliably
    // identified using ts-morph's native enum detection capabilities.
    return;
  }

  private findEnumReferences(sourceFile: SourceFile): void {
    const fileName = sourceFile.getBaseName();
    globalProfiler.start(`findEnumReferences_${fileName}`, { 
      fileName,
      fileSize: sourceFile.getFullText().length 
    });
    
    // Use targeted identifier search instead of full AST traversal
    const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
    
    for (const node of identifiers) {
      const text = node.getText();
      
      // Early filtering - skip obvious non-enum identifiers
      if (!this.couldBeEnumName(text)) {
        continue;
      }
      
      // Check if this identifier matches a known enum
      const enumEntry = this.findEnumByName(text);
      if (enumEntry) {
        const location = this.getLocation(node, sourceFile.getFilePath());
        const context = this.getUsageContext(node);
        
        // Don't count the enum declaration itself as a reference
        if (!this.isEnumDeclaration(node, text)) {
          const contextLine = this.getContextLine(node);
          const reference: EnumReference = {
            location,
            contextLine,
            context
          };
          
          enumEntry.references.push(reference);
        }
      }
    }
    
    globalProfiler.end(`findEnumReferences_${fileName}`);
  }

  private extractEnumMembers(enumDeclaration: EnumDeclaration): EnumMember[] {
    return enumDeclaration.getMembers().map(member => {
      const name = member.getName();
      const value = member.getValue();
      const location = this.getLocation(member, enumDeclaration.getSourceFile().getFilePath());
      
      return {
        name,
        value: value !== undefined ? value : undefined,
        location
      };
    });
  }

  private extractJSDocDescription(enumDeclaration: EnumDeclaration): string | undefined {
    const jsDocs = enumDeclaration.getJsDocs();
    if (jsDocs.length > 0) {
      return jsDocs[0].getDescription().trim() || undefined;
    }
    return undefined;
  }

  private findEnumByName(enumName: string): ComprehensiveEnumSummary | undefined {
    // Use enum name index for O(1) lookup
    const enumIds = this.enumNameIndex.get(enumName);
    if (!enumIds || enumIds.length === 0) {
      return undefined;
    }
    
    // Prioritize local enums over imported ones
    for (const id of enumIds) {
      const enumData = this.enumRegistry.get(id);
      if (enumData && enumData.isLocal) {
        return enumData;
      }
    }
    
    // Return first imported enum if no local enum found
    for (const id of enumIds) {
      const enumData = this.enumRegistry.get(id);
      if (enumData && !enumData.isLocal) {
        return enumData;
      }
    }
    
    return undefined;
  }

  private isEnumDeclaration(node: Node, enumName: string): boolean {
    // Check if this identifier is part of an enum declaration
    const parent = node.getParent();
    if (Node.isEnumDeclaration(parent)) {
      const nameNode = parent.getNameNode();
      return nameNode === node;
    }
    return false;
  }

  private getUsageContext(node: Node): string {
    const parent = node.getParent();
    if (!parent) return 'unknown';
    
    // Check if it's a member access (e.g., MyEnum.VALUE)
    if (Node.isPropertyAccessExpression(parent) && parent.getExpression() === node) {
      return 'enum_access';
    } else if (Node.isPropertyAccessExpression(parent) && parent.getName() === node.getText()) {
      return 'enum_member_access';
    } else if (Node.isTypeReference(parent)) {
      return 'type_annotation';
    } else if (Node.isVariableDeclaration(parent)) {
      return 'variable_declaration';
    } else if (Node.isParameterDeclaration(parent)) {
      return 'parameter';
    } else if (Node.isPropertyDeclaration(parent)) {
      return 'property';
    } else if (Node.isPropertySignature(parent)) {
      return 'property_signature';
    } else if (Node.isMethodSignature(parent)) {
      return 'method_signature';
    } else if (Node.isCallExpression(parent)) {
      return 'function_call';
    }
    
    return 'reference';
  }


  private couldBeEnumName(name: string): boolean {
    // Enhanced heuristic for better filtering
    // Enums typically follow PascalCase convention
    if (!/^[A-Z]/.test(name)) return false;
    
    // Skip common non-enum keywords and built-ins
    const nonEnumKeywords = new Set([
      'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date',
      'Function', 'RegExp', 'Error', 'JSON', 'Math', 'console', 'window',
      'document', 'undefined', 'null', 'true', 'false', 'NaN', 'Infinity',
      'React', 'Component', 'Props', 'State', 'JSX'
    ]);
    
    if (nonEnumKeywords.has(name)) return false;
    
    // Skip single letter identifiers (likely generics)
    if (name.length === 1) return false;
    
    return true;
  }

  private calculateReferenceCounts(): void {
    // Calculate reference count for each enum based on references array length
    for (const enumData of this.enumRegistry.values()) {
      enumData.referenceCount = enumData.references.length;
    }
  }

  private calculateEnumLOC(enumDeclaration: EnumDeclaration): number {
    // Calculate actual lines from start to end of enum
    const start = enumDeclaration.getStart();
    const end = enumDeclaration.getEnd();
    const sourceFile = enumDeclaration.getSourceFile();
    const startLineAndColumn = sourceFile.getLineAndColumnAtPos(start);
    const endLineAndColumn = sourceFile.getLineAndColumnAtPos(end);
    
    return endLineAndColumn.line - startLineAndColumn.line + 1;
  }

  private generateEnumId(enumName: string, source: string): string {
    return `${enumName}:${source}`;
  }

  private getLocation(node: Node, filePath: string): CodeLocation {
    const start = node.getStart();
    const end = node.getEnd();
    const sourceFile = node.getSourceFile();
    const startLineAndColumn = sourceFile.getLineAndColumnAtPos(start);
    const endLineAndColumn = sourceFile.getLineAndColumnAtPos(end);
    
    return {
      file: filePath,
      line: startLineAndColumn.line,
      column: startLineAndColumn.column,
      endLine: endLineAndColumn.line
    };
  }

  private getContextLine(node: Node): string {
    const sourceFile = node.getSourceFile();
    const start = node.getStart();
    const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
    const fullText = sourceFile.getFullText();
    const lines = fullText.split('\n');
    
    if (lineAndColumn.line >= 0 && lineAndColumn.line < lines.length) {
      return lines[lineAndColumn.line].trim();
    }
    
    return '';
  }
}

function shouldProcessFile(filePath: string): boolean {
  // Skip test files
  if (filePath.includes('.test.') || filePath.includes('.spec.') || 
      filePath.includes('/test/') || filePath.includes('/tests/') ||
      filePath.includes('/__tests__/')) {
    return false;
  }
  
  // Skip build artifacts and examples
  if (filePath.includes('/dist/') || filePath.includes('/build/') ||
      filePath.includes('/example/') || filePath.includes('/examples/') ||
      filePath.includes('/docs/') || filePath.includes('/demo/')) {
    return false;
  }
  
  // Skip node_modules
  if (filePath.includes('/node_modules/')) {
    return false;
  }
  
  return true;
}

export async function analyzeEnumsInProject(projectPath: string): Promise<EnumAnalysisResult> {
  return globalProfiler.measure('analyzeEnumsInProject_total', async () => {
    globalProfiler.start('enum_project_initialization');
    const project = new Project({
      skipAddingFilesFromTsConfig: true,
    });
    globalProfiler.end('enum_project_initialization');

    globalProfiler.start('enum_file_loading');
    // Add source files with smart filtering - exclude problematic directories upfront
    const filePatterns = [
      `${projectPath}/src/**/*.{ts,tsx,js,jsx}`,
      `${projectPath}/lib/**/*.{ts,tsx,js,jsx}`,
    ];
    
    // Add additional specific patterns for common directories, excluding problematic ones
    const additionalPatterns = [
      `${projectPath}/*.{ts,tsx,js,jsx}`, // Root level files
      `${projectPath}/app/**/*.{ts,tsx,js,jsx}`,
      `${projectPath}/components/**/*.{ts,tsx,js,jsx}`,
      `${projectPath}/pages/**/*.{ts,tsx,js,jsx}`,
      `${projectPath}/utils/**/*.{ts,tsx,js,jsx}`,
      `${projectPath}/hooks/**/*.{ts,tsx,js,jsx}`,
      `${projectPath}/services/**/*.{ts,tsx,js,jsx}`,
    ];
    
    // Add files with explicit exclusion of problematic directories
    for (const pattern of [...filePatterns, ...additionalPatterns]) {
      try {
        project.addSourceFilesAtPaths(pattern);
      } catch {
        // Pattern might not match any files, continue
      }
    }
    
    const sourceFiles = project.getSourceFiles().filter(file => shouldProcessFile(file.getFilePath()));
    globalProfiler.end('enum_file_loading');
    console.log(`Loaded ${sourceFiles.length} source files for enum analysis`);

    const analyzer = new EnumAnalyzer(project);
    const result = analyzer.analyzeEnums(sourceFiles);
    
    // Print performance summary
    console.log(globalProfiler.getSummary());
    globalProfiler.reset();
    
    return result;
  }) as Promise<EnumAnalysisResult>;
}
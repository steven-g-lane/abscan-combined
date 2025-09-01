import { Project, SourceFile, ClassDeclaration, ImportDeclaration, Node, SyntaxKind } from 'ts-morph';
import { 
  ComprehensiveClassSummary, 
  ClassReference, 
  ClassAnalysisResult, 
  CodeLocation, 
  MethodSummary, 
  PropertySummary 
} from '../models';
import { extractClasses } from '../extractors/classExtractor';
import { globalProfiler } from '../utils/profiler';

export class ClassAnalyzer {
  private project: Project;
  private classRegistry: Map<string, ComprehensiveClassSummary> = new Map();
  private importedClassRegistry: Map<string, string> = new Map(); // className -> sourceModule
  private classNameIndex: Map<string, string[]> = new Map(); // className -> classIds[]

  constructor(project: Project) {
    this.project = project;
  }

  public analyzeClasses(filteredFiles?: SourceFile[]): ClassAnalysisResult {
    return globalProfiler.measure('analyzeClasses_total', () => {
      this.classRegistry.clear();
      this.importedClassRegistry.clear();
      this.classNameIndex.clear();

      const sourceFiles = filteredFiles || this.project.getSourceFiles();
      
      globalProfiler.start('cataloging_phase', { 
        fileCount: sourceFiles.length
      });
      
      // First pass: catalog all local classes and imported classes
      for (const sourceFile of sourceFiles) {
        this.catalogLocalClasses(sourceFile);
        this.catalogImportedClasses(sourceFile);
      }
      
      globalProfiler.end('cataloging_phase');
      globalProfiler.start('reference_finding_phase', { fileCount: sourceFiles.length });

      // Second pass: find all class references
      for (const sourceFile of sourceFiles) {
        this.findClassReferences(sourceFile);
      }
      
      globalProfiler.end('reference_finding_phase');

      return {
        projectRoot: this.project.getRootDirectories()[0]?.getPath() || '',
        scannedAt: new Date().toISOString(),
        classes: Array.from(this.classRegistry.values())
      };
    }) as ClassAnalysisResult;
  }

  private catalogLocalClasses(sourceFile: SourceFile): void {
    // Use existing class extractor for local classes
    const localClasses = extractClasses(sourceFile);
    
    localClasses.forEach(classData => {
      const id = this.generateClassId(classData.name, sourceFile.getFilePath());
      
      const comprehensiveClass: ComprehensiveClassSummary = {
        name: classData.name,
        id,
        isLocal: true,
        location: classData.location,
        properties: classData.properties,
        methods: classData.methods,
        constructors: classData.constructors,
        extends: classData.extends,
        implements: classData.implements,
        genericParameters: classData.genericParameters,
        jsdocDescription: classData.jsdocDescription,
        isAbstract: classData.isAbstract,
        references: []
      };

      this.classRegistry.set(id, comprehensiveClass);
      
      // OPTIMIZATION: Build class name index for O(1) lookups
      const existingIds = this.classNameIndex.get(classData.name) || [];
      existingIds.push(id);
      this.classNameIndex.set(classData.name, existingIds);
    });
  }

  private catalogImportedClasses(sourceFile: SourceFile): void {
    const importDeclarations = sourceFile.getImportDeclarations();
    
    importDeclarations.forEach(importDecl => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      // Focus on node_modules imports (external packages)
      if (this.isNodeModuleImport(moduleSpecifier)) {
        const namedImports = importDecl.getNamedImports();
        const defaultImport = importDecl.getDefaultImport();
        
        // Handle named imports
        namedImports.forEach(namedImport => {
          const importName = namedImport.getName();
          if (this.couldBeClass(importName)) {
            const id = this.generateClassId(importName, moduleSpecifier);
            
            if (!this.classRegistry.has(id)) {
              const importedClass: ComprehensiveClassSummary = {
                name: importName,
                id,
                isLocal: false,
                sourceModule: moduleSpecifier,
                references: []
              };
              
              this.classRegistry.set(id, importedClass);
              
              // OPTIMIZATION: Build class name index for imported classes
              const existingIds = this.classNameIndex.get(importName) || [];
              existingIds.push(id);
              this.classNameIndex.set(importName, existingIds);
            }
            
            this.importedClassRegistry.set(importName, moduleSpecifier);
          }
        });
        
        // Handle default imports
        if (defaultImport && this.couldBeClass(defaultImport.getText())) {
          const importName = defaultImport.getText();
          const id = this.generateClassId(importName, moduleSpecifier);
          
          if (!this.classRegistry.has(id)) {
            const importedClass: ComprehensiveClassSummary = {
              name: importName,
              id,
              isLocal: false,
              sourceModule: moduleSpecifier,
              references: []
            };
            
            this.classRegistry.set(id, importedClass);
            
            // OPTIMIZATION: Build class name index for default imports
            const existingIds = this.classNameIndex.get(importName) || [];
            existingIds.push(id);
            this.classNameIndex.set(importName, existingIds);
          }
          
          this.importedClassRegistry.set(importName, moduleSpecifier);
        }
      }
    });
  }

  private findClassReferences(sourceFile: SourceFile): void {
    const fileName = sourceFile.getBaseName();
    globalProfiler.start(`findClassReferences_${fileName}`, { 
      fileName,
      fileSize: sourceFile.getFullText().length 
    });
    
    // OPTIMIZATION: Use targeted identifier search instead of full AST traversal
    const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
    
    for (const node of identifiers) {
      const text = node.getText();
      
      // OPTIMIZATION: Early filtering - skip obvious non-class identifiers
      if (!this.couldBeClassName(text)) {
        continue;
      }
      
      // Check if this identifier matches a known class
      const classEntry = this.findClassByName(text);
      if (classEntry) {
        const location = this.getLocation(node, sourceFile.getFilePath());
        const context = this.getUsageContext(node);
        
        // Don't count the class declaration itself as a reference
        if (!this.isClassDeclaration(node, text)) {
          const reference: ClassReference = {
            location,
            context
          };
          
          classEntry.references.push(reference);
        }
      }
    }
    
    globalProfiler.end(`findClassReferences_${fileName}`);
  }

  private findClassByName(className: string): ComprehensiveClassSummary | undefined {
    // OPTIMIZATION: Use class name index for O(1) lookup
    const classIds = this.classNameIndex.get(className);
    if (!classIds || classIds.length === 0) {
      return undefined;
    }
    
    // Prioritize local classes over imported ones
    for (const id of classIds) {
      const classData = this.classRegistry.get(id);
      if (classData && classData.isLocal) {
        return classData;
      }
    }
    
    // Return first imported class if no local class found
    for (const id of classIds) {
      const classData = this.classRegistry.get(id);
      if (classData && !classData.isLocal) {
        return classData;
      }
    }
    
    return undefined;
  }

  private isClassDeclaration(node: Node, className: string): boolean {
    // Check if this identifier is part of a class declaration
    const parent = node.getParent();
    if (Node.isClassDeclaration(parent)) {
      const nameNode = parent.getNameNode();
      return nameNode === node;
    }
    return false;
  }

  private getUsageContext(node: Node): string {
    const parent = node.getParent();
    if (!parent) return 'unknown';
    
    if (Node.isNewExpression(parent)) {
      return 'instantiation';
    } else if (Node.isCallExpression(parent)) {
      return 'method_call';
    } else if (Node.isTypeReference(parent)) {
      return 'type_annotation';
    } else if (parent.getKind() === SyntaxKind.ExtendsKeyword || parent.getKind() === SyntaxKind.HeritageClause) {
      return 'inheritance';
    } else if (parent.getKind() === SyntaxKind.ImplementsKeyword || parent.getKind() === SyntaxKind.HeritageClause) {
      return 'implementation';
    } else if (Node.isVariableDeclaration(parent)) {
      return 'variable_declaration';
    } else if (Node.isParameterDeclaration(parent)) {
      return 'parameter';
    } else if (Node.isPropertyDeclaration(parent)) {
      return 'property';
    }
    
    return 'reference';
  }

  private isNodeModuleImport(moduleSpecifier: string): boolean {
    // Check if it's a relative import (starts with ./ or ../)
    if (moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../')) {
      return false;
    }
    
    // Check if it's an absolute path
    if (moduleSpecifier.startsWith('/')) {
      return false;
    }
    
    // Likely a node_modules import
    return true;
  }

  private couldBeClass(name: string): boolean {
    // Simple heuristic: classes typically start with uppercase letter
    return /^[A-Z]/.test(name);
  }

  private couldBeClassName(name: string): boolean {
    // Enhanced heuristic for better filtering
    // Classes typically follow PascalCase convention
    if (!/^[A-Z]/.test(name)) return false;
    
    // Skip common non-class keywords and built-ins
    const nonClassKeywords = new Set([
      'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date',
      'Function', 'RegExp', 'Error', 'JSON', 'Math', 'console', 'window',
      'document', 'undefined', 'null', 'true', 'false', 'NaN', 'Infinity'
    ]);
    
    if (nonClassKeywords.has(name)) return false;
    
    // Skip single letter identifiers (likely generics)
    if (name.length === 1) return false;
    
    return true;
  }


  private generateClassId(className: string, source: string): string {
    return `${className}:${source}`;
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

export async function analyzeClassesInProject(projectPath: string): Promise<ClassAnalysisResult> {
  return globalProfiler.measure('analyzeClassesInProject_total', async () => {
    globalProfiler.start('project_initialization');
    const project = new Project({
      skipAddingFilesFromTsConfig: true,
    });
    globalProfiler.end('project_initialization');

    globalProfiler.start('file_loading');
    // OPTIMIZATION: Add source files with smart filtering
    const filePatterns = [
      `${projectPath}/src/**/*.{ts,tsx,js,jsx}`,
      `${projectPath}/lib/**/*.{ts,tsx,js,jsx}`,
      `${projectPath}/**/*.{ts,tsx,js,jsx}`
    ];
    
    // Add files and filter out unwanted ones
    for (const pattern of filePatterns) {
      try {
        project.addSourceFilesAtPaths(pattern);
      } catch {
        // Pattern might not match any files, continue
      }
    }
    
    const sourceFiles = project.getSourceFiles().filter(file => shouldProcessFile(file.getFilePath()));
    globalProfiler.end('file_loading');
    console.log(`Loaded ${sourceFiles.length} source files`);

    const analyzer = new ClassAnalyzer(project);
    const result = analyzer.analyzeClasses(sourceFiles);
    
    // Print performance summary
    console.log(globalProfiler.getSummary());
    globalProfiler.reset();
    
    return result;
  }) as Promise<ClassAnalysisResult>;
}
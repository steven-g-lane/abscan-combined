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

export class ClassAnalyzer {
  private project: Project;
  private classRegistry: Map<string, ComprehensiveClassSummary> = new Map();
  private importedClassRegistry: Map<string, string> = new Map(); // className -> sourceModule

  constructor(project: Project) {
    this.project = project;
  }

  public analyzeClasses(): ClassAnalysisResult {
    this.classRegistry.clear();
    this.importedClassRegistry.clear();

    const sourceFiles = this.project.getSourceFiles();
    
    // First pass: catalog all local classes and imported classes
    for (const sourceFile of sourceFiles) {
      this.catalogLocalClasses(sourceFile);
      this.catalogImportedClasses(sourceFile);
    }

    // Second pass: find all class references
    for (const sourceFile of sourceFiles) {
      this.findClassReferences(sourceFile);
    }

    return {
      projectRoot: this.project.getRootDirectories()[0]?.getPath() || '',
      scannedAt: new Date().toISOString(),
      classes: Array.from(this.classRegistry.values())
    };
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
          }
          
          this.importedClassRegistry.set(importName, moduleSpecifier);
        }
      }
    });
  }

  private findClassReferences(sourceFile: SourceFile): void {
    sourceFile.forEachDescendant((node) => {
      // Look for identifier nodes that could be class references
      if (Node.isIdentifier(node)) {
        const text = node.getText();
        
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
    });
  }

  private findClassByName(className: string): ComprehensiveClassSummary | undefined {
    // First check local classes
    for (const [id, classData] of this.classRegistry.entries()) {
      if (classData.name === className && classData.isLocal) {
        return classData;
      }
    }
    
    // Then check imported classes
    if (this.importedClassRegistry.has(className)) {
      const moduleSpecifier = this.importedClassRegistry.get(className)!;
      const id = this.generateClassId(className, moduleSpecifier);
      return this.classRegistry.get(id);
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

  private generateClassId(className: string, source: string): string {
    return `${className}:${source}`;
  }

  private getLocation(node: Node, filePath: string): CodeLocation {
    const start = node.getStart();
    const sourceFile = node.getSourceFile();
    const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
    
    return {
      file: filePath,
      line: lineAndColumn.line,
      column: lineAndColumn.column
    };
  }
}

export async function analyzeClassesInProject(projectPath: string): Promise<ClassAnalysisResult> {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });

  // Add source files directly
  project.addSourceFilesAtPaths(`${projectPath}/**/*.{ts,tsx,js,jsx}`);

  const analyzer = new ClassAnalyzer(project);
  return analyzer.analyzeClasses();
}
import { Project, SourceFile, InterfaceDeclaration, ImportDeclaration, Node, SyntaxKind } from 'ts-morph';
import { 
  ComprehensiveInterfaceSummary, 
  InterfaceReference, 
  InterfaceAnalysisResult, 
  CodeLocation, 
  MethodSummary, 
  PropertySummary 
} from '../models';
import { extractInterfaces } from '../extractors/interfaceExtractor';
import { globalProfiler } from '../utils/profiler';

export class InterfaceAnalyzer {
  private project: Project;
  private interfaceRegistry: Map<string, ComprehensiveInterfaceSummary> = new Map();
  private importedInterfaceRegistry: Map<string, string> = new Map(); // interfaceName -> sourceModule
  private interfaceNameIndex: Map<string, string[]> = new Map(); // interfaceName -> interfaceIds[]

  constructor(project: Project) {
    this.project = project;
  }

  public analyzeInterfaces(filteredFiles?: SourceFile[]): InterfaceAnalysisResult {
    return globalProfiler.measure('analyzeInterfaces_total', () => {
      this.interfaceRegistry.clear();
      this.importedInterfaceRegistry.clear();
      this.interfaceNameIndex.clear();

      const sourceFiles = filteredFiles || this.project.getSourceFiles();
      
      globalProfiler.start('interface_cataloging_phase', { 
        fileCount: sourceFiles.length
      });
      
      // First pass: catalog all local interfaces and imported interfaces
      for (const sourceFile of sourceFiles) {
        this.catalogLocalInterfaces(sourceFile);
        this.catalogImportedInterfaces(sourceFile);
      }
      
      globalProfiler.end('interface_cataloging_phase');
      globalProfiler.start('interface_reference_finding_phase', { fileCount: sourceFiles.length });

      // Second pass: find all interface references
      for (const sourceFile of sourceFiles) {
        this.findInterfaceReferences(sourceFile);
      }
      
      globalProfiler.end('interface_reference_finding_phase');
      
      // Calculate reference counts for all interfaces
      this.calculateReferenceCounts();

      return {
        projectRoot: this.project.getRootDirectories()[0]?.getPath() || '',
        scannedAt: new Date().toISOString(),
        interfaces: Array.from(this.interfaceRegistry.values())
      };
    }) as InterfaceAnalysisResult;
  }

  private catalogLocalInterfaces(sourceFile: SourceFile): void {
    // Use existing interface extractor for local interfaces
    const localInterfaces = extractInterfaces(sourceFile);
    
    localInterfaces.forEach(interfaceData => {
      const id = this.generateInterfaceId(interfaceData.name, sourceFile.getFilePath());
      
      // Calculate source LOC for the interface
      const sourceLOC = this.calculateInterfaceLOC(interfaceData);
      const sourceFilename = sourceFile.getBaseName();
      
      const comprehensiveInterface: ComprehensiveInterfaceSummary = {
        name: interfaceData.name,
        id,
        isLocal: true,
        location: interfaceData.location,
        properties: interfaceData.properties,
        methods: interfaceData.methods,
        extends: interfaceData.extends,
        genericParameters: interfaceData.genericParameters,
        jsdocDescription: interfaceData.jsdocDescription,
        references: [],
        sourceLOC,
        sourceFilename
      };

      this.interfaceRegistry.set(id, comprehensiveInterface);
      
      // Build interface name index for O(1) lookups
      const existingIds = this.interfaceNameIndex.get(interfaceData.name) || [];
      existingIds.push(id);
      this.interfaceNameIndex.set(interfaceData.name, existingIds);
    });
  }

  private catalogImportedInterfaces(sourceFile: SourceFile): void {
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
          if (this.couldBeInterface(importName)) {
            const id = this.generateInterfaceId(importName, moduleSpecifier);
            
            if (!this.interfaceRegistry.has(id)) {
              const importedInterface: ComprehensiveInterfaceSummary = {
                name: importName,
                id,
                isLocal: false,
                sourceModule: moduleSpecifier,
                references: []
              };
              
              this.interfaceRegistry.set(id, importedInterface);
              
              // Build interface name index for imported interfaces
              const existingIds = this.interfaceNameIndex.get(importName) || [];
              existingIds.push(id);
              this.interfaceNameIndex.set(importName, existingIds);
            }
            
            this.importedInterfaceRegistry.set(importName, moduleSpecifier);
          }
        });
        
        // Handle default imports
        if (defaultImport && this.couldBeInterface(defaultImport.getText())) {
          const importName = defaultImport.getText();
          const id = this.generateInterfaceId(importName, moduleSpecifier);
          
          if (!this.interfaceRegistry.has(id)) {
            const importedInterface: ComprehensiveInterfaceSummary = {
              name: importName,
              id,
              isLocal: false,
              sourceModule: moduleSpecifier,
              references: []
            };
            
            this.interfaceRegistry.set(id, importedInterface);
            
            // Build interface name index for default imports
            const existingIds = this.interfaceNameIndex.get(importName) || [];
            existingIds.push(id);
            this.interfaceNameIndex.set(importName, existingIds);
          }
          
          this.importedInterfaceRegistry.set(importName, moduleSpecifier);
        }
      }
    });
  }

  private findInterfaceReferences(sourceFile: SourceFile): void {
    const fileName = sourceFile.getBaseName();
    globalProfiler.start(`findInterfaceReferences_${fileName}`, { 
      fileName,
      fileSize: sourceFile.getFullText().length 
    });
    
    // Use targeted identifier search instead of full AST traversal
    const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
    
    for (const node of identifiers) {
      const text = node.getText();
      
      // Early filtering - skip obvious non-interface identifiers
      if (!this.couldBeInterfaceName(text)) {
        continue;
      }
      
      // Check if this identifier matches a known interface
      const interfaceEntry = this.findInterfaceByName(text);
      if (interfaceEntry) {
        const location = this.getLocation(node, sourceFile.getFilePath());
        const context = this.getUsageContext(node);
        
        // Don't count the interface declaration itself as a reference
        if (!this.isInterfaceDeclaration(node, text)) {
          const contextLine = this.getContextLine(node);
          const reference: InterfaceReference = {
            location,
            contextLine,
            context
          };
          
          interfaceEntry.references.push(reference);
        }
      }
    }
    
    // Find property references for local interfaces
    this.findPropertyReferences(sourceFile);
    
    globalProfiler.end(`findInterfaceReferences_${fileName}`);
  }

  private findPropertyReferences(sourceFile: SourceFile): void {
    // Find property access expressions to track interface property usage
    const propertyAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
    
    for (const propertyAccess of propertyAccesses) {
      const propertyName = propertyAccess.getName();
      
      // Find the interface that contains this property
      for (const interfaceEntry of this.interfaceRegistry.values()) {
        if (interfaceEntry.isLocal && interfaceEntry.properties) {
          const property = interfaceEntry.properties.find(p => p.name === propertyName);
          if (property) {
            const location = this.getLocation(propertyAccess.getNameNode(), sourceFile.getFilePath());
            const contextLine = this.getContextLine(propertyAccess);
            
            // Initialize references array if not exists
            if (!property.references) {
              property.references = [];
            }
            
            property.references.push({
              location,
              contextLine,
              context: 'property_access'
            });
          }
        }
      }
    }

    // Find call expressions to track interface method usage  
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    
    for (const callExpression of callExpressions) {
      const expression = callExpression.getExpression();
      
      // Check if this is a method call (property access with call)
      if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
        const propAccess = expression.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
        const methodName = propAccess.getName();
        
        // Find the interface that contains this method
        for (const interfaceEntry of this.interfaceRegistry.values()) {
          if (interfaceEntry.isLocal && interfaceEntry.methods) {
            const method = interfaceEntry.methods.find(m => m.name === methodName);
            if (method) {
              const location = this.getLocation(propAccess.getNameNode(), sourceFile.getFilePath());
              const contextLine = this.getContextLine(callExpression);
              
              // Initialize references array if not exists
              if (!method.references) {
                method.references = [];
              }
              
              method.references.push({
                location,
                contextLine,
                context: 'method_call'
              });
            }
          }
        }
      }
    }
  }

  private findInterfaceByName(interfaceName: string): ComprehensiveInterfaceSummary | undefined {
    // Use interface name index for O(1) lookup
    const interfaceIds = this.interfaceNameIndex.get(interfaceName);
    if (!interfaceIds || interfaceIds.length === 0) {
      return undefined;
    }
    
    // Prioritize local interfaces over imported ones
    for (const id of interfaceIds) {
      const interfaceData = this.interfaceRegistry.get(id);
      if (interfaceData && interfaceData.isLocal) {
        return interfaceData;
      }
    }
    
    // Return first imported interface if no local interface found
    for (const id of interfaceIds) {
      const interfaceData = this.interfaceRegistry.get(id);
      if (interfaceData && !interfaceData.isLocal) {
        return interfaceData;
      }
    }
    
    return undefined;
  }

  private isInterfaceDeclaration(node: Node, interfaceName: string): boolean {
    // Check if this identifier is part of an interface declaration
    const parent = node.getParent();
    if (Node.isInterfaceDeclaration(parent)) {
      const nameNode = parent.getNameNode();
      return nameNode === node;
    }
    return false;
  }

  private getUsageContext(node: Node): string {
    const parent = node.getParent();
    if (!parent) return 'unknown';
    
    if (Node.isTypeReference(parent)) {
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
    } else if (Node.isPropertySignature(parent)) {
      return 'property_signature';
    } else if (Node.isMethodSignature(parent)) {
      return 'method_signature';
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

  private couldBeInterface(name: string): boolean {
    // Simple heuristic: interfaces typically start with uppercase letter or 'I' prefix
    return /^[A-Z]/.test(name);
  }

  private couldBeInterfaceName(name: string): boolean {
    // Enhanced heuristic for better filtering
    // Interfaces typically follow PascalCase convention or 'I' prefix
    if (!/^[A-Z]/.test(name)) return false;
    
    // Skip common non-interface keywords and built-ins
    const nonInterfaceKeywords = new Set([
      'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date',
      'Function', 'RegExp', 'Error', 'JSON', 'Math', 'console', 'window',
      'document', 'undefined', 'null', 'true', 'false', 'NaN', 'Infinity'
    ]);
    
    if (nonInterfaceKeywords.has(name)) return false;
    
    // Skip single letter identifiers (likely generics)
    if (name.length === 1) return false;
    
    return true;
  }

  private calculateReferenceCounts(): void {
    // Calculate reference count for each interface based on references array length
    for (const interfaceData of this.interfaceRegistry.values()) {
      interfaceData.referenceCount = interfaceData.references.length;
      
      // Calculate reference counts for properties
      if (interfaceData.properties) {
        interfaceData.properties.forEach(property => {
          property.referenceCount = property.references?.length || 0;
        });
      }
      
      // Calculate reference counts for methods
      if (interfaceData.methods) {
        interfaceData.methods.forEach(method => {
          method.referenceCount = method.references?.length || 0;
        });
      }
    }
  }

  private calculateInterfaceLOC(interfaceData: any): number {
    // Simple estimation based on properties and methods count
    // In a real scenario, you'd count actual lines from start to end of interface
    const propertyCount = interfaceData.properties?.length || 0;
    const methodCount = interfaceData.methods?.length || 0;
    
    // Estimate: 2 lines per property/method plus interface declaration lines
    return 3 + (propertyCount + methodCount) * 2;
  }

  private generateInterfaceId(interfaceName: string, source: string): string {
    return `${interfaceName}:${source}`;
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

export async function analyzeInterfacesInProject(projectPath: string): Promise<InterfaceAnalysisResult> {
  return globalProfiler.measure('analyzeInterfacesInProject_total', async () => {
    globalProfiler.start('interface_project_initialization');
    const project = new Project({
      skipAddingFilesFromTsConfig: true,
    });
    globalProfiler.end('interface_project_initialization');

    globalProfiler.start('interface_file_loading');
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
    globalProfiler.end('interface_file_loading');
    console.log(`Loaded ${sourceFiles.length} source files for interface analysis`);

    const analyzer = new InterfaceAnalyzer(project);
    const result = analyzer.analyzeInterfaces(sourceFiles);
    
    // Print performance summary
    console.log(globalProfiler.getSummary());
    globalProfiler.reset();
    
    return result;
  }) as Promise<InterfaceAnalysisResult>;
}
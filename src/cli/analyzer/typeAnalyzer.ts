import { Project, SourceFile, TypeAliasDeclaration, ImportDeclaration, Node, SyntaxKind } from 'ts-morph';
import { 
  ComprehensiveTypeSummary, 
  TypeReference, 
  TypeAnalysisResult, 
  CodeLocation 
} from '../models';
import { globalProfiler } from '../utils/profiler';
import { cliLogger } from '../../shared/logging/logger';

export class TypeAnalyzer {
  private project: Project;
  private typeRegistry: Map<string, ComprehensiveTypeSummary> = new Map();
  private typeNameIndex: Map<string, string[]> = new Map(); // typeName -> typeIds[]

  constructor(project: Project) {
    this.project = project;
  }

  public analyzeTypes(filteredFiles?: SourceFile[]): TypeAnalysisResult {
    return globalProfiler.measure('analyzeTypes_total', () => {
      this.typeRegistry.clear();
      this.typeNameIndex.clear();

      const sourceFiles = filteredFiles || this.project.getSourceFiles();
      
      globalProfiler.start('type_cataloging_phase', { 
        fileCount: sourceFiles.length
      });
      
      // First pass: catalog all local type aliases
      for (const sourceFile of sourceFiles) {
        this.catalogLocalTypes(sourceFile);
      }
      
      globalProfiler.end('type_cataloging_phase');
      globalProfiler.start('type_reference_finding_phase', { fileCount: sourceFiles.length });

      // Second pass: find all type references
      for (const sourceFile of sourceFiles) {
        this.findTypeReferences(sourceFile);
      }
      
      globalProfiler.end('type_reference_finding_phase');
      
      // Calculate reference counts for all types
      this.calculateReferenceCounts();

      return {
        projectRoot: this.project.getRootDirectories()[0]?.getPath() || '',
        scannedAt: new Date().toISOString(),
        types: Array.from(this.typeRegistry.values())
      };
    }) as TypeAnalysisResult;
  }

  private catalogLocalTypes(sourceFile: SourceFile): void {
    // Get all type alias declarations using ts-morph native capabilities
    const typeAliasDeclarations = sourceFile.getTypeAliases();
    
    typeAliasDeclarations.forEach(typeAliasDeclaration => {
      const typeName = typeAliasDeclaration.getName();
      const id = this.generateTypeId(typeName, sourceFile.getFilePath());
      
      // Extract type definition
      const typeDefinition = this.extractTypeDefinition(typeAliasDeclaration);
      
      // Calculate source LOC for the type
      const sourceLOC = this.calculateTypeLOC(typeAliasDeclaration);
      const sourceFilename = sourceFile.getBaseName();
      
      // Get JSDoc description
      const jsdocDescription = this.extractJSDocDescription(typeAliasDeclaration);
      
      const comprehensiveType: ComprehensiveTypeSummary = {
        name: typeName,
        id,
        isLocal: true,
        location: this.getLocation(typeAliasDeclaration, sourceFile.getFilePath()),
        typeDefinition,
        jsdocDescription,
        references: [],
        sourceLOC,
        sourceFilename
      };

      this.typeRegistry.set(id, comprehensiveType);
      
      // Build type name index for O(1) lookups
      const existingIds = this.typeNameIndex.get(typeName) || [];
      existingIds.push(id);
      this.typeNameIndex.set(typeName, existingIds);
    });
  }

  private findTypeReferences(sourceFile: SourceFile): void {
    const fileName = sourceFile.getBaseName();
    globalProfiler.start(`findTypeReferences_${fileName}`, { 
      fileName,
      fileSize: sourceFile.getFullText().length 
    });
    
    // Use targeted identifier search instead of full AST traversal
    const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
    
    for (const node of identifiers) {
      const text = node.getText();
      
      // Early filtering - skip obvious non-type identifiers
      if (!this.couldBeTypeName(text)) {
        continue;
      }
      
      // Check if this identifier matches a known type
      const typeEntry = this.findTypeByName(text);
      if (typeEntry) {
        const location = this.getLocation(node, sourceFile.getFilePath());
        const context = this.getUsageContext(node);
        
        // Don't count the type declaration itself as a reference
        if (!this.isTypeDeclaration(node, text)) {
          const contextLine = this.getContextLine(node);
          const reference: TypeReference = {
            location,
            contextLine,
            context
          };
          
          typeEntry.references.push(reference);
        }
      }
    }
    
    globalProfiler.end(`findTypeReferences_${fileName}`);
  }

  private extractTypeDefinition(typeAliasDeclaration: TypeAliasDeclaration): string {
    const typeNode = typeAliasDeclaration.getTypeNode();
    return typeNode ? typeNode.getText() : 'unknown';
  }

  private extractJSDocDescription(typeAliasDeclaration: TypeAliasDeclaration): string | undefined {
    const jsDocs = typeAliasDeclaration.getJsDocs();
    if (jsDocs.length > 0) {
      return jsDocs[0].getDescription().trim() || undefined;
    }
    return undefined;
  }

  private findTypeByName(typeName: string): ComprehensiveTypeSummary | undefined {
    // Use type name index for O(1) lookup
    const typeIds = this.typeNameIndex.get(typeName);
    if (!typeIds || typeIds.length === 0) {
      return undefined;
    }
    
    // Return first local type found (we only track local types)
    for (const id of typeIds) {
      const typeData = this.typeRegistry.get(id);
      if (typeData && typeData.isLocal) {
        return typeData;
      }
    }
    
    return undefined;
  }

  private isTypeDeclaration(node: Node, typeName: string): boolean {
    // Check if this identifier is part of a type declaration
    const parent = node.getParent();
    if (Node.isTypeAliasDeclaration(parent)) {
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
    } else if (Node.isUnionTypeNode(parent) || Node.isIntersectionTypeNode(parent)) {
      return 'union_intersection_type';
    } else if (Node.isMappedTypeNode(parent)) {
      return 'mapped_type';
    } else if (Node.isIndexedAccessTypeNode(parent)) {
      return 'indexed_access_type';
    }
    
    return 'reference';
  }

  private couldBeTypeName(name: string): boolean {
    // Enhanced heuristic for better filtering
    // Type aliases typically follow PascalCase convention
    if (!/^[A-Z]/.test(name)) return false;
    
    // Skip common non-type keywords and built-ins
    const nonTypeKeywords = new Set([
      'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date',
      'Function', 'RegExp', 'Error', 'JSON', 'Math', 'console', 'window',
      'document', 'undefined', 'null', 'true', 'false', 'NaN', 'Infinity',
      'React', 'Component', 'Props', 'State', 'JSX', 'Element', 'Node'
    ]);
    
    if (nonTypeKeywords.has(name)) return false;
    
    // Skip single letter identifiers (likely generics)
    if (name.length === 1) return false;
    
    return true;
  }

  private calculateReferenceCounts(): void {
    // Calculate reference count for each type based on references array length
    for (const typeData of this.typeRegistry.values()) {
      typeData.referenceCount = typeData.references.length;
    }
  }

  private calculateTypeLOC(typeAliasDeclaration: TypeAliasDeclaration): number {
    // Calculate actual lines from start to end of type declaration
    const start = typeAliasDeclaration.getStart();
    const end = typeAliasDeclaration.getEnd();
    const sourceFile = typeAliasDeclaration.getSourceFile();
    const startLineAndColumn = sourceFile.getLineAndColumnAtPos(start);
    const endLineAndColumn = sourceFile.getLineAndColumnAtPos(end);
    
    return endLineAndColumn.line - startLineAndColumn.line + 1;
  }

  private generateTypeId(typeName: string, source: string): string {
    return `${typeName}:${source}`;
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

export async function analyzeTypesInProject(projectPath: string): Promise<TypeAnalysisResult> {
  return globalProfiler.measure('analyzeTypesInProject_total', async () => {
    globalProfiler.start('type_project_initialization');
    const project = new Project({
      skipAddingFilesFromTsConfig: true,
    });
    globalProfiler.end('type_project_initialization');

    globalProfiler.start('type_file_loading');
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
    globalProfiler.end('type_file_loading');
    const logger = cliLogger('typeAnalyzer');
    logger.info('Loaded source files for type analysis', { fileCount: sourceFiles.length });

    const analyzer = new TypeAnalyzer(project);
    const result = analyzer.analyzeTypes(sourceFiles);
    
    // Print performance summary
    logger.debug('Type analysis profiling', { summary: globalProfiler.getSummary() });
    globalProfiler.reset();
    
    return result;
  }) as Promise<TypeAnalysisResult>;
}
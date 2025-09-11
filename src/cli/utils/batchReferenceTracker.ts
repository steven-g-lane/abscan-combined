import { 
  SourceFile, 
  Node, 
  SyntaxKind, 
  CallExpression,
  NewExpression,
  PropertyAccessExpression,
  Identifier,
  Project,
  MethodDeclaration,
  PropertyDeclaration,
  ClassDeclaration,
  ReferencedSymbol
} from 'ts-morph';
import { MethodReference, CodeLocation, ComprehensiveClassSummary } from '../models';
import path from 'path';

// Define PropertyReference interface (same structure as MethodReference)
export interface PropertyReference {
  location: CodeLocation;
  contextLine: string;
  context?: string;
}

interface SymbolKey {
  className: string;
  symbolName: string;
}

/**
 * Enhanced batch reference tracker that uses ts-morph's native
 * findReferences() for accurate method and property reference counting
 */
export class BatchReferenceTracker {
  private project: Project;
  private methodCallMap: Map<string, MethodReference[]> = new Map(); // methodName -> references
  private propertyAccessMap: Map<string, PropertyReference[]> = new Map(); // propertyName -> references
  private constructorCallMap: Map<string, MethodReference[]> = new Map(); // className -> references
  private symbolDefinitionMap: Map<string, MethodDeclaration | PropertyDeclaration> = new Map(); // classname:symbolName -> declaration node

  constructor(project: Project) {
    this.project = project;
  }

  /**
   * Build reference map using ts-morph's native findReferences() for accuracy
   */
  buildReferenceMap(): void {
    const sourceFiles = this.project.getSourceFiles();
    console.log(`🔍 Starting enhanced reference map build for ${sourceFiles.length} files`);
    
    // First pass: catalog all class symbol definitions (methods and properties)
    this.catalogClassSymbols(sourceFiles);
    
    // Second pass: use ts-morph findReferences() for each symbol
    this.buildSymbolReferences();
    
    console.log(`🎯 Enhanced reference map build complete. Found ${this.methodCallMap.size} method patterns, ${this.propertyAccessMap.size} property patterns, ${this.constructorCallMap.size} constructor patterns`);
  }

  /**
   * Catalog all class symbol definitions (methods and properties) for reference tracking
   */
  private catalogClassSymbols(sourceFiles: SourceFile[]): void {
    console.log(`📚 Cataloging class symbols (methods and properties)...`);
    
    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();
      
      for (const classDeclaration of classes) {
        const className = classDeclaration.getName();
        if (!className) continue;
        
        // Catalog regular methods
        const methods = classDeclaration.getMethods();
        for (const method of methods) {
          const methodName = method.getName();
          const key = `${className}:${methodName}`;
          this.symbolDefinitionMap.set(key, method);
        }
        
        // Catalog constructors
        const constructors = classDeclaration.getConstructors();
        for (const constructor of constructors) {
          const key = `${className}:constructor`;
          // Store constructor as a method for unified handling
          this.symbolDefinitionMap.set(key, constructor as any);
        }
        
        // Catalog properties
        const properties = classDeclaration.getProperties();
        for (const property of properties) {
          const propertyName = property.getName();
          if (propertyName) {
            const key = `${className}:${propertyName}`;
            this.symbolDefinitionMap.set(key, property);
          }
        }
      }
    }
    
    console.log(`📚 Cataloged ${this.symbolDefinitionMap.size} class symbols (methods and properties)`);
  }

  /**
   * Build symbol references (methods and properties) using ts-morph's native findReferences()
   */
  private buildSymbolReferences(): void {
    console.log(`🔗 Building symbol references using ts-morph findReferences()...`);
    let processedCount = 0;
    const totalSymbols = this.symbolDefinitionMap.size;
    
    for (const [symbolKey, symbolDeclaration] of this.symbolDefinitionMap.entries()) {
      processedCount++;
      const [className, symbolName] = symbolKey.split(':');
      
      if (processedCount % 10 === 0) {
        console.log(`🔗 Processing ${processedCount}/${totalSymbols}: ${symbolKey}`);
      }
      
      try {
        // Use ts-morph's native findReferences() for accurate detection
        const referencedSymbols = symbolDeclaration.findReferences();
        
        for (const referencedSymbol of referencedSymbols) {
          for (const reference of referencedSymbol.getReferences()) {
            // Skip the definition itself
            if (reference.isDefinition()) {
              continue;
            }
            
            const node = reference.getNode();
            const sourceFile = node.getSourceFile();
            const filePath = sourceFile.getFilePath();
            
            // Determine if this is a method or property
            const isProperty = Node.isPropertyDeclaration(symbolDeclaration);
            const isMethod = Node.isMethodDeclaration(symbolDeclaration) || symbolName === 'constructor';
            
            if (symbolName === 'constructor') {
              // Handle constructor references
              const methodReference = this.createMethodReference(node, filePath);
              this.addConstructorReference(className, methodReference);
            } else if (isMethod) {
              // Handle method references
              const methodReference = this.createMethodReference(node, filePath);
              this.addMethodReference(symbolName, methodReference);
            } else if (isProperty) {
              // Handle property references
              const propertyReference = this.createPropertyReference(node, filePath);
              this.addPropertyReference(symbolName, propertyReference);
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error processing references for ${symbolKey}: ${error}`);
      }
    }
    
    console.log(`🔗 Symbol reference building complete. Processed ${processedCount} symbols`);
  }

  /**
   * Get references for a specific method
   */
  getMethodReferences(className: string, methodName: string): MethodReference[] {
    if (methodName === 'constructor') {
      return this.constructorCallMap.get(className) || [];
    }
    return this.methodCallMap.get(methodName) || [];
  }

  /**
   * Get references for a specific property
   */
  getPropertyReferences(className: string, propertyName: string): PropertyReference[] {
    return this.propertyAccessMap.get(propertyName) || [];
  }

  /**
   * Apply collected references to class data
   */
  applyReferencesToClasses(classes: Map<string, ComprehensiveClassSummary>): void {
    for (const classData of classes.values()) {
      if (!classData.isLocal) continue;
      
      // Apply to methods
      if (classData.methods) {
        for (const method of classData.methods) {
          const references = this.getMethodReferences(classData.name, method.name);
          method.references = references;
          method.referenceCount = references.length;
        }
      }
      
      // Apply to constructors
      if (classData.constructors) {
        for (const constructor of classData.constructors) {
          const references = this.getMethodReferences(classData.name, 'constructor');
          constructor.references = references;
          constructor.referenceCount = references.length;
        }
      }
      
      // Apply to properties
      if (classData.properties) {
        for (const property of classData.properties) {
          const references = this.getPropertyReferences(classData.name, property.name);
          // Cast property references to method references for compatibility
          (property as any).references = references;
          (property as any).referenceCount = references.length;
        }
      }
    }
  }

  /**
   * Scan a single file for all method references
   */
  private scanFileForMethodReferences(sourceFile: SourceFile): void {
    const filePath = sourceFile.getFilePath();
    const fileName = path.basename(filePath);
    let nodeCount = 0;
    let callCount = 0;
    let newCount = 0;

    console.log(`  🔍 Starting AST traversal for ${fileName}`);

    sourceFile.forEachDescendant((node: Node) => {
      nodeCount++;
      
      // Log progress every 1000 nodes
      if (nodeCount % 1000 === 0) {
        console.log(`    📊 Visited ${nodeCount} nodes in ${fileName}, calls: ${callCount}, new: ${newCount}`);
      }
      
      const isCallExpr = Node.isCallExpression(node);
      const isNewExpr = Node.isNewExpression(node);
      
      // Handle method calls like obj.methodName()
      if (isCallExpr) {
        callCount++;
        console.log(`    📞 Processing call expression #${callCount} in ${fileName} at line ${node.getStartLineNumber()}`);
        this.processCallExpression(node, filePath);
      }
      
      // Handle constructor calls like new ClassName()
      if (isNewExpr) {
        newCount++;
        console.log(`    🆕 Processing new expression #${newCount} in ${fileName} at line ${node.getStartLineNumber()}`);
        this.processNewExpression(node, filePath);
      }
    });

    console.log(`  ✅ AST traversal complete for ${fileName}: ${nodeCount} nodes, ${callCount} calls, ${newCount} new expressions`);
  }

  /**
   * Process a call expression to extract method references
   */
  private processCallExpression(callExpr: CallExpression, filePath: string): void {
    const expression = callExpr.getExpression();

    // Handle method calls like obj.methodName() or this.methodName()
    if (Node.isPropertyAccessExpression(expression)) {
      const methodName = expression.getName();
      
      // Store all method calls by method name (we'll filter later)
      this.addMethodCall(methodName, callExpr, filePath, 'method call');
    }

    // Handle direct function/method calls like methodName()
    if (Node.isIdentifier(expression)) {
      const methodName = expression.getText();
      
      // Store direct calls (these could be methods or functions)
      this.addMethodCall(methodName, callExpr, filePath, 'direct call');
    }
  }

  /**
   * Process a new expression to extract constructor references
   */
  private processNewExpression(newExpr: NewExpression, filePath: string): void {
    const expression = newExpr.getExpression();
    
    if (Node.isIdentifier(expression)) {
      const className = expression.getText();
      this.addConstructorCall(className, newExpr, filePath);
    }
  }

  /**
   * Create a method reference from a ts-morph reference node
   */
  private createMethodReference(node: Node, filePath: string): MethodReference {
    const location = this.getLocation(node, filePath);
    const contextLine = this.getContextLine(node);
    const context = this.determineReferenceContext(node);
    
    return {
      location,
      contextLine,
      context
    };
  }

  /**
   * Create a property reference from a ts-morph reference node
   */
  private createPropertyReference(node: Node, filePath: string): PropertyReference {
    const location = this.getLocation(node, filePath);
    const contextLine = this.getContextLine(node);
    const context = this.determinePropertyReferenceContext(node);
    
    return {
      location,
      contextLine,
      context
    };
  }

  /**
   * Add a method reference to the method call map
   */
  private addMethodReference(methodName: string, reference: MethodReference): void {
    const existing = this.methodCallMap.get(methodName) || [];
    existing.push(reference);
    this.methodCallMap.set(methodName, existing);
  }

  /**
   * Add a property reference to the property access map
   */
  private addPropertyReference(propertyName: string, reference: PropertyReference): void {
    const existing = this.propertyAccessMap.get(propertyName) || [];
    existing.push(reference);
    this.propertyAccessMap.set(propertyName, existing);
  }

  /**
   * Add a constructor reference to the constructor call map
   */
  private addConstructorReference(className: string, reference: MethodReference): void {
    const existing = this.constructorCallMap.get(className) || [];
    existing.push(reference);
    this.constructorCallMap.set(className, existing);
  }

  /**
   * Determine the context of a method reference for better categorization
   */
  private determineReferenceContext(node: Node): string {
    const parent = node.getParent();
    if (!parent) return 'unknown';
    
    // Check for various invocation patterns
    if (Node.isCallExpression(parent)) {
      return 'method call';
    } else if (Node.isNewExpression(parent)) {
      return 'constructor call';
    } else if (Node.isPropertyAccessExpression(parent)) {
      const grandParent = parent.getParent();
      if (Node.isCallExpression(grandParent)) {
        return 'method call';
      }
      return 'property access';
    } else if (Node.isVariableDeclaration(parent)) {
      return 'assignment';
    } else if (Node.isParameterDeclaration(parent)) {
      return 'parameter';
    } else if (Node.isArrowFunction(parent) || Node.isFunctionExpression(parent)) {
      return 'callback reference';
    } else if (Node.isObjectBindingPattern(parent) || Node.isArrayBindingPattern(parent)) {
      return 'destructuring';
    }
    
    return 'reference';
  }

  /**
   * Determine the context of a property reference for better categorization
   */
  private determinePropertyReferenceContext(node: Node): string {
    const parent = node.getParent();
    if (!parent) return 'unknown';
    
    // Check for various property access patterns
    if (Node.isPropertyAccessExpression(parent)) {
      return 'property access';
    } else if (Node.isBinaryExpression(parent)) {
      return 'assignment operation';
    } else if (Node.isVariableDeclaration(parent)) {
      return 'variable assignment';
    } else if (Node.isCallExpression(parent)) {
      return 'function parameter';
    } else if (Node.isObjectBindingPattern(parent) || Node.isArrayBindingPattern(parent)) {
      return 'destructuring';
    } else if (Node.isReturnStatement(parent)) {
      return 'return value';
    } else if (Node.isConditionalExpression(parent) || Node.isIfStatement(parent)) {
      return 'conditional';
    }
    
    return 'property reference';
  }

  /**
   * Add a method call to the method call map (legacy method for compatibility)
   */
  private addMethodCall(methodName: string, node: Node, filePath: string, context: string): void {
    const location = this.getLocation(node, filePath);
    const contextLine = this.getContextLine(node);
    
    const reference: MethodReference = {
      location,
      contextLine,
      context
    };
    
    const existing = this.methodCallMap.get(methodName) || [];
    existing.push(reference);
    this.methodCallMap.set(methodName, existing);
  }

  /**
   * Add a constructor call to the constructor call map (legacy method for compatibility)
   */
  private addConstructorCall(className: string, node: Node, filePath: string): void {
    const location = this.getLocation(node, filePath);
    const contextLine = this.getContextLine(node);
    
    const reference: MethodReference = {
      location,
      contextLine,
      context: 'constructor call'
    };
    
    const existing = this.constructorCallMap.get(className) || [];
    existing.push(reference);
    this.constructorCallMap.set(className, existing);
  }

  /**
   * Get location information for a node
   */
  private getLocation(node: Node, filePath: string): CodeLocation {
    const start = node.getStart();
    const sourceFile = node.getSourceFile();
    const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
    
    return {
      file: filePath,
      line: lineAndColumn.line + 1, // Convert to 1-based line numbers
      column: lineAndColumn.column
    };
  }

  /**
   * Get the full source code line containing the reference
   */
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
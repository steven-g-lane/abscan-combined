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
  ReferencedSymbol,
  ConstructorDeclaration
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
  private methodCallMap: Map<string, MethodReference[]> = new Map(); // className:methodName -> references
  private propertyAccessMap: Map<string, PropertyReference[]> = new Map(); // className:propertyName -> references
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
        // Use ts-morph's native findReferences() on the method name identifier for precise semantic analysis
        let nameNode: Node | undefined;
        if (Node.isMethodDeclaration(symbolDeclaration)) {
          nameNode = symbolDeclaration.getNameNode();
        } else if (Node.isPropertyDeclaration(symbolDeclaration)) {
          nameNode = symbolDeclaration.getNameNode();
        } else if (Node.isConstructorDeclaration(symbolDeclaration)) {
          // For constructors, use the constructor keyword or the class name
          nameNode = symbolDeclaration.getFirstChildByKind(SyntaxKind.ConstructorKeyword);
        }

        if (!nameNode) {
          console.warn(`⚠️ Could not find name node for ${symbolKey}`);
          continue;
        }

        const referencedSymbols = nameNode.findReferences();
        
        for (const referencedSymbol of referencedSymbols) {
          const references = referencedSymbol.getReferences();
          const validReferences = new Set(); // Track unique references by location

          for (const reference of references) {
            // Skip the definition itself
            if (reference.isDefinition()) {
              continue;
            }

            const node = reference.getNode();
            const sourceFile = node.getSourceFile();
            const filePath = sourceFile.getFilePath();

            // Additional filtering: skip if this is the declaration node itself
            if (this.isDeclarationNode(node, symbolDeclaration)) {
              continue;
            }

            // Semantic filtering: verify this reference is actually for our specific class method
            if (!this.isValidReferenceForClass(node, className, symbolName)) {
              continue;
            }

            // Create location-based key for deduplication
            const location = this.getLocation(node, filePath);
            const locationKey = `${location.file}:${location.line}:${location.column}`;

            // Skip if we've already processed this exact location
            if (validReferences.has(locationKey)) {
              continue;
            }
            validReferences.add(locationKey);

            // Determine if this is a method or property
            const isProperty = Node.isPropertyDeclaration(symbolDeclaration);
            const isMethod = Node.isMethodDeclaration(symbolDeclaration) || symbolName === 'constructor';

            if (symbolName === 'constructor') {
              // Handle constructor references
              const methodReference = this.createMethodReference(node, filePath);
              this.addConstructorReference(className, methodReference);
            } else if (isMethod) {
              // Handle method references with class context
              const methodReference = this.createMethodReference(node, filePath);
              this.addMethodReference(className, symbolName, methodReference);
            } else if (isProperty) {
              // Handle property references with class context
              const propertyReference = this.createPropertyReference(node, filePath);
              this.addPropertyReference(className, symbolName, propertyReference);
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
    const key = `${className}:${methodName}`;
    return this.methodCallMap.get(key) || [];
  }

  /**
   * Get references for a specific property
   */
  getPropertyReferences(className: string, propertyName: string): PropertyReference[] {
    const key = `${className}:${propertyName}`;
    return this.propertyAccessMap.get(key) || [];
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
  private addMethodReference(className: string, methodName: string, reference: MethodReference): void {
    const key = `${className}:${methodName}`;
    const existing = this.methodCallMap.get(key) || [];
    existing.push(reference);
    this.methodCallMap.set(key, existing);
  }

  /**
   * Add a property reference to the property access map
   */
  private addPropertyReference(className: string, propertyName: string, reference: PropertyReference): void {
    const key = `${className}:${propertyName}`;
    const existing = this.propertyAccessMap.get(key) || [];
    existing.push(reference);
    this.propertyAccessMap.set(key, existing);
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
   * Semantic filtering: check if this reference is actually for the specific class method
   */
  private isValidReferenceForClass(node: Node, className: string, symbolName: string): boolean {
    // Skip obvious interface/type declaration contexts
    const parent = node.getParent();
    if (!parent) return true;

    // If this is in an interface declaration, it's not a reference to our class method
    if (Node.isInterfaceDeclaration(parent) || Node.isInterfaceDeclaration(parent.getParent())) {
      return false;
    }

    // If this is in a type alias or type parameter, skip it
    if (Node.isTypeAliasDeclaration(parent) || Node.isTypeParameterDeclaration(parent)) {
      return false;
    }

    // If this is a method call, check the receiver context
    if (Node.isPropertyAccessExpression(parent)) {
      const grandParent = parent.getParent();
      if (Node.isCallExpression(grandParent)) {
        // This is a method call like obj.methodName()
        const receiver = parent.getExpression();

        // If it's this.methodName(), it's likely valid if we're in the same class
        if (Node.isThisExpression(receiver)) {
          const containingClass = node.getAncestors().find(ancestor => Node.isClassDeclaration(ancestor));
          if (containingClass && Node.isClassDeclaration(containingClass)) {
            const containingClassName = containingClass.getName();
            return containingClassName === className;
          }
        }

        // Try to get type information for better filtering (basic heuristics)
        const receiverText = receiver.getText();

        // Skip if the receiver name suggests it's a different class
        // This is a heuristic - variable names often hint at the type
        if (this.isLikelyDifferentClassReceiver(receiverText, className)) {
          return false;
        }
      }
    }

    // For now, allow other references (we can add more filtering later)
    return true;
  }

  /**
   * Heuristic to detect if a receiver variable name suggests a different class
   */
  private isLikelyDifferentClassReceiver(receiverText: string, targetClassName: string): boolean {
    // Convert class name to likely variable name patterns
    const targetLower = targetClassName.toLowerCase();
    const receiverLower = receiverText.toLowerCase();

    // If the receiver contains a different class name pattern, it's likely different
    // This is imperfect but helps filter obvious cases
    const commonClassPatterns = [
      'message', 'manager', 'service', 'handler', 'controller',
      'client', 'provider', 'processor', 'analyzer', 'builder'
    ];

    for (const pattern of commonClassPatterns) {
      if (receiverLower.includes(pattern) && !targetLower.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a node is the declaration itself (to filter out from references)
   */
  private isDeclarationNode(node: Node, declaration: MethodDeclaration | PropertyDeclaration): boolean {
    // Check if this node is the same as the declaration
    if (node === declaration) {
      return true;
    }

    // Check if this node is the name identifier of the declaration
    if (Node.isMethodDeclaration(declaration)) {
      const nameNode = declaration.getNameNode();
      if (node === nameNode) {
        return true;
      }
    } else if (Node.isPropertyDeclaration(declaration)) {
      const nameNode = declaration.getNameNode();
      if (node === nameNode) {
        return true;
      }
    }

    // Check if this node is within the declaration's span (but allow for reasonable usage)
    const declarationStart = declaration.getStart();
    const declarationEnd = declaration.getEnd();
    const nodeStart = node.getStart();

    // If the node is within the declaration span and on the same line as the declaration start,
    // it's likely part of the declaration itself
    if (nodeStart >= declarationStart && nodeStart <= declarationEnd) {
      const declarationLine = declaration.getStartLineNumber();
      const nodeLine = node.getStartLineNumber();
      if (nodeLine === declarationLine) {
        return true;
      }
    }

    return false;
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
   * Note: This method cannot determine the correct class context, so it uses "unknown"
   */
  private addMethodCall(methodName: string, node: Node, filePath: string, context: string): void {
    const location = this.getLocation(node, filePath);
    const contextLine = this.getContextLine(node);

    const reference: MethodReference = {
      location,
      contextLine,
      context
    };

    // Use "unknown" class since this legacy method doesn't have class context
    const key = `unknown:${methodName}`;
    const existing = this.methodCallMap.get(key) || [];
    existing.push(reference);
    this.methodCallMap.set(key, existing);
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
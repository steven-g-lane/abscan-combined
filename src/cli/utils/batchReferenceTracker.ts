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
   * Build symbol references using proven symbol-based approach (replaces unreliable findReferences())
   *
   * This approach scans all call expressions and uses semantic type analysis to properly
   * disambiguate method calls to different classes with the same method name.
   */
  private buildSymbolReferences(): void {
    console.log(`🔗 Building symbol references using symbol-based semantic analysis...`);

    // Clear existing maps
    this.methodCallMap.clear();
    this.propertyAccessMap.clear();
    this.constructorCallMap.clear();

    const sourceFiles = this.project.getSourceFiles();
    let totalCallsProcessed = 0;

    for (const sourceFile of sourceFiles) {
      sourceFile.forEachDescendant(node => {
        // Handle method and property calls
        if (Node.isCallExpression(node)) {
          const expr = node.getExpression();

          if (Node.isPropertyAccessExpression(expr)) {
            const methodName = expr.getName();
            const receiver = expr.getExpression();

            // Use symbol-based disambiguation (proven approach from POC)
            const uniqueMethodId = this.getUniqueMethodId(node);

            if (uniqueMethodId) {
              const [className, symbolName] = uniqueMethodId.split('.');

              // Special logging for getVendorData methods
              const isGetVendorData = symbolName === 'getVendorData';
              if (isGetVendorData) {
                console.log(`🚨 GETVENDORDATA Symbol-based reference found:`, {
                  uniqueMethodId,
                  className,
                  symbolName,
                  file: sourceFile.getBaseName(),
                  line: node.getStartLineNumber(),
                  callText: node.getText(),
                  receiverText: receiver.getText(),
                  receiverType: receiver.getType().getText(),
                  methodSymbol: expr.getSymbol()?.getName()
                });
              }

              // Check if this is a method we're tracking
              const symbolKey = `${className}:${symbolName}`;
              if (this.symbolDefinitionMap.has(symbolKey)) {
                const methodReference = this.createMethodReference(node, sourceFile.getFilePath());
                this.addMethodReference(className, symbolName, methodReference);

                if (isGetVendorData) {
                  console.log(`🚨 GETVENDORDATA Added symbol-based reference:`, {
                    symbolKey,
                    methodReference,
                    currentCount: this.methodCallMap.get(symbolKey)?.length || 0
                  });
                }
              }

              totalCallsProcessed++;
            }
          } else if (Node.isNewExpression(node)) {
            // Handle constructor calls
            const expr = node.getExpression();
            if (Node.isIdentifier(expr)) {
              const className = expr.getText();

              // Check if this is a constructor we're tracking
              const constructorKey = `${className}:constructor`;
              if (this.symbolDefinitionMap.has(constructorKey)) {
                const methodReference = this.createMethodReference(node, sourceFile.getFilePath());
                this.addConstructorReference(className, methodReference);
              }

              totalCallsProcessed++;
            }
          }
        }

        // Handle property access (not in call expressions)
        if (Node.isPropertyAccessExpression(node) && !Node.isCallExpression(node.getParent())) {
          const uniquePropertyId = this.getUniquePropertyId(node);

          if (uniquePropertyId) {
            const [className, propertyName] = uniquePropertyId.split('.');

            // Check if this is a property we're tracking
            const symbolKey = `${className}:${propertyName}`;
            if (this.symbolDefinitionMap.has(symbolKey)) {
              const propertyReference = this.createPropertyReference(node, sourceFile.getFilePath());
              this.addPropertyReference(className, propertyName, propertyReference);
            }

            totalCallsProcessed++;
          }
        }
      });
    }

    console.log(`🔗 Symbol-based reference building complete. Processed ${totalCallsProcessed} calls/accesses`);

    // Debug summary for getVendorData methods
    const getVendorDataKeys = Array.from(this.methodCallMap.keys()).filter(key => key.includes('getVendorData'));
    if (getVendorDataKeys.length > 0) {
      console.log(`🚨 GETVENDORDATA FINAL SUMMARY:`, {
        trackedMethods: getVendorDataKeys,
        referenceCounts: getVendorDataKeys.map(key => ({
          method: key,
          count: this.methodCallMap.get(key)?.length || 0,
          references: this.methodCallMap.get(key)?.map(ref => `${path.basename(ref.location.file)}:${ref.location.line}`) || []
        }))
      });
    }
  }

  /**
   * Get unique method ID using symbol-based disambiguation (from proven POC approach)
   */
  private getUniqueMethodId(callExpr: CallExpression): string | null {
    try {
      const expr = callExpr.getExpression();

      if (Node.isPropertyAccessExpression(expr)) {
        const receiver = expr.getExpression();
        const receiverType = receiver.getType();
        const receiverTypeSymbol = receiverType.getSymbol();
        const methodSymbol = expr.getSymbol();

        if (receiverTypeSymbol && methodSymbol) {
          const receiverName = receiverTypeSymbol.getName();
          const methodName = methodSymbol.getName();
          return `${receiverName}.${methodName}`;
        }
      }

      return null;
    } catch (e: any) {
      // Silently ignore errors for robustness
      return null;
    }
  }

  /**
   * Get unique property ID using symbol-based disambiguation
   */
  private getUniquePropertyId(propAccess: PropertyAccessExpression): string | null {
    try {
      const receiver = propAccess.getExpression();
      const receiverType = receiver.getType();
      const receiverTypeSymbol = receiverType.getSymbol();
      const propertySymbol = propAccess.getSymbol();

      if (receiverTypeSymbol && propertySymbol) {
        const receiverName = receiverTypeSymbol.getName();
        const propertyName = propertySymbol.getName();
        return `${receiverName}.${propertyName}`;
      }

      return null;
    } catch (e: any) {
      // Silently ignore errors for robustness
      return null;
    }
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

    // Add polymorphic reference expansion
    this.expandPolymorphicReferences(classes);
  }

  /**
   * Expand polymorphic references: add interface call sites to implementing classes
   * This allows users to see all potential call sites that could invoke a method
   */
  private expandPolymorphicReferences(classes: ComprehensiveClassSummary[]): void {
    console.log('🔗 Starting polymorphic reference expansion...');

    // Step 1: Find interface methods that have references
    const interfaceMethods = this.findInterfaceMethodsWithReferences(classes);
    console.log(`📋 Found ${interfaceMethods.length} interface methods with references`);

    // Step 2: For each interface method, find implementing classes and add references
    let expansionCount = 0;
    for (const { interfaceClass, method, references } of interfaceMethods) {
      const implementingClasses = this.findImplementingClasses(interfaceClass.name, classes);
      console.log(`🔍 Interface ${interfaceClass.name}.${method.name} has ${implementingClasses.length} implementations`);

      for (const implClass of implementingClasses) {
        const implMethod = this.findMethodInClass(implClass, method.name);
        if (implMethod) {
          // Add interface references as polymorphic calls to implementation
          const polymorphicRefs = references.map(ref => ({
            ...ref,
            context: 'polymorphic_call'
          }));

          implMethod.references = implMethod.references || [];
          implMethod.references.push(...polymorphicRefs);
          implMethod.referenceCount = implMethod.references.length;

          expansionCount += polymorphicRefs.length;
          console.log(`  ➕ Added ${polymorphicRefs.length} polymorphic references to ${implClass.name}.${method.name}`);
        }
      }
    }

    console.log(`✅ Polymorphic expansion complete: added ${expansionCount} polymorphic references`);
  }

  /**
   * Find interface methods that have call site references
   */
  private findInterfaceMethodsWithReferences(classes: ComprehensiveClassSummary[]): Array<{
    interfaceClass: ComprehensiveClassSummary;
    method: any;
    references: MethodReference[];
  }> {
    const result: Array<{
      interfaceClass: ComprehensiveClassSummary;
      method: any;
      references: MethodReference[];
    }> = [];

    for (const classData of classes) {
      // Skip non-local classes and non-interfaces
      if (!classData.isLocal || !this.isInterface(classData)) continue;

      if (classData.methods) {
        for (const method of classData.methods) {
          if (method.references && method.references.length > 0) {
            result.push({
              interfaceClass: classData,
              method,
              references: method.references
            });
          }
        }
      }
    }

    return result;
  }

  /**
   * Find classes that implement a specific interface
   */
  private findImplementingClasses(interfaceName: string, classes: ComprehensiveClassSummary[]): ComprehensiveClassSummary[] {
    const result: ComprehensiveClassSummary[] = [];

    for (const classData of classes) {
      if (!classData.isLocal || this.isInterface(classData)) continue;

      // Check if this class implements the interface
      if (classData.implements && classData.implements.includes(interfaceName)) {
        result.push(classData);
      }
    }

    return result;
  }

  /**
   * Find a specific method in a class
   */
  private findMethodInClass(classData: ComprehensiveClassSummary, methodName: string): any | null {
    if (!classData.methods) return null;

    return classData.methods.find(method => method.name === methodName) || null;
  }

  /**
   * Determine if a class is actually an interface by checking the source file
   */
  private isInterface(classData: ComprehensiveClassSummary): boolean {
    if (!classData.location) return false;

    try {
      // Get the source file and find the declaration
      const sourceFile = this.project.getSourceFile(classData.location.file);
      if (!sourceFile) return false;

      // Look for interface declarations with this name
      const interfaceDecls = sourceFile.getInterfaces().filter(iface => iface.getName() === classData.name);
      if (interfaceDecls.length > 0) {
        return true;
      }

      // Also check if it's declared as an interface in the same line
      const line = sourceFile.getFullText().split('\n')[classData.location.line - 1];
      if (line && line.trim().startsWith('interface ')) {
        return true;
      }

      return false;
    } catch (error) {
      // Fallback to heuristic if AST check fails
      console.warn(`Could not determine interface status for ${classData.name}, using heuristic`);
      return !classData.constructors || classData.constructors.length === 0;
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
   * Get the call expression containing a reference node, if any.
   * This helps get the correct line positioning for method calls.
   */
  private getCallExpressionFromReference(node: Node): CallExpression | null {
    // Traverse up the AST to find a CallExpression that contains this node
    let current = node;
    while (current) {
      // If we're already a CallExpression, return it
      if (Node.isCallExpression(current)) {
        return current;
      }

      // Check if parent is a CallExpression (common case: identifier inside call)
      const parent = current.getParent();
      if (parent && Node.isCallExpression(parent)) {
        return parent;
      }

      current = parent;

      // Don't traverse too far up - stop at statement level
      if (current && Node.isStatement(current)) {
        break;
      }
    }
    return null;
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
      line: lineAndColumn.line, // Already 1-based from ts-morph
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

    const lineIndex = lineAndColumn.line - 1; // Convert 1-based to 0-based for array access
    if (lineIndex >= 0 && lineIndex < lines.length) {
      return lines[lineIndex].trim();
    }

    return '';
  }
}
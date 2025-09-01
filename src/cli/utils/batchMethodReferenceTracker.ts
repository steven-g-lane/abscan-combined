import { 
  SourceFile, 
  Node, 
  SyntaxKind, 
  CallExpression,
  NewExpression,
  PropertyAccessExpression,
  Identifier,
  Project
} from 'ts-morph';
import { MethodReference, CodeLocation, ComprehensiveClassSummary } from '../models';
import path from 'path';

interface MethodKey {
  className: string;
  methodName: string;
}

/**
 * Efficient batch method reference tracker that scans all files once
 * and builds a comprehensive reference map to avoid O(n²) complexity
 */
export class BatchMethodReferenceTracker {
  private project: Project;
  private methodCallMap: Map<string, MethodReference[]> = new Map(); // methodName -> references
  private constructorCallMap: Map<string, MethodReference[]> = new Map(); // className -> references

  constructor(project: Project) {
    this.project = project;
  }

  /**
   * Scan all files once and build reference map for all methods
   */
  buildReferenceMap(): void {
    const sourceFiles = this.project.getSourceFiles();
    console.log(`🔍 Starting reference map build for ${sourceFiles.length} files`);
    
    // Single pass through all files to collect references
    for (let i = 0; i < sourceFiles.length; i++) {
      const sourceFile = sourceFiles[i];
      const fileName = path.basename(sourceFile.getFilePath());
      console.log(`📄 Processing file ${i + 1}/${sourceFiles.length}: ${fileName}`);
      
      this.scanFileForMethodReferences(sourceFile);
      
      console.log(`✅ Completed file ${i + 1}/${sourceFiles.length}: ${fileName}`);
    }
    
    console.log(`🎯 Reference map build complete. Found ${this.methodCallMap.size} method patterns, ${this.constructorCallMap.size} constructor patterns`);
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
   * Apply collected references to class data
   */
  applyReferencesToClasses(classes: Map<string, ComprehensiveClassSummary>): void {
    for (const classData of classes.values()) {
      if (!classData.isLocal) continue;
      
      // Apply to methods
      if (classData.methods) {
        for (const method of classData.methods) {
          const references = this.getMethodReferences(classData.name, method.name);
          if (references.length > 0) {
            method.references = references;
          }
        }
      }
      
      // Apply to constructors
      if (classData.constructors) {
        for (const constructor of classData.constructors) {
          const references = this.getMethodReferences(classData.name, 'constructor');
          if (references.length > 0) {
            constructor.references = references;
          }
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
   * Add a method call to the method call map
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
   * Add a constructor call to the constructor call map
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
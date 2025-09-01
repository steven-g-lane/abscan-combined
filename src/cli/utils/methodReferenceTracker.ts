import { 
  SourceFile, 
  Node, 
  SyntaxKind, 
  CallExpression,
  NewExpression,
  PropertyAccessExpression,
  ClassDeclaration,
  MethodDeclaration,
  Identifier
} from 'ts-morph';
import { MethodReference, CodeLocation } from '../models';
import path from 'path';

export class MethodReferenceTracker {
  private project: any;

  constructor(project: any) {
    this.project = project;
  }

  /**
   * Find all references to a specific method across the entire project
   */
  findMethodReferences(className: string, methodName: string, classLocation: CodeLocation): MethodReference[] {
    const references: MethodReference[] = [];
    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      const fileReferences = this.findMethodReferencesInFile(
        sourceFile, 
        className, 
        methodName, 
        classLocation
      );
      references.push(...fileReferences);
    }

    return references;
  }

  /**
   * Find method references within a single source file
   */
  private findMethodReferencesInFile(
    sourceFile: SourceFile, 
    className: string, 
    methodName: string,
    classLocation: CodeLocation
  ): MethodReference[] {
    const references: MethodReference[] = [];
    const filePath = sourceFile.getFilePath();

    // Skip the file where the method is defined
    if (filePath === classLocation.file) {
      return references;
    }

    // Find all call expressions in the file
    sourceFile.forEachDescendant((node: Node) => {
      if (Node.isCallExpression(node)) {
        const reference = this.analyzeCallExpression(node, className, methodName, filePath);
        if (reference) {
          references.push(reference);
        }
      }
      
      // Handle constructor calls (new ClassName())
      if (methodName === 'constructor' && Node.isNewExpression(node)) {
        const reference = this.analyzeNewExpression(node, className, filePath);
        if (reference) {
          references.push(reference);
        }
      }
    });

    return references;
  }

  /**
   * Analyze a call expression to see if it references our target method
   */
  private analyzeCallExpression(
    callExpr: CallExpression, 
    targetClassName: string, 
    targetMethodName: string,
    filePath: string
  ): MethodReference | null {
    const expression = callExpr.getExpression();

    // Handle method calls like obj.methodName() or this.methodName()
    if (Node.isPropertyAccessExpression(expression)) {
      const propertyName = expression.getName();
      
      if (propertyName === targetMethodName) {
        // Check if this could be a call on our target class
        const objectExpr = expression.getExpression();
        
        // Get the context line
        const location = this.getLocation(callExpr, filePath);
        const contextLine = this.getContextLine(callExpr);
        
        // Create reference with basic context
        const context = this.determineCallContext(objectExpr, targetClassName);
        
        return {
          location,
          contextLine,
          context
        };
      }
    }

    // Handle direct method calls like methodName()
    if (Node.isIdentifier(expression)) {
      const methodName = expression.getText();
      
      if (methodName === targetMethodName) {
        const location = this.getLocation(callExpr, filePath);
        const contextLine = this.getContextLine(callExpr);
        
        return {
          location,
          contextLine,
          context: 'direct call'
        };
      }
    }

    return null;
  }

  /**
   * Determine the context of a method call
   */
  private determineCallContext(objectExpr: Node, targetClassName: string): string {
    if (Node.isThisExpression(objectExpr)) {
      return 'this call';
    }
    
    if (Node.isIdentifier(objectExpr)) {
      const varName = objectExpr.getText();
      return `${varName} call`;
    }
    
    if (Node.isSuperExpression(objectExpr)) {
      return 'super call';
    }
    
    return 'method call';
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

  /**
   * Analyze a new expression to see if it's creating our target class
   */
  private analyzeNewExpression(
    newExpr: NewExpression,
    targetClassName: string,
    filePath: string
  ): MethodReference | null {
    const expression = newExpr.getExpression();
    
    if (Node.isIdentifier(expression)) {
      const className = expression.getText();
      
      if (className === targetClassName) {
        const location = this.getLocation(newExpr, filePath);
        const contextLine = this.getContextLine(newExpr);
        
        return {
          location,
          contextLine,
          context: 'constructor call'
        };
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
      line: lineAndColumn.line + 1, // Convert to 1-based line numbers
      column: lineAndColumn.column
    };
  }
}
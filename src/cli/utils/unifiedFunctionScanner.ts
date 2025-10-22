import {
  SourceFile,
  Node,
  CallExpression,
  MethodDeclaration,
  FunctionDeclaration,
  Project
} from 'ts-morph';
import { FunctionReference, CodeLocation, ComprehensiveFunctionSummary } from '../models';
import path from 'path';
import { cliLogger } from '../../shared/logging/logger';

/**
 * Unified scanner that collects both function definitions and references
 * in a single pass with consistent qualified naming
 */
export class UnifiedFunctionScanner {
  private project: Project;
  private functionDefinitions: Map<string, ComprehensiveFunctionSummary> = new Map();
  private functionReferences: Map<string, FunctionReference[]> = new Map();
  private logger = cliLogger('unifiedFunctionScanner');

  constructor(project: Project) {
    this.project = project;
  }

  /**
   * Single pass: collect both definitions and references with qualified names
   */
  scanAll(): Map<string, ComprehensiveFunctionSummary> {
    const sourceFiles = this.project.getSourceFiles();
    this.logger.info('Starting unified function scan', { fileCount: sourceFiles.length });

    for (let i = 0; i < sourceFiles.length; i++) {
      const sourceFile = sourceFiles[i];
      const fileName = path.basename(sourceFile.getFilePath());

      this.logger.debug('Processing file', {
        current: i + 1,
        total: sourceFiles.length,
        fileName
      });

      sourceFile.forEachDescendant(node => {
        // Handle function/method DEFINITIONS
        if (Node.isMethodDeclaration(node) || Node.isFunctionDeclaration(node)) {
          this.processFunctionDefinition(node, sourceFile);
        }

        // Handle function/method REFERENCES
        if (Node.isCallExpression(node)) {
          this.processFunctionReference(node, sourceFile);
        }
      });
    }

    // Link definitions with their references
    this.linkReferences();

    this.logger.info('Unified function scan complete', {
      definitions: this.functionDefinitions.size,
      referenceBuckets: this.functionReferences.size
    });

    return this.functionDefinitions;
  }

  private processFunctionDefinition(node: MethodDeclaration | FunctionDeclaration, sourceFile: SourceFile): void {
    const qualifiedName = this.getQualifiedNameFromDefinition(node);
    if (!qualifiedName) return;

    // Extract function details (reuse existing extraction logic patterns)
    const functionSummary = this.extractFunctionSummary(node, sourceFile, qualifiedName);

    this.functionDefinitions.set(qualifiedName, functionSummary);

    this.logger.debug('Function definition found', {
      qualifiedName,
      file: path.basename(sourceFile.getFilePath()),
      line: node.getStartLineNumber()
    });
  }

  private processFunctionReference(callExpr: CallExpression, sourceFile: SourceFile): void {
    const qualifiedName = this.getQualifiedNameFromReference(callExpr);
    if (!qualifiedName) return;

    const reference: FunctionReference = {
      location: this.getLocation(callExpr, sourceFile),
      contextLine: this.getContextLine(callExpr),
      context: 'call'
    };

    const existing = this.functionReferences.get(qualifiedName) || [];
    existing.push(reference);
    this.functionReferences.set(qualifiedName, existing);

    this.logger.debug('Function reference found', {
      qualifiedName,
      file: path.basename(sourceFile.getFilePath()),
      line: callExpr.getStartLineNumber()
    });
  }

  /**
   * Generate qualified name from function definition
   */
  private getQualifiedNameFromDefinition(node: MethodDeclaration | FunctionDeclaration): string | null {
    try {
      const name = node.getName();
      if (!name) return null;

      // For method declarations, get the containing class
      if (Node.isMethodDeclaration(node)) {
        const classDecl = node.getParent();
        if (Node.isClassDeclaration(classDecl)) {
          const className = classDecl.getName();
          if (className) {
            return `${className}.${name}`;
          }
        }
      }

      // For function declarations, use module-level naming
      if (Node.isFunctionDeclaration(node)) {
        const sourceFile = node.getSourceFile();
        const fileName = path.basename(sourceFile.getFilePath(), path.extname(sourceFile.getFilePath()));
        return `${fileName}.${name}`;
      }

      return name; // fallback
    } catch (e: any) {
      this.logger.debug('Failed to generate qualified name from definition', { error: e.message });
      return null;
    }
  }

  /**
   * Generate qualified name from function reference (using POC approach)
   */
  private getQualifiedNameFromReference(callExpr: CallExpression): string | null {
    try {
      const expr = callExpr.getExpression();

      // Handle direct function calls
      if (Node.isIdentifier(expr)) {
        const functionName = expr.getText();
        // For direct calls, we'd need module context - for now use simple name
        // This could be enhanced later to resolve module context
        return functionName;
      }

      // Handle method calls - use our proven POC approach
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
      this.logger.debug('Failed to generate qualified name from reference', { error: e.message });
      return null;
    }
  }

  /**
   * Extract function summary from declaration node
   */
  private extractFunctionSummary(
    node: MethodDeclaration | FunctionDeclaration,
    sourceFile: SourceFile,
    qualifiedName: string
  ): ComprehensiveFunctionSummary {
    const filePath = sourceFile.getFilePath();
    const name = node.getName() || 'anonymous';
    const startLineNumber = node.getStartLineNumber();
    const endLineNumber = node.getEndLineNumber();

    // Extract parameters
    const parameters = node.getParameters().map(param => ({
      name: param.getName(),
      type: param.getTypeNode()?.getText() || 'unknown',
      isOptional: param.isOptional(),
      isRestParameter: param.isRestParameter()
    }));

    // Extract return type
    const returnTypeNode = node.getReturnTypeNode();
    const returnType = returnTypeNode?.getText();

    // Check if exported
    let isExported = false;
    if (Node.isFunctionDeclaration(node)) {
      isExported = node.isExported();
    } else if (Node.isMethodDeclaration(node)) {
      // For methods, check if the containing class is exported
      const classDecl = node.getParent();
      if (Node.isClassDeclaration(classDecl)) {
        isExported = classDecl.isExported();
      }
    }

    // Calculate source LOC
    const sourceLOC = endLineNumber - startLineNumber + 1;

    // Check if it's a React component (simple heuristic)
    const isReactComponent = this.isReactComponent(node);

    return {
      id: qualifiedName,
      name,
      sourceFile: filePath,
      location: {
        file: filePath,
        line: startLineNumber,
        column: node.getStart() - node.getStartLinePos(),
        endLine: endLineNumber
      },
      parameters,
      returnType,
      isExported,
      genericParameters: [], // Could be enhanced
      jsdocDescription: this.extractJSDocDescription(node),
      sourceLOC,
      sourceFilename: path.basename(filePath),
      references: [], // Will be populated in linkReferences
      referenceCount: 0, // Will be calculated in linkReferences
      isReactComponent
    };
  }

  /**
   * Simple heuristic to detect React components
   */
  private isReactComponent(node: MethodDeclaration | FunctionDeclaration): boolean {
    // Check if return type includes JSX
    const returnTypeNode = node.getReturnTypeNode();
    if (returnTypeNode) {
      const returnTypeText = returnTypeNode.getText();
      if (returnTypeText.includes('JSX') || returnTypeText.includes('ReactElement')) {
        return true;
      }
    }

    // Check function body for JSX return (simple check)
    const bodyText = node.getBodyText();
    if (bodyText && (bodyText.includes('return <') || bodyText.includes('return('))) {
      return true;
    }

    return false;
  }

  /**
   * Extract JSDoc description
   */
  private extractJSDocDescription(node: MethodDeclaration | FunctionDeclaration): string | undefined {
    const jsDocs = node.getJsDocs();
    if (jsDocs.length > 0) {
      const firstDoc = jsDocs[0];
      const description = firstDoc.getDescription();
      return description?.trim() || undefined;
    }
    return undefined;
  }

  /**
   * Link definitions with their references using exact key matching
   */
  private linkReferences(): void {
    this.functionDefinitions.forEach((funcDef, qualifiedName) => {
      const references = this.functionReferences.get(qualifiedName) || [];
      funcDef.references = references;
      funcDef.referenceCount = references.length;

      if (references.length > 0) {
        this.logger.debug('Linked references', {
          qualifiedName,
          referenceCount: references.length
        });
      }
    });
  }

  /**
   * Get location information for a node
   */
  private getLocation(node: Node, sourceFile: SourceFile): CodeLocation {
    const start = node.getStart();
    const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);

    return {
      file: sourceFile.getFilePath(),
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
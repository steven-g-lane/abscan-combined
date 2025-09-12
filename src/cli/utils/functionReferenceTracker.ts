import { 
  SourceFile, 
  Node, 
  CallExpression,
  Identifier,
  Project
} from 'ts-morph';
import { FunctionReference, CodeLocation, ComprehensiveFunctionSummary } from '../models';
import path from 'path';
import { cliLogger } from '../../shared/logging/logger';

/**
 * Efficient batch function reference tracker that scans all files once
 * and builds a comprehensive reference map for functions
 */
export class FunctionReferenceTracker {
  private project: Project;
  private functionCallMap: Map<string, FunctionReference[]> = new Map(); // functionName -> references

  constructor(project: Project) {
    this.project = project;
  }

  /**
   * Scan all files once and build reference map for all functions
   */
  buildReferenceMap(): void {
    const sourceFiles = this.project.getSourceFiles();
    const logger = cliLogger('functionReferenceTracker');
    logger.info('Starting function reference map build', { fileCount: sourceFiles.length });
    
    // Single pass through all files to collect function references
    for (let i = 0; i < sourceFiles.length; i++) {
      const sourceFile = sourceFiles[i];
      const fileName = path.basename(sourceFile.getFilePath());
      logger.debug('Processing function references', {
        current: i + 1,
        total: sourceFiles.length,
        fileName
      });
      
      this.scanFileForFunctionReferences(sourceFile);
      
      logger.debug('Completed function reference scan', {
        current: i + 1,
        total: sourceFiles.length,
        fileName
      });
    }
    
    logger.info('Function reference map build complete', {
      functionCallPatterns: this.functionCallMap.size
    });
  }

  /**
   * Get references for a specific function
   */
  getFunctionReferences(functionName: string): FunctionReference[] {
    return this.functionCallMap.get(functionName) || [];
  }

  /**
   * Apply collected references to function data with intelligent filtering
   */
  applyReferencesToFunctions(functions: Map<string, ComprehensiveFunctionSummary>): void {
    for (const functionData of functions.values()) {
      const allReferences = this.getFunctionReferences(functionData.name);
      
      // Filter references to only include those that are likely for this specific function
      const filteredReferences = this.filterReferencesForFunction(functionData, allReferences);
      
      functionData.references = filteredReferences;
      functionData.referenceCount = filteredReferences.length;
    }
  }

  /**
   * Filter references to only include those likely for a specific function
   */
  private filterReferencesForFunction(
    functionData: ComprehensiveFunctionSummary, 
    allReferences: FunctionReference[]
  ): FunctionReference[] {
    const functionFile = functionData.sourceFile;
    
    return allReferences.filter(ref => {
      // Always include references from the same file where the function is defined
      if (ref.location.file === functionFile) {
        return true;
      }
      
      // For references from other files, we could implement more sophisticated logic here
      // For now, include all external references (they could be imports/exports)
      // In a more sophisticated implementation, we could:
      // 1. Check import statements to see if this specific function is imported
      // 2. Check if the function is exported from its file
      // 3. Use ts-morph's symbol resolution for precise matching
      
      // Simple heuristic: if the function is exported, include external references
      return functionData.isExported;
    });
  }

  /**
   * Scan a single file for all function references
   */
  private scanFileForFunctionReferences(sourceFile: SourceFile): void {
    const filePath = sourceFile.getFilePath();
    const fileName = path.basename(filePath);
    let nodeCount = 0;
    let callCount = 0;

    console.log(`  🔍 Starting AST traversal for function references in ${fileName}`);

    sourceFile.forEachDescendant((node: Node) => {
      nodeCount++;
      
      // Log progress every 1000 nodes
      if (nodeCount % 1000 === 0) {
        console.log(`    📊 Visited ${nodeCount} nodes in ${fileName}, function calls: ${callCount}`);
      }
      
      // Handle function calls
      if (Node.isCallExpression(node)) {
        callCount++;
        console.log(`    📞 Processing function call expression #${callCount} in ${fileName} at line ${node.getStartLineNumber()}`);
        this.processCallExpression(node, filePath);
      }
    });

    console.log(`  ✅ AST traversal complete for ${fileName}: ${nodeCount} nodes, ${callCount} function calls`);
  }

  /**
   * Process a call expression to extract function references
   */
  private processCallExpression(callExpr: CallExpression, filePath: string): void {
    const expression = callExpr.getExpression();

    // Handle direct function calls like functionName()
    if (Node.isIdentifier(expression)) {
      const functionName = expression.getText();
      this.addFunctionCall(functionName, callExpr, filePath, 'direct call');
    }

    // Handle method-style calls like obj.functionName() - could be functions attached to objects
    if (Node.isPropertyAccessExpression(expression)) {
      const functionName = expression.getName();
      this.addFunctionCall(functionName, callExpr, filePath, 'property call');
    }
  }

  /**
   * Add a function call to the function call map
   */
  private addFunctionCall(functionName: string, node: Node, filePath: string, context: string): void {
    const location = this.getLocation(node, filePath);
    const contextLine = this.getContextLine(node);
    
    const reference: FunctionReference = {
      location,
      contextLine,
      context
    };
    
    const existing = this.functionCallMap.get(functionName) || [];
    existing.push(reference);
    this.functionCallMap.set(functionName, existing);
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
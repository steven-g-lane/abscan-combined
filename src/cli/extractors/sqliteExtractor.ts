import { SourceFile, CallExpression, PropertyAccessExpression, SyntaxKind } from 'ts-morph';
import { SQLiteQuerySummary, CodeLocation } from '../models';

export function extractSQLiteQueries(sourceFile: SourceFile): SQLiteQuerySummary[] {
  const queries: SQLiteQuerySummary[] = [];
  
  // Find all call expressions
  sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpr => {
    const query = extractSQLiteQuery(callExpr, sourceFile.getFilePath());
    if (query) {
      queries.push(query);
    }
  });
  
  return queries;
}

function extractSQLiteQuery(callExpr: CallExpression, filePath: string): SQLiteQuerySummary | null {
  const expression = callExpr.getExpression();
  
  // Check for method calls on database objects
  if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
    const propAccess = expression as PropertyAccessExpression;
    const method = propAccess.getName();
    
    // Common SQLite method names
    const sqliteMethods = [
      'exec', 'prepare', 'run', 'get', 'all', 'pragma',
      'transaction', 'query', 'execute'
    ];
    
    if (sqliteMethods.includes(method)) {
      const args = callExpr.getArguments();
      if (args.length > 0) {
        const firstArg = args[0];
        
        // Try to extract SQL query string
        let query = 'unknown';
        if (firstArg.getKind() === SyntaxKind.StringLiteral) {
          query = firstArg.getText().slice(1, -1); // Remove quotes
        } else if (firstArg.getKind() === SyntaxKind.TemplateExpression) {
          query = firstArg.getText(); // Keep template literal as-is
        } else {
          query = firstArg.getText(); // Variable or expression
        }
        
        const location = getLocation(callExpr, filePath);
        
        return {
          query,
          location,
          method
        };
      }
    }
  }
  
  // Check for direct function calls that might be SQLite related
  if (expression.getKind() === SyntaxKind.Identifier) {
    const name = expression.getText();
    const sqliteFunctions = ['sql', 'query', 'execute'];
    
    if (sqliteFunctions.includes(name)) {
      const args = callExpr.getArguments();
      if (args.length > 0) {
        const firstArg = args[0];
        let query = 'unknown';
        
        if (firstArg.getKind() === SyntaxKind.StringLiteral) {
          query = firstArg.getText().slice(1, -1);
        } else {
          query = firstArg.getText();
        }
        
        const location = getLocation(callExpr, filePath);
        
        return {
          query,
          location,
          method: name
        };
      }
    }
  }
  
  return null;
}

function getLocation(node: any, filePath: string): CodeLocation {
  const start = node.getStart();
  const sourceFile = node.getSourceFile();
  const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
  
  return {
    file: filePath,
    line: lineAndColumn.line,
    column: lineAndColumn.column
  };
}
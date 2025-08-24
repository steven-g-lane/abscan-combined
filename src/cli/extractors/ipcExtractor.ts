import { SourceFile, CallExpression, PropertyAccessExpression, SyntaxKind } from 'ts-morph';
import { IPCSummary, IPCHandlerSummary, IPCInvocationSummary, CodeLocation } from '../models';

export function extractIPC(sourceFile: SourceFile): IPCSummary {
  const handlers: IPCHandlerSummary[] = [];
  const invocations: IPCInvocationSummary[] = [];
  
  // Find all call expressions in the file
  sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach(propAccess => {
    const expression = propAccess.getExpression();
    const name = propAccess.getName();
    
    // Check for ipcMain handlers
    if (expression.getText() === 'ipcMain' && (name === 'handle' || name === 'on')) {
      const callExpr = propAccess.getParent();
      if (callExpr && callExpr.getKind() === SyntaxKind.CallExpression) {
        const handler = extractIPCHandler(callExpr as CallExpression, name as 'handle' | 'on', sourceFile.getFilePath());
        if (handler) {
          handlers.push(handler);
        }
      }
    }
    
    // Check for ipcRenderer invocations
    if (expression.getText() === 'ipcRenderer' && (name === 'invoke' || name === 'send')) {
      const callExpr = propAccess.getParent();
      if (callExpr && callExpr.getKind() === SyntaxKind.CallExpression) {
        const invocation = extractIPCInvocation(callExpr as CallExpression, name as 'invoke' | 'send', sourceFile.getFilePath());
        if (invocation) {
          invocations.push(invocation);
        }
      }
    }
  });
  
  return { handlers, invocations };
}

function extractIPCHandler(callExpr: CallExpression, type: 'handle' | 'on', filePath: string): IPCHandlerSummary | null {
  const args = callExpr.getArguments();
  if (args.length < 1) return null;
  
  const channelArg = args[0];
  let channel = 'unknown';
  
  // Try to extract string literal channel name
  if (channelArg.getKind() === SyntaxKind.StringLiteral) {
    channel = channelArg.getText().slice(1, -1); // Remove quotes
  } else {
    // If it's not a string literal, use the text representation
    channel = channelArg.getText();
  }
  
  const location = getLocation(callExpr, filePath);
  
  return {
    channel,
    location,
    type
  };
}

function extractIPCInvocation(callExpr: CallExpression, type: 'invoke' | 'send', filePath: string): IPCInvocationSummary | null {
  const args = callExpr.getArguments();
  if (args.length < 1) return null;
  
  const channelArg = args[0];
  let channel = 'unknown';
  
  // Try to extract string literal channel name
  if (channelArg.getKind() === SyntaxKind.StringLiteral) {
    channel = channelArg.getText().slice(1, -1); // Remove quotes
  } else {
    // If it's not a string literal, use the text representation
    channel = channelArg.getText();
  }
  
  const location = getLocation(callExpr, filePath);
  
  return {
    channel,
    location,
    type
  };
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
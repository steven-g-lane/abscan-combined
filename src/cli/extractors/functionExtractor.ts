import { SourceFile, FunctionDeclaration, VariableDeclaration, SyntaxKind } from 'ts-morph';
import { FunctionSummary, ParameterSummary, CodeLocation } from '../models';
import { TypeResolver } from '../utils/typeResolver';
import path from 'path';

export function extractFunctions(sourceFile: SourceFile): FunctionSummary[] {
  const functions: FunctionSummary[] = [];
  const typeChecker = sourceFile.getProject().getTypeChecker();
  const typeResolver = new TypeResolver(typeChecker);
  const filePath = sourceFile.getFilePath();
  
  // Extract function declarations
  sourceFile.getFunctions().forEach(functionDeclaration => {
    const functionSummary = extractFunctionDeclaration(functionDeclaration, filePath, typeResolver);
    functions.push(functionSummary);
  });
  
  // Extract arrow functions and function expressions assigned to variables
  sourceFile.getVariableDeclarations().forEach(variableDeclaration => {
    const functionSummary = extractVariableFunction(variableDeclaration, filePath, typeResolver);
    if (functionSummary) {
      functions.push(functionSummary);
    }
  });
  
  return functions;
}

function extractFunctionDeclaration(functionDeclaration: FunctionDeclaration, filePath: string, typeResolver: TypeResolver): FunctionSummary {
  const name = functionDeclaration.getName() || 'Anonymous';
  const location = getLocation(functionDeclaration, filePath);
  
  // Extract JSDoc information
  const jsDocInfo = typeResolver.extractJSDocInfo(functionDeclaration);
  
  // Extract parameters with enhanced information
  const parameters = functionDeclaration.getParameters().map(param => 
    typeResolver.extractParameterInfo(param, jsDocInfo.paramDescriptions)
  );
  
  // Extract return type information
  const returnType = functionDeclaration.getReturnTypeNode()?.getText();
  const resolvedReturnType = typeResolver.resolveFullType(functionDeclaration.getReturnTypeNode());
  
  // Extract generic parameters
  const genericParameters = typeResolver.resolveGenericParameters(functionDeclaration);
  
  // Extract overloads
  const overloads = typeResolver.extractOverloads(functionDeclaration);
  
  const isExported = functionDeclaration.isExported();
  
  return {
    name,
    location,
    parameters,
    returnType,
    resolvedReturnType,
    isExported,
    genericParameters: genericParameters.length > 0 ? genericParameters : undefined,
    overloads: overloads.length > 0 ? overloads : undefined,
    jsdocDescription: jsDocInfo.description
  };
}

function extractVariableFunction(variableDeclaration: VariableDeclaration, filePath: string, typeResolver: TypeResolver): FunctionSummary | null {
  const initializer = variableDeclaration.getInitializer();
  
  if (!initializer) return null;
  
  // Check if it's an arrow function or function expression
  if (initializer.getKind() === SyntaxKind.ArrowFunction || 
      initializer.getKind() === SyntaxKind.FunctionExpression) {
    
    const name = variableDeclaration.getName();
    const location = getLocation(variableDeclaration, filePath);
    
    // Extract JSDoc information from the variable declaration
    const jsDocInfo = typeResolver.extractJSDocInfo(variableDeclaration);
    
    // Get parameters from the function with enhanced information
    const functionNode = initializer as any;
    const parameters = functionNode.getParameters?.()?.map((param: any) => 
      typeResolver.extractParameterInfo(param, jsDocInfo.paramDescriptions)
    ) || [];
    
    const returnType = functionNode.getReturnTypeNode?.()?.getText();
    const resolvedReturnType = typeResolver.resolveFullType(functionNode.getReturnTypeNode?.());
    const isExported = variableDeclaration.getVariableStatement()?.isExported() || false;
    
    // Note: Arrow functions can't have generic parameters in TypeScript
    
    return {
      name,
      location,
      parameters,
      returnType,
      resolvedReturnType,
      isExported,
      jsdocDescription: jsDocInfo.description
    };
  }
  
  return null;
}

function getLocation(node: any, filePath: string): CodeLocation {
  const start = node.getStart();
  const end = node.getEnd();
  const sourceFile = node.getSourceFile();
  const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
  const endLineAndColumn = sourceFile.getLineAndColumnAtPos(end);
  
  return {
    file: filePath,
    line: lineAndColumn.line,
    column: lineAndColumn.column,
    endLine: endLineAndColumn.line
  };
}
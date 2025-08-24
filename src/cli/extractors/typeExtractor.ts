import { SourceFile, TypeAliasDeclaration } from 'ts-morph';
import { TypeAliasSummary, CodeLocation } from '../models';

export function extractTypes(sourceFile: SourceFile): TypeAliasSummary[] {
  const types: TypeAliasSummary[] = [];
  
  sourceFile.getTypeAliases().forEach(typeDeclaration => {
    const typeSummary = extractTypeDeclaration(typeDeclaration, sourceFile.getFilePath());
    types.push(typeSummary);
  });
  
  return types;
}

function extractTypeDeclaration(typeDeclaration: TypeAliasDeclaration, filePath: string): TypeAliasSummary {
  const name = typeDeclaration.getName();
  const location = getLocation(typeDeclaration, filePath);
  const type = typeDeclaration.getTypeNode()?.getText() || 'unknown';
  
  return {
    name,
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
import { SourceFile, ClassDeclaration, MethodDeclaration, PropertyDeclaration, ConstructorDeclaration, SyntaxKind } from 'ts-morph';
import { ClassSummary, MethodSummary, PropertySummary, ParameterSummary, CodeLocation } from '../models';
import { TypeResolver } from '../utils/typeResolver';
import path from 'path';

export function extractClasses(sourceFile: SourceFile): ClassSummary[] {
  const classes: ClassSummary[] = [];
  const typeChecker = sourceFile.getProject().getTypeChecker();
  const typeResolver = new TypeResolver(typeChecker);
  
  sourceFile.getClasses().forEach(classDeclaration => {
    const classSummary = extractClassSummary(classDeclaration, sourceFile.getFilePath(), typeResolver);
    classes.push(classSummary);
  });
  
  return classes;
}

function extractClassSummary(classDeclaration: ClassDeclaration, filePath: string, typeResolver: TypeResolver): ClassSummary {
  const name = classDeclaration.getName() || 'Anonymous';
  const location = getLocation(classDeclaration, filePath);
  
  // Extract JSDoc information
  const jsDocInfo = typeResolver.extractJSDocInfo(classDeclaration);
  
  // Extract methods (excluding constructors)
  const methods = classDeclaration.getMethods().map(method => 
    extractMethodSummary(method, filePath, typeResolver)
  );
  
  // Extract constructors separately
  const constructors = classDeclaration.getConstructors().map(constructor => 
    extractConstructorSummary(constructor, filePath, typeResolver)
  );
  
  // Extract properties
  const properties = classDeclaration.getProperties().map(property => 
    extractPropertySummary(property, filePath, typeResolver)
  );
  
  // Extract generic parameters
  const genericParameters = classDeclaration.getTypeParameters().map(param => ({
    name: param.getName(),
    constraint: param.getConstraint()?.getText(),
    defaultType: param.getDefault()?.getText()
  }));
  
  const extendsClause = classDeclaration.getExtends();
  const implementsClauses = classDeclaration.getImplements();
  const isAbstract = classDeclaration.hasModifier(SyntaxKind.AbstractKeyword);
  
  // Calculate LOC and source filename
  const sourceLOC = calculateClassLOC(classDeclaration);
  const sourceFilename = path.basename(filePath);

  return {
    name,
    location,
    methods,
    properties,
    constructors,
    extends: extendsClause?.getText(),
    implements: implementsClauses.map(impl => impl.getText()),
    genericParameters: genericParameters.length > 0 ? genericParameters : undefined,
    jsdocDescription: jsDocInfo.description,
    isAbstract,
    sourceLOC,
    sourceFilename
  };
}

function extractMethodSummary(method: MethodDeclaration, filePath: string, typeResolver: TypeResolver): MethodSummary {
  const name = method.getName();
  const location = getLocation(method, filePath);
  
  // Extract JSDoc information
  const jsDocInfo = typeResolver.extractJSDocInfo(method);
  
  // Extract parameters with enhanced information
  const parameters = method.getParameters().map(param => 
    typeResolver.extractParameterInfo(param, jsDocInfo.paramDescriptions)
  );
  
  // Extract return type information
  const returnType = method.getReturnTypeNode()?.getText();
  const resolvedReturnType = typeResolver.resolveFullType(method.getReturnTypeNode());
  
  // Extract generic parameters
  const genericParameters = typeResolver.resolveGenericParameters(method);
  
  // Extract overloads
  const overloads = typeResolver.extractOverloads(method);
  
  const isStatic = !!method.getStaticKeyword();
  const isAbstract = typeResolver.isAbstract(method);
  
  let visibility: 'public' | 'private' | 'protected' = 'public';
  if (method.hasModifier(SyntaxKind.PrivateKeyword)) {
    visibility = 'private';
  } else if (method.hasModifier(SyntaxKind.ProtectedKeyword)) {
    visibility = 'protected';
  }
  
  return {
    name,
    location,
    parameters,
    returnType,
    resolvedReturnType,
    isStatic,
    visibility,
    genericParameters: genericParameters.length > 0 ? genericParameters : undefined,
    overloads: overloads.length > 0 ? overloads : undefined,
    jsdocDescription: jsDocInfo.description,
    isAbstract,
    isConstructor: false
  };
}

function extractConstructorSummary(constructor: ConstructorDeclaration, filePath: string, typeResolver: TypeResolver): MethodSummary {
  const name = 'constructor';
  const location = getLocation(constructor, filePath);
  
  // Extract JSDoc information
  const jsDocInfo = typeResolver.extractJSDocInfo(constructor);
  
  // Extract parameters with enhanced information
  const parameters = constructor.getParameters().map(param => 
    typeResolver.extractParameterInfo(param, jsDocInfo.paramDescriptions)
  );
  
  // Extract generic parameters
  const genericParameters = typeResolver.resolveGenericParameters(constructor);
  
  // Extract overloads
  const overloads = typeResolver.extractOverloads(constructor);
  
  let visibility: 'public' | 'private' | 'protected' = 'public';
  if (constructor.hasModifier(SyntaxKind.PrivateKeyword)) {
    visibility = 'private';
  } else if (constructor.hasModifier(SyntaxKind.ProtectedKeyword)) {
    visibility = 'protected';
  }
  
  return {
    name,
    location,
    parameters,
    returnType: 'void', // Constructors don't have explicit return types
    resolvedReturnType: 'void',
    isStatic: false,
    visibility,
    genericParameters: genericParameters.length > 0 ? genericParameters : undefined,
    overloads: overloads.length > 0 ? overloads : undefined,
    jsdocDescription: jsDocInfo.description,
    isAbstract: false,
    isConstructor: true
  };
}

function extractPropertySummary(property: PropertyDeclaration, filePath: string, typeResolver: TypeResolver): PropertySummary {
  const name = property.getName();
  const location = getLocation(property, filePath);
  const type = property.getTypeNode()?.getText();
  const isStatic = !!property.getStaticKeyword();
  
  let visibility: 'public' | 'private' | 'protected' = 'public';
  if (property.hasModifier(SyntaxKind.PrivateKeyword)) {
    visibility = 'private';
  } else if (property.hasModifier(SyntaxKind.ProtectedKeyword)) {
    visibility = 'protected';
  }
  
  return {
    name,
    location,
    type,
    isStatic,
    visibility
  };
}

// Calculate source lines of code for a class, excluding blank lines and comments
function calculateClassLOC(classDeclaration: ClassDeclaration): number {
  const start = classDeclaration.getStart();
  const end = classDeclaration.getEnd();
  const sourceFile = classDeclaration.getSourceFile();
  
  const startLinePos = sourceFile.getLineAndColumnAtPos(start);
  const endLinePos = sourceFile.getLineAndColumnAtPos(end);
  
  // Get the full text of the class
  const classText = classDeclaration.getFullText();
  const lines = classText.split('\n');
  
  // Count non-empty, non-comment-only lines
  let locCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines
    if (trimmed.length === 0) continue;
    // Skip comment-only lines (simple heuristic)
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
    locCount++;
  }
  
  return locCount;
}

function getLocation(node: any, filePath: string): CodeLocation {
  const start = node.getStart();
  const end = node.getEnd();
  const sourceFile = node.getSourceFile();
  const startLineAndColumn = sourceFile.getLineAndColumnAtPos(start);
  const endLineAndColumn = sourceFile.getLineAndColumnAtPos(end);
  
  return {
    file: filePath,
    line: startLineAndColumn.line,
    column: startLineAndColumn.column,
    endLine: endLineAndColumn.line
  };
}
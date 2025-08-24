import { SourceFile, InterfaceDeclaration, PropertySignature, MethodSignature, SyntaxKind } from 'ts-morph';
import { InterfaceSummary, PropertySummary, MethodSummary, CodeLocation } from '../models';
import { TypeResolver } from '../utils/typeResolver';

export function extractInterfaces(sourceFile: SourceFile): InterfaceSummary[] {
  const interfaces: InterfaceSummary[] = [];
  const typeChecker = sourceFile.getProject().getTypeChecker();
  const typeResolver = new TypeResolver(typeChecker);
  
  sourceFile.getInterfaces().forEach(interfaceDeclaration => {
    const interfaceSummary = extractInterfaceDeclaration(interfaceDeclaration, sourceFile.getFilePath(), typeResolver);
    interfaces.push(interfaceSummary);
  });
  
  return interfaces;
}

function extractInterfaceDeclaration(interfaceDeclaration: InterfaceDeclaration, filePath: string, typeResolver: TypeResolver): InterfaceSummary {
  const name = interfaceDeclaration.getName();
  const location = getLocation(interfaceDeclaration, filePath);
  
  // Extract JSDoc information
  const jsDocInfo = typeResolver.extractJSDocInfo(interfaceDeclaration);
  
  // Extract properties
  const properties = interfaceDeclaration.getProperties().map(property => 
    extractPropertySignature(property, filePath, typeResolver)
  );
  
  // Extract method signatures
  const methods = interfaceDeclaration.getMethods().map(method => 
    extractMethodSignature(method, filePath, typeResolver)
  );
  
  // Extract generic parameters
  const genericParameters = interfaceDeclaration.getTypeParameters().map(param => ({
    name: param.getName(),
    constraint: param.getConstraint()?.getText(),
    defaultType: param.getDefault()?.getText()
  }));
  
  const extendsClauses = interfaceDeclaration.getExtends();
  const extendsTypes = extendsClauses.map(clause => clause.getText());
  
  return {
    name,
    location,
    properties,
    methods,
    extends: extendsTypes.length > 0 ? extendsTypes : undefined,
    genericParameters: genericParameters.length > 0 ? genericParameters : undefined,
    jsdocDescription: jsDocInfo.description
  };
}

function extractMethodSignature(method: MethodSignature, filePath: string, typeResolver: TypeResolver): MethodSummary {
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
  const genericParameters = method.getTypeParameters().map(param => ({
    name: param.getName(),
    constraint: param.getConstraint()?.getText(),
    defaultType: param.getDefault()?.getText()
  }));
  
  return {
    name,
    location,
    parameters,
    returnType,
    resolvedReturnType,
    isStatic: false,
    visibility: 'public',
    genericParameters: genericParameters.length > 0 ? genericParameters : undefined,
    jsdocDescription: jsDocInfo.description,
    isAbstract: false,
    isConstructor: false
  };
}

function extractPropertySignature(property: PropertySignature, filePath: string, typeResolver: TypeResolver): PropertySummary {
  const name = property.getName();
  const location = getLocation(property, filePath);
  const type = property.getTypeNode()?.getText();
  
  return {
    name,
    location,
    type,
    isStatic: false,
    visibility: 'public'
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
import { SourceFile, SyntaxKind, InterfaceDeclaration, TypeAliasDeclaration, EnumDeclaration, ImportDeclaration, ImportSpecifier } from 'ts-morph';
import { TypeCatalogEntry, TypeCatalog, CodeLocation, GenericParameter } from '../models';
import { TypeResolver } from '../utils/typeResolver';
import { createHash } from 'crypto';
import path from 'path';

export function extractTypeCatalog(sourceFile: SourceFile, projectRoot: string): TypeCatalogEntry[] {
  const typeChecker = sourceFile.getProject().getTypeChecker();
  const typeResolver = new TypeResolver(typeChecker);
  const entries: TypeCatalogEntry[] = [];
  const filePath = sourceFile.getFilePath();
  const relativePath = path.relative(projectRoot, filePath);
  const filename = path.basename(filePath);

  // Extract local interfaces
  sourceFile.getInterfaces().forEach(interfaceDecl => {
    const entry = extractInterfaceEntry(interfaceDecl, filePath, relativePath, filename, typeResolver);
    entries.push(entry);
  });

  // Extract local type aliases
  sourceFile.getTypeAliases().forEach(typeAlias => {
    const entry = extractTypeAliasEntry(typeAlias, filePath, relativePath, filename, typeResolver);
    entries.push(entry);
  });

  // Extract local enums
  sourceFile.getEnums().forEach(enumDecl => {
    const entry = extractEnumEntry(enumDecl, filePath, relativePath, filename, typeResolver);
    entries.push(entry);
  });

  // Extract imported types
  sourceFile.getImportDeclarations().forEach(importDecl => {
    const importEntries = extractImportedTypes(importDecl, filePath, relativePath, filename, sourceFile);
    entries.push(...importEntries);
  });

  return entries;
}

function extractInterfaceEntry(
  interfaceDecl: InterfaceDeclaration, 
  filePath: string, 
  relativePath: string, 
  filename: string, 
  typeResolver: TypeResolver
): TypeCatalogEntry {
  const name = interfaceDecl.getName();
  const location = getLocation(interfaceDecl, relativePath);
  const id = generateTypeId(name, filePath, location);
  
  // Extract extends relationships
  const extends_ = interfaceDecl.getExtends().map(ext => ext.getText());
  
  // Extract generic parameters
  const genericParameters = typeResolver.resolveGenericParameters(interfaceDecl as any);
  
  // Extract JSDoc
  const jsdocInfo = typeResolver.extractJSDocInfo(interfaceDecl);
  
  // Build definition string
  const definition = buildInterfaceDefinition(interfaceDecl);

  return {
    id,
    name,
    kind: 'interface',
    definition,
    fullPath: filePath,
    filename,
    location,
    isLocal: true,
    genericParameters,
    extends: extends_.length > 0 ? extends_ : undefined,
    jsdocDescription: jsdocInfo.description
  };
}

function extractTypeAliasEntry(
  typeAlias: TypeAliasDeclaration, 
  filePath: string, 
  relativePath: string, 
  filename: string, 
  typeResolver: TypeResolver
): TypeCatalogEntry {
  const name = typeAlias.getName();
  const location = getLocation(typeAlias, relativePath);
  const id = generateTypeId(name, filePath, location);
  
  // Extract generic parameters
  const genericParameters = typeResolver.resolveGenericParameters(typeAlias as any);
  
  // Extract JSDoc
  const jsdocInfo = typeResolver.extractJSDocInfo(typeAlias);
  
  // Get type definition
  const typeNode = typeAlias.getTypeNode();
  const definition = typeNode ? typeNode.getText() : typeAlias.getText();
  
  // Detect union and intersection types
  const unionTypes = extractUnionTypes(definition);
  const intersectionTypes = extractIntersectionTypes(definition);

  return {
    id,
    name,
    kind: 'type',
    definition,
    fullPath: filePath,
    filename,
    location,
    isLocal: true,
    genericParameters,
    unionTypes: unionTypes.length > 0 ? unionTypes : undefined,
    intersectionTypes: intersectionTypes.length > 0 ? intersectionTypes : undefined,
    jsdocDescription: jsdocInfo.description
  };
}

function extractEnumEntry(
  enumDecl: EnumDeclaration, 
  filePath: string, 
  relativePath: string, 
  filename: string, 
  typeResolver: TypeResolver
): TypeCatalogEntry {
  const name = enumDecl.getName();
  const location = getLocation(enumDecl, relativePath);
  const id = generateTypeId(name, filePath, location);
  
  // Extract JSDoc
  const jsdocInfo = typeResolver.extractJSDocInfo(enumDecl);
  
  // Build enum definition
  const definition = buildEnumDefinition(enumDecl);

  return {
    id,
    name,
    kind: 'enum',
    definition,
    fullPath: filePath,
    filename,
    location,
    isLocal: true,
    jsdocDescription: jsdocInfo.description
  };
}

function extractImportedTypes(
  importDecl: ImportDeclaration, 
  filePath: string, 
  relativePath: string, 
  filename: string, 
  sourceFile: SourceFile
): TypeCatalogEntry[] {
  const entries: TypeCatalogEntry[] = [];
  const moduleSpecifier = importDecl.getModuleSpecifierValue();
  
  if (!moduleSpecifier) return entries;
  
  const isNodeModule = !moduleSpecifier.startsWith('.') && !moduleSpecifier.startsWith('/');
  const location = getLocation(importDecl, relativePath);
  
  // Extract named imports
  const namedImports = importDecl.getNamedImports();
  namedImports.forEach(namedImport => {
    const importedName = namedImport.getName();
    
    // Try to resolve the actual type definition
    const resolvedPath = resolveImportPath(moduleSpecifier, filePath, isNodeModule);
    
    // For imported types, generate consistent ID based on name and module, not import location
    const id = generateImportedTypeId(importedName, resolvedPath || moduleSpecifier);
    
    entries.push({
      id,
      name: importedName,
      kind: 'import',
      definition: `import { ${importedName} } from '${moduleSpecifier}'`,
      fullPath: resolvedPath || moduleSpecifier,
      filename: path.basename(resolvedPath || moduleSpecifier),
      location,
      sourceFile: filePath,
      isLocal: !isNodeModule
    });
  });
  
  // Extract default import
  const defaultImport = importDecl.getDefaultImport();
  if (defaultImport) {
    const importedName = defaultImport.getText();
    const resolvedPath = resolveImportPath(moduleSpecifier, filePath, isNodeModule);
    // For imported types, generate consistent ID based on name and module, not import location
    const id = generateImportedTypeId(importedName, resolvedPath || moduleSpecifier);
    
    entries.push({
      id,
      name: importedName,
      kind: 'import',
      definition: `import ${importedName} from '${moduleSpecifier}'`,
      fullPath: resolvedPath || moduleSpecifier,
      filename: path.basename(resolvedPath || moduleSpecifier),
      location,
      sourceFile: filePath,
      isLocal: !isNodeModule
    });
  }
  
  return entries;
}

function buildInterfaceDefinition(interfaceDecl: InterfaceDeclaration): string {
  const name = interfaceDecl.getName();
  const typeParams = interfaceDecl.getTypeParameters().map(tp => tp.getText()).join(', ');
  const extends_ = interfaceDecl.getExtends().map(ext => ext.getText()).join(', ');
  
  let definition = `interface ${name}`;
  if (typeParams) definition += `<${typeParams}>`;
  if (extends_) definition += ` extends ${extends_}`;
  
  // Include properties for a more complete definition
  const properties = interfaceDecl.getProperties().map(prop => {
    const propName = prop.getName();
    const propType = prop.getTypeNode()?.getText() || 'any';
    const optional = prop.hasQuestionToken() ? '?' : '';
    return `  ${propName}${optional}: ${propType};`;
  }).join('\n');
  
  definition += ` {\n${properties}\n}`;
  
  return definition;
}

function buildEnumDefinition(enumDecl: EnumDeclaration): string {
  const name = enumDecl.getName();
  const members = enumDecl.getMembers().map(member => {
    const memberName = member.getName();
    const initializer = member.getInitializer();
    return initializer ? `  ${memberName} = ${initializer.getText()}` : `  ${memberName}`;
  }).join(',\n');
  
  return `enum ${name} {\n${members}\n}`;
}

function extractUnionTypes(definition: string): string[] {
  const unionPattern = /([^|&]+)/g;
  const matches = definition.match(unionPattern);
  if (!matches || !definition.includes('|')) return [];
  
  return matches
    .map(match => match.trim())
    .filter(match => match.length > 0)
    .slice(0, 10); // Limit to prevent massive arrays
}

function extractIntersectionTypes(definition: string): string[] {
  const intersectionPattern = /([^|&]+)/g;
  const matches = definition.match(intersectionPattern);
  if (!matches || !definition.includes('&')) return [];
  
  return matches
    .map(match => match.trim())
    .filter(match => match.length > 0)
    .slice(0, 10); // Limit to prevent massive arrays
}

function resolveImportPath(moduleSpecifier: string, currentFilePath: string, isNodeModule: boolean): string | null {
  if (isNodeModule) {
    // For node modules, return a standardized path
    return `node_modules/${moduleSpecifier}`;
  }
  
  // For relative imports, resolve the path
  const currentDir = path.dirname(currentFilePath);
  return path.resolve(currentDir, moduleSpecifier);
}

function generateTypeId(name: string, filePath: string, location: CodeLocation): string {
  const content = `${name}:${filePath}:${location.line}:${location.column}`;
  return createHash('sha256').update(content).digest('hex').substring(0, 12);
}

function generateImportedTypeId(name: string, modulePath: string): string {
  // For imported types, generate consistent ID based only on name and module source
  const content = `imported:${name}:${modulePath}`;
  return createHash('sha256').update(content).digest('hex').substring(0, 12);
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

export function buildTypeCatalog(entries: TypeCatalogEntry[]): TypeCatalog {
  const entryMap = new Map<string, TypeCatalogEntry>();
  
  entries.forEach(entry => {
    entryMap.set(entry.id, entry);
  });
  
  // Use deduplicated entries from the map
  const deduplicatedEntries = Array.from(entryMap.values());
  
  return {
    entries: deduplicatedEntries,
    entryMap
  };
}
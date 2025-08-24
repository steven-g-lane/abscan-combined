import { SourceFile, FunctionDeclaration, VariableDeclaration, ClassDeclaration, SyntaxKind } from 'ts-morph';
import { ReactComponentSummary, CodeLocation } from '../models';

export function extractReactComponents(sourceFile: SourceFile): ReactComponentSummary[] {
  const components: ReactComponentSummary[] = [];
  
  // Check for React import or JSX usage to determine if this is a React file
  const hasReactImport = sourceFile.getImportDeclarations().some(imp => 
    imp.getModuleSpecifierValue() === 'react' || 
    imp.getModuleSpecifierValue().includes('react')
  );
  
  const hasJSXElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 ||
                        sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0;
  
  if (!hasReactImport && !hasJSXElements) {
    return components;
  }
  
  // Extract function components
  sourceFile.getFunctions().forEach(func => {
    const component = extractFunctionComponent(func, sourceFile.getFilePath());
    if (component) {
      components.push(component);
    }
  });
  
  // Extract arrow function components
  sourceFile.getVariableDeclarations().forEach(variable => {
    const component = extractVariableComponent(variable, sourceFile.getFilePath());
    if (component) {
      components.push(component);
    }
  });
  
  // Extract class components
  sourceFile.getClasses().forEach(cls => {
    const component = extractClassComponent(cls, sourceFile.getFilePath());
    if (component) {
      components.push(component);
    }
  });
  
  return components;
}

function extractFunctionComponent(func: FunctionDeclaration, filePath: string): ReactComponentSummary | null {
  const name = func.getName();
  if (!name) return null;
  
  // Check if function returns JSX
  if (!returnsJSX(func)) return null;
  
  const location = getLocation(func, filePath);
  const propsType = extractPropsType(func);
  
  return {
    name,
    location,
    type: 'function',
    propsType
  };
}

function extractVariableComponent(variable: VariableDeclaration, filePath: string): ReactComponentSummary | null {
  const initializer = variable.getInitializer();
  if (!initializer) return null;
  
  // Check if it's an arrow function
  if (initializer.getKind() !== SyntaxKind.ArrowFunction) return null;
  
  const name = variable.getName();
  
  // Check if the arrow function returns JSX
  if (!returnsJSX(initializer as any)) return null;
  
  const location = getLocation(variable, filePath);
  const propsType = extractPropsTypeFromArrowFunction(initializer as any);
  
  return {
    name,
    location,
    type: 'function',
    propsType
  };
}

function extractClassComponent(cls: ClassDeclaration, filePath: string): ReactComponentSummary | null {
  const name = cls.getName();
  if (!name) return null;
  
  // Check if class extends React.Component or Component
  const extendsClause = cls.getExtends();
  if (!extendsClause) return null;
  
  const extendsText = extendsClause.getText();
  const isReactComponent = extendsText.includes('Component') || 
                          extendsText.includes('React.Component') ||
                          extendsText.includes('PureComponent');
  
  if (!isReactComponent) return null;
  
  const location = getLocation(cls, filePath);
  const propsType = extractPropsTypeFromClass(cls);
  
  return {
    name,
    location,
    type: 'class',
    propsType
  };
}

function returnsJSX(node: any): boolean {
  // Look for JSX elements in the function body
  const jsxElements = node.getDescendantsOfKind(SyntaxKind.JsxElement);
  const jsxSelfClosing = node.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
  const jsxFragments = node.getDescendantsOfKind(SyntaxKind.JsxFragment);
  
  return jsxElements.length > 0 || jsxSelfClosing.length > 0 || jsxFragments.length > 0;
}

function extractPropsType(func: FunctionDeclaration): string | undefined {
  const parameters = func.getParameters();
  if (parameters.length === 0) return undefined;
  
  const propsParam = parameters[0];
  const typeNode = propsParam.getTypeNode();
  return typeNode?.getText();
}

function extractPropsTypeFromArrowFunction(arrowFunc: any): string | undefined {
  const parameters = arrowFunc.getParameters?.();
  if (!parameters || parameters.length === 0) return undefined;
  
  const propsParam = parameters[0];
  const typeNode = propsParam.getTypeNode?.();
  return typeNode?.getText();
}

function extractPropsTypeFromClass(cls: ClassDeclaration): string | undefined {
  const typeArgs = cls.getExtends()?.getTypeArguments();
  if (typeArgs && typeArgs.length > 0) {
    return typeArgs[0].getText();
  }
  return undefined;
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
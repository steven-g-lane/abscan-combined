import { 
  Node, 
  TypeNode, 
  FunctionDeclaration, 
  MethodDeclaration, 
  ParameterDeclaration, 
  JSDoc,
  TypeParameterDeclaration,
  ConstructorDeclaration,
  Type,
  TypeChecker,
  SyntaxKind
} from 'ts-morph';
import { ParameterSummary, GenericParameter, FunctionOverload } from '../models';

export class TypeResolver {
  constructor(private typeChecker: TypeChecker) {}

  /**
   * Resolves the full type text for a TypeNode, handling complex types
   */
  resolveFullType(typeNode: TypeNode | undefined): string | undefined {
    if (!typeNode) return undefined;

    try {
      // Get the type from the type checker for better resolution
      const type = typeNode.getType();
      const typeText = type.getSymbol()?.getFullyQualifiedName() || typeNode.getText();
      
      // Handle specific type kinds for better formatting
      return this.formatTypeText(typeText, type);
    } catch {
      // Fallback to basic text if type checking fails
      return typeNode.getText();
    }
  }

  /**
   * Extracts generic parameters from a function or method
   */
  resolveGenericParameters(node: FunctionDeclaration | MethodDeclaration | ConstructorDeclaration): GenericParameter[] {
    const typeParams = node.getTypeParameters();
    return typeParams.map(param => this.extractGenericParameter(param));
  }

  /**
   * Extracts JSDoc information from a node
   */
  extractJSDocInfo(node: Node): { description?: string; paramDescriptions: Map<string, string> } {
    const jsDocs = node.getChildrenOfKind(SyntaxKind.JSDocComment);
    const paramDescriptions = new Map<string, string>();
    let description: string | undefined;

    for (const jsDoc of jsDocs) {
      // Extract main description
      const comment = jsDoc.getComment();
      if (comment && !description) {
        description = typeof comment === 'string' ? comment : comment.map(c => c?.getText() || '').join('');
      }

      // Extract parameter descriptions
      const tags = jsDoc.getTags();
      for (const tag of tags) {
        if (tag.getTagName() === 'param') {
          const tagText = tag.getText();
          const paramMatch = tagText.match(/@param\s+(\w+)\s+(.+)/);
          if (paramMatch) {
            paramDescriptions.set(paramMatch[1], paramMatch[2].trim());
          }
        }
      }
    }

    return { description, paramDescriptions };
  }

  /**
   * Extracts default value from a parameter
   */
  getDefaultValue(parameter: ParameterDeclaration): string | undefined {
    const initializer = parameter.getInitializer();
    return initializer?.getText();
  }

  /**
   * Extracts enhanced parameter information
   */
  extractParameterInfo(
    parameter: ParameterDeclaration, 
    paramDescriptions: Map<string, string>
  ): ParameterSummary {
    const name = parameter.getName();
    const typeNode = parameter.getTypeNode();
    const type = this.resolveFullType(typeNode);
    const optional = parameter.hasQuestionToken();
    const defaultValue = this.getDefaultValue(parameter);
    const isRest = parameter.isRestParameter();
    const description = paramDescriptions.get(name);

    return {
      name,
      type,
      optional,
      defaultValue,
      isRest,
      description
    };
  }

  /**
   * Extracts function overloads
   */
  extractOverloads(node: FunctionDeclaration | MethodDeclaration | ConstructorDeclaration): FunctionOverload[] {
    // Check if this node has overloads
    const symbol = node.getSymbol();
    if (!symbol) return [];

    const declarations = symbol.getDeclarations();
    const overloads: FunctionOverload[] = [];

    for (const decl of declarations) {
      if (decl === node) continue; // Skip the implementation

      if (Node.isFunctionDeclaration(decl) || Node.isMethodDeclaration(decl) || Node.isConstructorDeclaration(decl)) {
        const jsDocInfo = this.extractJSDocInfo(decl);
        const parameters = decl.getParameters().map(param => 
          this.extractParameterInfo(param, jsDocInfo.paramDescriptions)
        );
        const returnType = Node.isConstructorDeclaration(decl) ? 'void' : this.resolveFullType(decl.getReturnTypeNode());

        overloads.push({
          parameters,
          returnType,
          description: jsDocInfo.description
        });
      }
    }

    return overloads;
  }

  /**
   * Resolves type aliases to their definitions
   */
  resolveTypeAliases(type: Type): string {
    const symbol = type.getSymbol();
    if (!symbol) return type.getText();

    // Check if this is a type alias
    const aliasSymbol = type.getAliasSymbol();
    if (aliasSymbol) {
      const declarations = aliasSymbol.getDeclarations();
      for (const decl of declarations) {
        if (Node.isTypeAliasDeclaration(decl)) {
          return decl.getTypeNode()?.getText() || type.getText();
        }
      }
    }

    return type.getText();
  }

  /**
   * Checks if a method/function is abstract
   */
  isAbstract(node: MethodDeclaration): boolean {
    return node.hasModifier(SyntaxKind.AbstractKeyword);
  }

  /**
   * Checks if a node is a constructor
   */
  isConstructor(node: MethodDeclaration | ConstructorDeclaration): boolean {
    return Node.isConstructorDeclaration(node) || 
           (Node.isMethodDeclaration(node) && node.getName() === 'constructor');
  }

  private extractGenericParameter(param: TypeParameterDeclaration): GenericParameter {
    const name = param.getName();
    const constraint = param.getConstraint()?.getText();
    const defaultType = param.getDefault()?.getText();

    return {
      name,
      constraint,
      defaultType
    };
  }

  private formatTypeText(typeText: string, type: Type): string {
    // Handle union types
    if (type.isUnion()) {
      const unionTypes = type.getUnionTypes();
      return unionTypes.map(t => t.getText()).join(' | ');
    }

    // Handle intersection types
    if (type.isIntersection()) {
      const intersectionTypes = type.getIntersectionTypes();
      return intersectionTypes.map(t => t.getText()).join(' & ');
    }

    // Handle array types
    if (type.isArray()) {
      const elementType = type.getArrayElementType();
      return `${elementType?.getText() || 'unknown'}[]`;
    }

    // Handle generic types
    const typeArgs = type.getTypeArguments();
    if (typeArgs.length > 0) {
      const baseType = typeText.split('<')[0];
      const args = typeArgs.map(arg => arg.getText()).join(', ');
      return `${baseType}<${args}>`;
    }

    return typeText;
  }
}
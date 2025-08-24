import { 
  SourceFile, 
  Node, 
  SyntaxKind, 
  TypeNode,
  FunctionDeclaration,
  MethodDeclaration,
  ParameterDeclaration,
  VariableDeclaration,
  PropertyDeclaration,
  PropertySignature,
  InterfaceDeclaration,
  ClassDeclaration,
  TypeAliasDeclaration,
  TypeReferenceNode,
  Identifier
} from 'ts-morph';
import { TypeUsageReference, TypeCatalog, CodeLocation } from '../models';
import { createHash } from 'crypto';
import path from 'path';

export class TypeReferenceTracker {
  private allReferences: TypeUsageReference[] = [];

  /**
   * Track all type usage references across a source file
   */
  trackReferences(sourceFile: SourceFile, typeCatalog: TypeCatalog, projectRoot: string): TypeUsageReference[] {
    const fileReferences: TypeUsageReference[] = [];
    const filePath = sourceFile.getFilePath();
    const relativePath = path.relative(projectRoot, filePath);

    // Track type references in function parameters
    this.trackFunctionParameterReferences(sourceFile, typeCatalog, relativePath, fileReferences);
    
    // Track type references in function return types
    this.trackFunctionReturnTypeReferences(sourceFile, typeCatalog, relativePath, fileReferences);
    
    // Track type references in variable declarations
    this.trackVariableTypeReferences(sourceFile, typeCatalog, relativePath, fileReferences);
    
    // Track type references in class properties
    this.trackClassPropertyReferences(sourceFile, typeCatalog, relativePath, fileReferences);
    
    // Track type references in interface properties
    this.trackInterfacePropertyReferences(sourceFile, typeCatalog, relativePath, fileReferences);
    
    // Track type references in generic constraints
    this.trackGenericTypeReferences(sourceFile, typeCatalog, relativePath, fileReferences);
    
    // Track type references in extends/implements clauses
    this.trackInheritanceReferences(sourceFile, typeCatalog, relativePath, fileReferences);

    this.allReferences.push(...fileReferences);
    return fileReferences;
  }

  private trackFunctionParameterReferences(
    sourceFile: SourceFile,
    typeCatalog: TypeCatalog,
    relativePath: string,
    references: TypeUsageReference[]
  ): void {
    // Track function declaration parameters
    sourceFile.getFunctions().forEach(func => {
      func.getParameters().forEach(param => {
        this.trackParameterTypeReference(param, func.getName() || 'anonymous', typeCatalog, relativePath, references);
      });
    });

    // Track method parameters in classes
    sourceFile.getClasses().forEach(cls => {
      cls.getMethods().forEach(method => {
        method.getParameters().forEach(param => {
          this.trackParameterTypeReference(
            param, 
            `${cls.getName()}.${method.getName()}`, 
            typeCatalog, 
            relativePath, 
            references
          );
        });
      });

      // Track constructor parameters
      cls.getConstructors().forEach(constructor => {
        constructor.getParameters().forEach(param => {
          this.trackParameterTypeReference(
            param,
            `${cls.getName()}.constructor`,
            typeCatalog,
            relativePath,
            references
          );
        });
      });
    });

    // Track method parameters in interfaces
    sourceFile.getInterfaces().forEach(iface => {
      iface.getMethods().forEach(method => {
        method.getParameters().forEach(param => {
          this.trackParameterTypeReference(
            param,
            `${iface.getName()}.${method.getName()}`,
            typeCatalog,
            relativePath,
            references
          );
        });
      });
    });
  }

  private trackFunctionReturnTypeReferences(
    sourceFile: SourceFile,
    typeCatalog: TypeCatalog,
    relativePath: string,
    references: TypeUsageReference[]
  ): void {
    // Track function return types
    sourceFile.getFunctions().forEach(func => {
      const returnTypeNode = func.getReturnTypeNode();
      if (returnTypeNode) {
        this.trackTypeNodeReference(
          returnTypeNode,
          'return',
          func.getName() || 'anonymous',
          typeCatalog,
          relativePath,
          references
        );
      }
    });

    // Track method return types
    sourceFile.getClasses().forEach(cls => {
      cls.getMethods().forEach(method => {
        const returnTypeNode = method.getReturnTypeNode();
        if (returnTypeNode) {
          this.trackTypeNodeReference(
            returnTypeNode,
            'return',
            `${cls.getName()}.${method.getName()}`,
            typeCatalog,
            relativePath,
            references
          );
        }
      });
    });

    // Track interface method return types
    sourceFile.getInterfaces().forEach(iface => {
      iface.getMethods().forEach(method => {
        const returnTypeNode = method.getReturnTypeNode();
        if (returnTypeNode) {
          this.trackTypeNodeReference(
            returnTypeNode,
            'return',
            `${iface.getName()}.${method.getName()}`,
            typeCatalog,
            relativePath,
            references
          );
        }
      });
    });
  }

  private trackVariableTypeReferences(
    sourceFile: SourceFile,
    typeCatalog: TypeCatalog,
    relativePath: string,
    references: TypeUsageReference[]
  ): void {
    sourceFile.getVariableDeclarations().forEach(variable => {
      const typeNode = variable.getTypeNode();
      if (typeNode) {
        this.trackTypeNodeReference(
          typeNode,
          'variable',
          variable.getName(),
          typeCatalog,
          relativePath,
          references
        );
      }
    });
  }

  private trackClassPropertyReferences(
    sourceFile: SourceFile,
    typeCatalog: TypeCatalog,
    relativePath: string,
    references: TypeUsageReference[]
  ): void {
    sourceFile.getClasses().forEach(cls => {
      cls.getProperties().forEach(prop => {
        const typeNode = prop.getTypeNode();
        if (typeNode) {
          this.trackTypeNodeReference(
            typeNode,
            'property',
            `${cls.getName()}.${prop.getName()}`,
            typeCatalog,
            relativePath,
            references
          );
        }
      });
    });
  }

  private trackInterfacePropertyReferences(
    sourceFile: SourceFile,
    typeCatalog: TypeCatalog,
    relativePath: string,
    references: TypeUsageReference[]
  ): void {
    sourceFile.getInterfaces().forEach(iface => {
      iface.getProperties().forEach(prop => {
        const typeNode = prop.getTypeNode();
        if (typeNode) {
          this.trackTypeNodeReference(
            typeNode,
            'property',
            `${iface.getName()}.${prop.getName()}`,
            typeCatalog,
            relativePath,
            references
          );
        }
      });
    });
  }

  private trackGenericTypeReferences(
    sourceFile: SourceFile,
    typeCatalog: TypeCatalog,
    relativePath: string,
    references: TypeUsageReference[]
  ): void {
    // Track generic constraints in functions
    sourceFile.getFunctions().forEach(func => {
      func.getTypeParameters().forEach(typeParam => {
        const constraint = typeParam.getConstraint();
        if (constraint) {
          this.trackTypeNodeReference(
            constraint,
            'generic',
            `${func.getName()}<${typeParam.getName()}>`,
            typeCatalog,
            relativePath,
            references
          );
        }
      });
    });

    // Track generic constraints in classes
    sourceFile.getClasses().forEach(cls => {
      cls.getTypeParameters().forEach(typeParam => {
        const constraint = typeParam.getConstraint();
        if (constraint) {
          this.trackTypeNodeReference(
            constraint,
            'generic',
            `${cls.getName()}<${typeParam.getName()}>`,
            typeCatalog,
            relativePath,
            references
          );
        }
      });
    });

    // Track generic constraints in interfaces
    sourceFile.getInterfaces().forEach(iface => {
      iface.getTypeParameters().forEach(typeParam => {
        const constraint = typeParam.getConstraint();
        if (constraint) {
          this.trackTypeNodeReference(
            constraint,
            'generic',
            `${iface.getName()}<${typeParam.getName()}>`,
            typeCatalog,
            relativePath,
            references
          );
        }
      });
    });
  }

  private trackInheritanceReferences(
    sourceFile: SourceFile,
    typeCatalog: TypeCatalog,
    relativePath: string,
    references: TypeUsageReference[]
  ): void {
    // Track class extends
    sourceFile.getClasses().forEach(cls => {
      const extendsClause = cls.getExtends();
      if (extendsClause) {
        this.trackTypeNodeReference(
          extendsClause,
          'extends',
          cls.getName() || 'anonymous',
          typeCatalog,
          relativePath,
          references
        );
      }

      // Track class implements
      cls.getImplements().forEach(impl => {
        this.trackTypeNodeReference(
          impl,
          'implements',
          cls.getName() || 'anonymous',
          typeCatalog,
          relativePath,
          references
        );
      });
    });

    // Track interface extends
    sourceFile.getInterfaces().forEach(iface => {
      iface.getExtends().forEach(ext => {
        this.trackTypeNodeReference(
          ext,
          'extends',
          iface.getName(),
          typeCatalog,
          relativePath,
          references
        );
      });
    });
  }

  private trackParameterTypeReference(
    param: ParameterDeclaration,
    functionContext: string,
    typeCatalog: TypeCatalog,
    relativePath: string,
    references: TypeUsageReference[]
  ): void {
    const typeNode = param.getTypeNode();
    if (typeNode) {
      this.trackTypeNodeReference(
        typeNode,
        'parameter',
        `${functionContext}(${param.getName()})`,
        typeCatalog,
        relativePath,
        references
      );
    }
  }

  private trackTypeNodeReference(
    typeNode: TypeNode,
    context: TypeUsageReference['context'],
    contextDetails: string,
    typeCatalog: TypeCatalog,
    relativePath: string,
    references: TypeUsageReference[]
  ): void {
    const typeText = typeNode.getText();
    const location = this.getLocation(typeNode, relativePath);
    
    // Find matching type in catalog
    const matchingTypes = this.findMatchingTypes(typeText, typeCatalog);
    
    matchingTypes.forEach(typeEntry => {
      const reference: TypeUsageReference = {
        id: this.generateReferenceId(typeEntry.id, location),
        typeId: typeEntry.id,
        location,
        context,
        contextDetails,
        usageType: typeEntry.isLocal ? 'local' : 'imported',
        sourceText: typeText
      };
      
      references.push(reference);
    });
  }

  private findMatchingTypes(typeText: string, typeCatalog: TypeCatalog): any[] {
    const matches: any[] = [];
    
    // Simple type name matching (e.g., "string", "ProjectSummary")
    const simpleTypeName = this.extractSimpleTypeName(typeText);
    
    for (const entry of typeCatalog.entries) {
      if (entry.name === simpleTypeName || entry.name === typeText) {
        matches.push(entry);
      }
    }
    
    return matches;
  }

  private extractSimpleTypeName(typeText: string): string {
    // Extract simple type name from complex types like "Promise<ProjectSummary>"
    const match = typeText.match(/(\w+)(?:<.*>)?/);
    return match ? match[1] : typeText;
  }

  private generateReferenceId(typeId: string, location: CodeLocation): string {
    const content = `${typeId}:${location.file}:${location.line}:${location.column}`;
    return createHash('sha256').update(content).digest('hex').substring(0, 8);
  }

  private getLocation(node: Node, filePath: string): CodeLocation {
    const start = node.getStart();
    const sourceFile = node.getSourceFile();
    const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
    
    return {
      file: filePath,
      line: lineAndColumn.line,
      column: lineAndColumn.column
    };
  }

  /**
   * Get all tracked references
   */
  getAllReferences(): TypeUsageReference[] {
    return this.allReferences;
  }

  /**
   * Clear all tracked references
   */
  clearReferences(): void {
    this.allReferences = [];
  }
}
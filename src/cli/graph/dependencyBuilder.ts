import { ProjectSummary, DependencyGraph, DefinitionNode, ReferenceNode } from '../models';
import { Project, SourceFile, Identifier, SyntaxKind } from 'ts-morph';
import path from 'path';

export function buildDependencyGraph(summary: ProjectSummary): DependencyGraph {
  const definitions: DefinitionNode[] = [];
  const references: ReferenceNode[] = [];

  // Create a map of definitions for quick lookup
  const definitionMap = new Map<string, DefinitionNode>();

  // First pass: collect all definitions
  summary.files.forEach(file => {
    file.exports.classes?.forEach(cls => {
      const classId = `${file.path}:${cls.name}`;
      const definition = {
        id: classId,
        kind: 'class' as const,
        name: cls.name,
        location: cls.location
      };
      definitions.push(definition);
      definitionMap.set(cls.name, definition);

      cls.methods.forEach(method => {
        const methodId = `${classId}.${method.name}`;
        const methodDef = {
          id: methodId,
          kind: 'method' as const,
          name: method.name,
          parent: classId,
          location: method.location
        };
        definitions.push(methodDef);
        definitionMap.set(`${cls.name}.${method.name}`, methodDef);
      });
    });

    file.exports.functions?.forEach(fn => {
      const functionId = `${file.path}:${fn.name}`;
      const definition = {
        id: functionId,
        kind: 'function' as const,
        name: fn.name,
        location: fn.location
      };
      definitions.push(definition);
      definitionMap.set(fn.name, definition);
    });

    file.exports.interfaces?.forEach(iface => {
      const interfaceId = `${file.path}:${iface.name}`;
      const definition = {
        id: interfaceId,
        kind: 'interface' as const,
        name: iface.name,
        location: iface.location
      };
      definitions.push(definition);
      definitionMap.set(iface.name, definition);
    });

    file.exports.types?.forEach(type => {
      const typeId = `${file.path}:${type.name}`;
      const definition = {
        id: typeId,
        kind: 'type' as const,
        name: type.name,
        location: type.location
      };
      definitions.push(definition);
      definitionMap.set(type.name, definition);
    });

    file.exports.components?.forEach(comp => {
      const componentId = `${file.path}:${comp.name}`;
      const definition = {
        id: componentId,
        kind: 'component' as const,
        name: comp.name,
        location: comp.location
      };
      definitions.push(definition);
      definitionMap.set(comp.name, definition);
    });
  });

  // Second pass: find references using ts-morph
  const project = new Project({ useInMemoryFileSystem: false });
  
  summary.files.forEach(file => {
    try {
      const absolutePath = file.path.startsWith('/') ? file.path : 
        path.join(summary.projectRoot, file.path);
      const sourceFile = project.addSourceFileAtPath(absolutePath);
      const fileReferences = findReferences(sourceFile, definitionMap);
      references.push(...fileReferences);
    } catch (error) {
      // Skip files that can't be parsed
      console.warn(`Warning: Could not analyze references in ${file.path}:`, error);
    }
  });

  return { definitions, references };
}

function findReferences(sourceFile: SourceFile, definitionMap: Map<string, DefinitionNode>): ReferenceNode[] {
  const references: ReferenceNode[] = [];
  
  // Find all identifiers in the file
  sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).forEach(identifier => {
    const name = identifier.getText();
    
    // Check if this identifier references a known definition
    const definition = definitionMap.get(name);
    if (definition) {
      const parent = identifier.getParent();
      let context: "call" | "import" | "extends" | "usage" = "usage";
      
      // Determine context based on parent node
      if (parent) {
        switch (parent.getKind()) {
          case SyntaxKind.CallExpression:
            context = "call";
            break;
          case SyntaxKind.ImportSpecifier:
          case SyntaxKind.ImportClause:
            context = "import";
            break;
          case SyntaxKind.HeritageClause:
            context = "extends";
            break;
          default:
            context = "usage";
        }
      }
      
      const start = identifier.getStart();
      const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
      
      references.push({
        targetId: definition.id,
        context,
        location: {
          file: sourceFile.getFilePath(),
          line: lineAndColumn.line,
          column: lineAndColumn.column
        }
      });
    }
  });
  
  return references;
}
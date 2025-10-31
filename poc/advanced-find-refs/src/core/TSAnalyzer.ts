// src/core/TSAnalyzer.ts
import {
  Project, SyntaxKind, MethodDeclaration, Node, Symbol, Type,
} from "ts-morph";
import * as path from "node:path";
import * as fs from "node:fs";
import { AnalyzerConfig } from "./types";

export class TSAnalyzer {
  readonly cfg: AnalyzerConfig;
  constructor(cfg: AnalyzerConfig) { this.cfg = cfg; }

  requireParams(): void {
    const { concreteClass, methodName } = this.cfg;
    if (!concreteClass || !methodName) {
      throw new Error(
        "Missing required params: 'concreteClass' and 'methodName' (AnalyzerConfig)."
      );
    }
  }

  private resolveTsconfig(p: string): string {
    if (p.endsWith(".json")) return p;
    const guess = path.join(p, "tsconfig.json");
    if (fs.existsSync(guess)) return guess;
    throw new Error(`No tsconfig.json found for projectPath: ${p}`);
  }

  loadProject(): Project {
    const tsconfig = this.resolveTsconfig(this.cfg.projectPath);
    if (this.cfg.debug) console.log(`[debug] using tsconfig: ${tsconfig}`);
    const project = new Project({ tsConfigFilePath: tsconfig });
    if (this.cfg.debug) {
      const files = project.getSourceFiles().map(sf => sf.getFilePath());
      console.log(`[debug] loaded ${files.length} source files`);
      // for (const f of files) console.log("  -", f);
    }
    return project;
  }

  findConcreteMethod(project: Project): MethodDeclaration {
    this.requireParams();
    const { concreteClass, methodName, fileHint, debug } = this.cfg;

    const candidates = project
      .getSourceFiles()
      .flatMap(sf => sf.getDescendantsOfKind(SyntaxKind.MethodDeclaration))
      .filter(md =>
        md.getName() === methodName &&
        md.getFirstAncestorByKind(SyntaxKind.ClassDeclaration)?.getName() === concreteClass
      );

    if (debug) {
      console.log(`[debug] candidates for ${concreteClass}.${methodName}: ${candidates.length}`);
      for (const c of candidates) console.log("  ->", c.getSourceFile().getFilePath());
    }
    if (candidates.length === 0) {
      throw new Error(`Could not find ${concreteClass}.${methodName}. Check names and tsconfig include.`);
    }

    if (fileHint) {
      const hit = candidates.find(m => m.getSourceFile().getFilePath().includes(fileHint));
      if (hit) return hit;
    }
    const implPref = candidates.find(m => m.getSourceFile().getFilePath().includes("/impl/"));
    if (implPref) return implPref;

    const exported = candidates.find(m => {
      const cd = m.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
      return cd?.isExported() || cd?.isDefaultExport();
    });
    return exported ?? candidates[0];
  }

  collectRelatedSymbols(methodDecl: MethodDeclaration): Set<Symbol> {
    const related = new Set<Symbol>();
    const push = (s?: Symbol) => { if (s) related.add(s); };

    push(methodDecl.getSymbol());

    const cls = methodDecl.getFirstAncestorByKindOrThrow(SyntaxKind.ClassDeclaration);
    const name = methodDecl.getName();

    // base-class chain
    let base = cls.getBaseClass();
    while (base) {
      push(base.getInstanceMethod(name)?.getSymbol());
      base = base.getBaseClass();
    }

    // implemented interfaces (walk extends)
    const seen = new Set<string>();
    const visitIfaceType = (t: Type) => {
      const id = t.getText();
      if (seen.has(id)) return;
      seen.add(id);
      const prop = t.getProperty(name);
      if (prop) push(prop);
      for (const bt of t.getBaseTypes()) visitIfaceType(bt);
    };
    for (const impl of cls.getImplements()) visitIfaceType(impl.getType());

    return related;
  }

  // formatting
  loc(n: Node): string {
    const sf = n.getSourceFile();
    const { line, column } = sf.getLineAndColumnAtPos(n.getStart());
    return `${sf.getFilePath()}:${line}:${column}`;
  }
  declKind(n: Node): string {
    switch (n.getKind()) {
      case SyntaxKind.MethodDeclaration: return "MethodDeclaration";
      case SyntaxKind.MethodSignature:   return "MethodSignature (interface)";
      case SyntaxKind.PropertySignature: return "PropertySignature (interface)";
      default: return SyntaxKind[n.getKind()];
    }
  }

  // call-site detection
  isNameCallee(node: Node) {
    const parent = node.getParent();
    const grand = parent?.getParent();
    const isPropAccess = parent?.getKind() === SyntaxKind.PropertyAccessExpression;
    const isNameOfProp = isPropAccess && (parent as any).getNameNode?.() === node;
    const isCall = isNameOfProp && grand?.getKind() === SyntaxKind.CallExpression;
    return isCall ? grand! : undefined;
  }
  isDirectIdentifierCall(node: Node) {
    const parent = node.getParent();
    if (node.getKind() !== SyntaxKind.Identifier) return undefined;
    if (parent?.getKind() === SyntaxKind.CallExpression &&
        (parent as any).getExpression?.() === node) return parent;
    return undefined;
  }
  isTearoffCallOrApply(node: Node) {
    const p = node.getParent();
    if (p?.getKind() !== SyntaxKind.PropertyAccessExpression) return undefined;
    const g = p.getParent();
    if (g?.getKind() !== SyntaxKind.PropertyAccessExpression) return undefined;
    const name = (g as any).getName?.();
    const gg = g.getParent();
    if ((name === "call" || name === "apply") && gg?.getKind() === SyntaxKind.CallExpression) {
      return gg;
    }
    return undefined;
  }
  isSuperCall(callNode: Node): boolean {
    const expr = (callNode as any).getExpression?.();
    if (!expr || expr.getKind?.() !== SyntaxKind.PropertyAccessExpression) return false;
    const recv = (expr as any).getExpression?.();
    return recv?.getKind?.() === SyntaxKind.SuperKeyword;
  }

  // tear-off helpers
  methodUsesThis(methodDecl: MethodDeclaration): boolean {
    return methodDecl.getDescendantsOfKind(SyntaxKind.ThisKeyword).length > 0;
  }
  isPropertyReadOfTarget(node: Node, methodName: string): boolean {
    if (node.getKind() !== SyntaxKind.PropertyAccessExpression) return false;
    const pae = node.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
    return pae.getName() === methodName;
  }
  isIdentifierUsedAsArgument(node: Node): boolean {
    if (node.getKind() !== SyntaxKind.Identifier) return false;
    const parent = node.getParent();
    return parent?.getKind() === SyntaxKind.CallExpression;
  }
  initializerIsBindOfPropertyAccess(init?: Node): boolean {
    if (!init || init.getKind() !== SyntaxKind.CallExpression) return false;
    const ce = init.asKindOrThrow(SyntaxKind.CallExpression);
    const expr = ce.getExpression();
    if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) return false;
    const pae = expr.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
    return pae.getName() === "bind";
  }

  // guards
  canFindReferences(node: Node): boolean {
    const anyNode = node as any;
    return (Node as any).isReferenceFindableNode
      ? (Node as any).isReferenceFindableNode(node)
      : typeof anyNode.findReferences === "function";
  }
}
// scripts/common.ts
import {
  Project,
  SyntaxKind,
  MethodDeclaration,
  Node,
  Symbol,
  Type,
} from "ts-morph";
import * as path from "node:path";
import * as fs from "node:fs";

/** Public config shape fed to the analyzer */
export interface AnalyzerConfig {
  concreteClass: string;
  methodName: string;
  projectPath: string;   // directory or path to tsconfig.json
  fileHint?: string;     // optional substring to disambiguate the impl file
  debug?: boolean;
}

/** Core analysis class: no CLI or process.env knowledge */
export class TSAnalyzer {
  readonly cfg: AnalyzerConfig;

  constructor(cfg: AnalyzerConfig) {
    this.cfg = cfg;
  }

  /** Validate required params */
  requireParams(): void {
    const { concreteClass, methodName } = this.cfg;
    if (!concreteClass || !methodName) {
      const msg = [
        "Missing required params.",
        "Provide both 'concreteClass' and 'methodName' in AnalyzerConfig.",
        "Example:",
        "  new TSAnalyzer({ concreteClass: 'AnthropicConversationManager', methodName: 'sendMessageWithAttachments', projectPath: 'fixtures/basic' })",
      ].join("\n");
      throw new Error(msg);
    }
  }

  /** Resolve a tsconfig.json from a dir or accept a .json path directly */
  private resolveTsconfig(p: string): string {
    if (p.endsWith(".json")) return p;
    const guess = path.join(p, "tsconfig.json");
    if (fs.existsSync(guess)) return guess;
    throw new Error(`No tsconfig.json found for projectPath: ${p}`);
  }

  /** Load a ts-morph Project for the configured projectPath */
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

  /** Find the concrete method declaration (heuristics + optional fileHint) */
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
      for (const c of candidates) {
        console.log("  ->", c.getSourceFile().getFilePath());
      }
    }

    if (candidates.length === 0) {
      throw new Error(`Could not find ${concreteClass}.${methodName}. Check names and that fixture files are included by tsconfig.`);
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
    if (exported) return exported;

    return candidates[0];
  }

  /** Build the equivalence set: concrete + base chain + implemented interfaces (and their bases) */
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

  /** Formatting helpers */
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

  /** Call-site detection */
  isNameCallee(node: Node) {
    // obj.m() or obj?.m()
    const parent = node.getParent();
    const grand = parent?.getParent();
    const isPropAccess = parent?.getKind() === SyntaxKind.PropertyAccessExpression;
    const isNameOfProp = isPropAccess && (parent as any).getNameNode?.() === node;
    const isCall = isNameOfProp && grand?.getKind() === SyntaxKind.CallExpression;
    return isCall ? grand! : undefined;
  }

  isDirectIdentifierCall(node: Node) {
    // m()
    const parent = node.getParent();
    if (node.getKind() !== SyntaxKind.Identifier) return undefined;
    if (parent?.getKind() === SyntaxKind.CallExpression &&
        (parent as any).getExpression?.() === node) return parent;
    return undefined;
  }

  isTearoffCallOrApply(node: Node) {
    // obj.m.call(...) or obj.m.apply(...)
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

  /** Tear-off risk helpers */
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

  /** Guard for findReferences across ts-morph versions */
  canFindReferences(node: Node): boolean {
    const anyNode = node as any;
    return (Node as any).isReferenceFindableNode
      ? (Node as any).isReferenceFindableNode(node)
      : typeof anyNode.findReferences === "function";
  }
}

/** Thin CLI facade: parses argv/env, builds a TSAnalyzer */
export class TSAnalyzerCLI {
  static DEFAULT_CLASS = "AnthropicConversationManager";
  static DEFAULT_METHOD = "sendMessageWithAttachments";

  /** Parse process.argv into a simple map */
  private static parseArgs(argv: string[]) {
    const args: Record<string, string> = {};
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (a.startsWith("--")) {
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith("--")) { args[key] = next; i++; }
        else { args[key] = "true"; }
      }
    }
    return args;
  }

  /** Build AnalyzerConfig from argv/env + sensible defaults */
  static readConfigFromProcess(): AnalyzerConfig {
    const ARGS = this.parseArgs(process.argv.slice(2));

    const concreteClass =
      ARGS.class || process.env.P_CLASS || TSAnalyzerCLI.DEFAULT_CLASS;
    const methodName =
      ARGS.method || process.env.P_METHOD || TSAnalyzerCLI.DEFAULT_METHOD;
    const projectPath =
      ARGS.project || process.env.P_PROJECT || process.cwd();
    const fileHint =
      ARGS.file || process.env.P_FILE || undefined;
    const debug =
      Boolean(ARGS.debug || process.env.P_DEBUG);

    return { concreteClass, methodName, projectPath, fileHint, debug };
  }

  /** Convenience: build a TSAnalyzer from the current process context */
  static createAnalyzer(): TSAnalyzer {
    const cfg = this.readConfigFromProcess();
    return new TSAnalyzer(cfg);
  }
}

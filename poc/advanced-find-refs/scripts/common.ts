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

/** ---------- tiny CLI parsing (no deps) ---------- */
function parseArgs(argv: string[]) {
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
const ARGS = parseArgs(process.argv.slice(2));

/** ---------- defaults (3rd priority fallback) ---------- */
const DEFAULT_CLASS = "AnthropicConversationManager";
const DEFAULT_METHOD = "sendMessageWithAttachments";

/** ---------- public config: flags > env > defaults ---------- */
export const CONCRETE_CLASS = ARGS.class || process.env.P_CLASS || DEFAULT_CLASS;
export const METHOD_NAME    = ARGS.method || process.env.P_METHOD || DEFAULT_METHOD;

// NEW: project path (dir or tsconfig.json), file hint, debug flag
export const PROJECT_PATH = ARGS.project || process.env.P_PROJECT || process.cwd();
export const FILE_HINT    = ARGS.file    || process.env.P_FILE    || "";
export const DEBUG        = (ARGS.debug || process.env.P_DEBUG) ? true : false;

/** require params once, prints helpful hint */
export function requireParams() {
  if (!CONCRETE_CLASS || !METHOD_NAME) {
    const msg = [
      "Missing required params.",
      "Use flags:",
      "  --class <ConcreteClass> --method <name>",
      "or env vars:",
      "  P_CLASS=<ConcreteClass> P_METHOD=<name>",
      "",
      "Example:",
      "  npm run find -- --class AnthropicConversationManager --method sendMessageWithAttachments",
      "",
      "(Defaults will be used if no flags/env provided)",
    ].join("\n");
    throw new Error(msg);
  }
}

/** ---------- tsconfig resolution & project loading ---------- */
function resolveTsconfig(p: string) {
  if (p.endsWith(".json")) return p;
  const guess = path.join(p, "tsconfig.json");
  if (fs.existsSync(guess)) return guess;
  throw new Error(`No tsconfig.json found for --project ${p}`);
}

export function loadProject(): Project {
  const tsconfig = resolveTsconfig(PROJECT_PATH);
  if (DEBUG) console.log(`[debug] using tsconfig: ${tsconfig}`);
  const project = new Project({ tsConfigFilePath: tsconfig });

  if (DEBUG) {
    const files = project.getSourceFiles().map(sf => sf.getFilePath());
    console.log(`[debug] loaded ${files.length} source files`);
    // Uncomment to print all files:
    // for (const f of files) console.log("  -", f);
  }
  return project;
}

/** ---------- find the concrete method declaration (with heuristics) ---------- */
export function findConcreteMethod(project: Project): MethodDeclaration {
  requireParams();

  const candidates = project
    .getSourceFiles()
    .flatMap(sf => sf.getDescendantsOfKind(SyntaxKind.MethodDeclaration))
    .filter(md =>
      md.getName() === METHOD_NAME &&
      md.getFirstAncestorByKind(SyntaxKind.ClassDeclaration)?.getName() === CONCRETE_CLASS
    );

  if (DEBUG) {
    console.log(`[debug] candidates for ${CONCRETE_CLASS}.${METHOD_NAME}: ${candidates.length}`);
    for (const c of candidates) {
      console.log("  ->", c.getSourceFile().getFilePath());
    }
  }

  if (candidates.length === 0) {
    throw new Error(`Could not find ${CONCRETE_CLASS}.${METHOD_NAME}. Check flags/env/defaults and that files are included by tsconfig.`);
  }

  // 1) Prefer --file hint if provided
  if (FILE_HINT) {
    const hit = candidates.find(m => m.getSourceFile().getFilePath().includes(FILE_HINT));
    if (hit) return hit;
  }

  // 2) Prefer files under /impl/ (convention)
  const implPref = candidates.find(m => m.getSourceFile().getFilePath().includes("/impl/"));
  if (implPref) return implPref;

  // 3) Prefer exported classes
  const exported = candidates.find(m => {
    const cd = m.getFirstAncestorByKind(SyntaxKind.ClassDeclaration);
    return cd?.isExported() || cd?.isDefaultExport();
  });
  if (exported) return exported;

  // 4) Fallback: first match
  return candidates[0];
}

/** ---------- symbol equivalence: method + base chain + implemented interfaces (and their bases) ---------- */
export function collectRelatedSymbols(methodDecl: MethodDeclaration): Set<Symbol> {
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

/** ---------- formatting ---------- */
export function loc(n: Node) {
  const sf = n.getSourceFile();
  const { line, column } = sf.getLineAndColumnAtPos(n.getStart());
  return `${sf.getFilePath()}:${line}:${column}`;
}

export function declKind(n: Node) {
  switch (n.getKind()) {
    case SyntaxKind.MethodDeclaration: return "MethodDeclaration";
    case SyntaxKind.MethodSignature:  return "MethodSignature (interface)";
    case SyntaxKind.PropertySignature:return "PropertySignature (interface)";
    default: return SyntaxKind[n.getKind()];
  }
}

/** ---------- call-site detection ---------- */
export function isNameCallee(node: Node) {
  // obj.m() or obj?.m()
  const parent = node.getParent();
  const grand = parent?.getParent();
  const isPropAccess = parent?.getKind() === SyntaxKind.PropertyAccessExpression;
  const isNameOfProp = isPropAccess && (parent as any).getNameNode?.() === node;
  const isCall = isNameOfProp && grand?.getKind() === SyntaxKind.CallExpression;
  return isCall ? grand! : undefined;
}

export function isDirectIdentifierCall(node: Node) {
  // m()
  const parent = node.getParent();
  if (node.getKind() !== SyntaxKind.Identifier) return undefined;
  if (parent?.getKind() === SyntaxKind.CallExpression &&
      (parent as any).getExpression?.() === node) return parent;
  return undefined;
}

export function isTearoffCallOrApply(node: Node) {
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

export function isSuperCall(callNode: Node): boolean {
  const expr = (callNode as any).getExpression?.();
  if (!expr || expr.getKind?.() !== SyntaxKind.PropertyAccessExpression) return false;
  const recv = (expr as any).getExpression?.();
  return recv?.getKind?.() === SyntaxKind.SuperKeyword;
}

/** ---------- tear-off risk helpers ---------- */
export function methodUsesThis(methodDecl: MethodDeclaration): boolean {
  return methodDecl.getDescendantsOfKind(SyntaxKind.ThisKeyword).length > 0;
}

export function isPropertyReadOfTarget(node: Node, methodName: string): boolean {
  if (node.getKind() !== SyntaxKind.PropertyAccessExpression) return false;
  const pae = node.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
  return pae.getName() === methodName;
}

export function isIdentifierUsedAsArgument(node: Node): boolean {
  if (node.getKind() !== SyntaxKind.Identifier) return false;
  const parent = node.getParent();
  return parent?.getKind() === SyntaxKind.CallExpression;
}

export function initializerIsBindOfPropertyAccess(init?: Node): boolean {
  if (!init || init.getKind() !== SyntaxKind.CallExpression) return false;
  const ce = init.asKindOrThrow(SyntaxKind.CallExpression);
  const expr = ce.getExpression();
  if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) return false;
  const pae = expr.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
  return pae.getName() === "bind";
}

/** Guards for findReferences across ts-morph versions */
export function canFindReferences(node: Node): boolean {
  const anyNode = node as any;
  return (Node as any).isReferenceFindableNode
    ? (Node as any).isReferenceFindableNode(node)
    : typeof anyNode.findReferences === "function";
}

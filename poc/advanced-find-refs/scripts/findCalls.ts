// src/findCalls.ts
import {
  Project,
  SyntaxKind,
  MethodDeclaration,
  Node,
  Symbol,
  Type,
} from "ts-morph";
import * as path from "node:path";

// ---------- config: skip internal super-calls from report? ----------
const SKIP_SUPER = false; // set true to exclude super.* calls from the output

// ---------- simple CLI/env/defaults ----------
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

// 3rd-priority built-in defaults so this runs out-of-the-box:
const DEFAULT_CLASS = "AnthropicConversationManager";
const DEFAULT_METHOD = "sendMessageWithAttachments";

// Priority: flags > env > defaults
const CONCRETE_CLASS = ARGS.class || process.env.P_CLASS || DEFAULT_CLASS;
const METHOD_NAME   = ARGS.method || process.env.P_METHOD || DEFAULT_METHOD;

// ---------- helpers ----------
function loadProject(): Project {
  return new Project({ tsConfigFilePath: path.join(process.cwd(), "tsconfig.json") });
}

function findConcreteMethod(project: Project): MethodDeclaration {
  const decl = project
    .getSourceFiles()
    .flatMap(sf => sf.getDescendantsOfKind(SyntaxKind.MethodDeclaration))
    .find(md =>
      md.getName() === METHOD_NAME &&
      md.getFirstAncestorByKind(SyntaxKind.ClassDeclaration)?.getName() === CONCRETE_CLASS
    );
  if (!decl) {
    throw new Error(
      `Could not find ${CONCRETE_CLASS}.${METHOD_NAME}. ` +
      `Pass flags: --class <C> --method <m> (or set P_CLASS/P_METHOD).`
    );
  }
  return decl;
}

function collectRelatedSymbols(methodDecl: MethodDeclaration): Set<Symbol> {
  const related = new Set<Symbol>();
  const push = (s?: Symbol) => { if (s) related.add(s); };

  // method itself
  push(methodDecl.getSymbol());

  // base-class chain
  const cls = methodDecl.getFirstAncestorByKindOrThrow(SyntaxKind.ClassDeclaration);
  const name = methodDecl.getName();

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

  for (const impl of cls.getImplements()) {
    visitIfaceType(impl.getType());
  }

  return related;
}

function isNameCallee(node: Node) {
  // matches: obj.m() and obj?.m()
  const parent = node.getParent();
  const grand = parent?.getParent();
  const isPropAccess = parent?.getKind() === SyntaxKind.PropertyAccessExpression;
  const isNameOfProp = isPropAccess && (parent as any).getNameNode?.() === node;
  const isCall = isNameOfProp && grand?.getKind() === SyntaxKind.CallExpression;
  return isCall ? grand! : undefined;
}

function isDirectIdentifierCall(node: Node) {
  // matches: m()
  const parent = node.getParent();
  if (node.getKind() !== SyntaxKind.Identifier) return undefined;
  if (parent?.getKind() === SyntaxKind.CallExpression &&
      (parent as any).getExpression?.() === node) return parent;
  return undefined;
}

function isTearoffCallOrApply(node: Node) {
  // matches: obj.m.call(...) or obj.m.apply(...)
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

function labelSuper(callNode: Node): boolean {
  // true if call expression is like: super.m(...)
  const expr = (callNode as any).getExpression?.();
  if (!expr || expr.getKind?.() !== SyntaxKind.PropertyAccessExpression) return false;
  const recv = (expr as any).getExpression?.();
  return recv?.getKind?.() === SyntaxKind.SuperKeyword;
}

// ---------- main ----------
function main() {
  const project = loadProject();
  const concreteDecl = findConcreteMethod(project);
  const related = collectRelatedSymbols(concreteDecl);

  // gather references for every declaration of every related symbol
  const refNodes: Node[] = [];
  for (const sym of related) {
    for (const d of sym.getDeclarations()) {
      // guard: not all decls support findReferences()
      const canFind =
        (Node as any).isReferenceFindableNode
          ? (Node as any).isReferenceFindableNode(d)
          : typeof (d as any).findReferences === "function";
      if (!canFind) continue;

      const refs = (d as any).findReferences() as any[];
      for (const rs of refs) {
        for (const r of rs.getReferences()) {
          refNodes.push(r.getNode());
        }
      }
    }
  }

  // reduce to unique call sites, labeling direct/optional/tearoff/super
  type Kind = "direct" | "optional" | "tearoff" | "super";
  const calls = new Map<string, { kind: Kind; node: Node }>();

  for (const node of refNodes) {
    const call =
      isNameCallee(node) || isDirectIdentifierCall(node) || isTearoffCallOrApply(node);
    if (!call) continue;

    let kind: Kind = "direct";

    if (labelSuper(call)) {
      if (SKIP_SUPER) continue;
      kind = "super";
    } else {
      const expr = (call as any).getExpression?.();
      const exprText = (expr?.getText?.() ?? "");
      if (exprText.endsWith(".call") || exprText.endsWith(".apply")) {
        kind = "tearoff";
      } else {
        // optional-chain detection (guarded across ts-morph versions)
        const prop = (node.getParent && node.getParent()) || undefined;
        const isOptional =
          prop?.getKind() === SyntaxKind.PropertyAccessExpression &&
          typeof (prop as any).hasQuestionDotToken === "function" &&
          (prop as any).hasQuestionDotToken();
        if (isOptional) kind = "optional";
      }
    }

    const key = `${call.getSourceFile().getFilePath()}:${call.getStart()}`;
    calls.set(key, { kind, node: call });
  }

  // print
  const items = [...calls.values()].sort(
    (a, b) =>
      a.node.getSourceFile().getFilePath().localeCompare(
        b.node.getSourceFile().getFilePath()
      ) || a.node.getStart() - b.node.getStart()
  );

  console.log(
    `Possible call sites for ${CONCRETE_CLASS}.${METHOD_NAME} (union across interface/base/concrete): ${items.length}`
  );
  for (const { kind, node } of items) {
    const sf = node.getSourceFile();
    const { line, column } = sf.getSourceFile().getLineAndColumnAtPos(node.getStart());
    console.log(
      `- ${kind.padEnd(8)} ${sf.getFilePath()}:${line}:${column}  ->  ${node.getText()}`
    );
  }
}

main();

import {
  loadProject, findConcreteMethod, collectRelatedSymbols,
  isNameCallee, isDirectIdentifierCall, isTearoffCallOrApply,
  METHOD_NAME, CONCRETE_CLASS, requireParams, canFindReferences,
  methodUsesThis, isPropertyReadOfTarget, isIdentifierUsedAsArgument, initializerIsBindOfPropertyAccess
} from "./common";
import { Node, SyntaxKind, VariableDeclaration, Symbol as TmSymbol } from "ts-morph";

type Label = "direct" | "optional" | "tearoff-safe" | "tearoff-unsafe" | "bare-callback";

function main() {
  requireParams();
  const project = loadProject();

  const concreteDecl = findConcreteMethod(project);
  const related: Set<TmSymbol> = collectRelatedSymbols(concreteDecl);
  const usesThis = methodUsesThis(concreteDecl);

  // Track torn-off variables: const fn = obj.method
  const tearOffVars = new Map<TmSymbol, { bound: boolean; decl: VariableDeclaration }>();

  for (const sf of project.getSourceFiles()) {
    for (const v of sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
      const init = v.getInitializer();
      if (!init) continue;

      // const fn = obj.method
      if (isPropertyReadOfTarget(init, METHOD_NAME)) {
        const sym = v.getNameNode().getSymbol();
        if (sym) tearOffVars.set(sym, { bound: false, decl: v });
        continue;
      }

      // const fn = obj.method.bind(obj)
      if (initializerIsBindOfPropertyAccess(init)) {
        const call = init.asKindOrThrow(SyntaxKind.CallExpression);
        const inner = call.getExpression().asKindOrThrow(SyntaxKind.PropertyAccessExpression);
        const methodPAE = inner.getExpression();
        if (methodPAE.getKind() === SyntaxKind.PropertyAccessExpression) {
          const pae = methodPAE.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
          if (pae.getName() === METHOD_NAME) {
            const sym = v.getNameNode().getSymbol();
            if (sym) tearOffVars.set(sym, { bound: true, decl: v });
          }
        }
      }
    }
  }

  // 2) Collect call sites from method symbols (like union finder)
  const results = new Map<string, { label: Label; node: Node }>();
  const add = (label: Label, node: Node) => {
    const key = `${node.getSourceFile().getFilePath()}:${node.getStart()}`;
    results.set(key, { label, node });
  };

  const refNodes: Node[] = [];
  for (const sym of related) {
    for (const d of sym.getDeclarations()) {
      if (!canFindReferences(d)) continue;
      for (const rs of (d as any).findReferences()) {
        for (const r of rs.getReferences()) refNodes.push(r.getNode());
      }
    }
  }

  for (const node of refNodes) {
    const call =
      isNameCallee(node) || isDirectIdentifierCall(node) || isTearoffCallOrApply(node);
    if (!call) continue;

    const expr = (call as any).getExpression?.();
    const exprText = (expr?.getText?.() ?? "");

    if (exprText.endsWith(".call") || exprText.endsWith(".apply")) {
      add("tearoff-safe", call);
      continue;
    }

    const prop = node.getParent();
    const isOptional =
      prop?.getKind() === SyntaxKind.PropertyAccessExpression &&
      typeof (prop as any).hasQuestionDotToken === "function" &&
      (prop as any).hasQuestionDotToken();
    add(isOptional ? "optional" : "direct", call);
  }

  // 3) Also track indirect calls via tear-off vars
  for (const [varSym, info] of tearOffVars.entries()) {
    for (const d of varSym.getDeclarations()) {
      if (!canFindReferences(d)) continue;
      for (const rs of (d as any).findReferences()) {
        for (const r of rs.getReferences()) {
          const n = r.getNode();

          // fn(...)
          const call = isDirectIdentifierCall(n);
          if (call) {
            add(info.bound ? "tearoff-safe" : (usesThis ? "tearoff-unsafe" : "tearoff-safe"), call);
            continue;
          }

          // someApi(fn)
          if (isIdentifierUsedAsArgument(n)) {
            add(info.bound ? "tearoff-safe" : (usesThis ? "bare-callback" : "tearoff-safe"), n.getParent()!);
          }
        }
      }
    }
  }

  // 4) Print
  const items = [...results.values()].sort(
    (a, b) =>
      a.node.getSourceFile().getFilePath().localeCompare(b.node.getSourceFile().getFilePath()) ||
      a.node.getStart() - b.node.getStart()
  );

  console.log(`Tear-off risk assessment for ${CONCRETE_CLASS}.${METHOD_NAME} (this-used=${usesThis}):`);
  for (const { label, node } of items) {
    const sf = node.getSourceFile();
    const { line, column } = sf.getSourceFile().getLineAndColumnAtPos(node.getStart());
    console.log(`- ${label.padEnd(14)} ${sf.getFilePath()}:${line}:${column}  ->  ${node.getText()}`);
  }
}

main();

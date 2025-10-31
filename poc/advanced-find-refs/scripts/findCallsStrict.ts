import {
  loadProject, findConcreteMethod,
  isNameCallee, isDirectIdentifierCall, isTearoffCallOrApply,
  METHOD_NAME, CONCRETE_CLASS, requireParams, canFindReferences
} from "./common";
import { Node } from "ts-morph";

function main() {
  requireParams();
  const project = loadProject();
  const checker = project.getTypeChecker();

  const decl = findConcreteMethod(project);
  const concreteSym = decl.getSymbolOrThrow();
  const concreteDecls = new Set(concreteSym.getDeclarations());

  const refNodes: Node[] = [];
  for (const d of concreteDecls) {
    if (!canFindReferences(d as any)) continue;
    for (const rs of (d as any).findReferences()) {
      for (const r of rs.getReferences()) refNodes.push(r.getNode());
    }
  }

  const calls = new Map<string, Node>();
  for (const node of refNodes) {
    const call =
      isNameCallee(node) || isDirectIdentifierCall(node) || isTearoffCallOrApply(node);
    if (!call) continue;

    const sig = checker.getResolvedSignature(call as any);
    const sDecl = sig?.getDeclaration();
    if (!sDecl) continue;

    if ([...concreteDecls].some(d => d === sDecl)) {
      const key = `${call.getSourceFile().getFilePath()}:${call.getStart()}`;
      calls.set(key, call);
    }
  }

  const items = [...calls.values()].sort(
    (a, b) =>
      a.getSourceFile().getFilePath().localeCompare(b.getSourceFile().getFilePath()) ||
      a.getStart() - b.getStart()
  );

  console.log(`STRICT call sites for ${CONCRETE_CLASS}.${METHOD_NAME}: ${items.length}`);
  for (const node of items) {
    const sf = node.getSourceFile();
    const { line, column } = sf.getSourceFile().getLineAndColumnAtPos(node.getStart());
    console.log(`- ${sf.getFilePath()}:${line}:${column}  ->  ${node.getText()}`);
  }
}

main();

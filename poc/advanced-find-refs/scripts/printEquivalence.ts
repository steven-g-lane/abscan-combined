import {
  loadProject, findConcreteMethod, collectRelatedSymbols,
  declKind, loc, METHOD_NAME, CONCRETE_CLASS, requireParams
} from "./common";

function main() {
  requireParams();
  const project = loadProject();
  const decl = findConcreteMethod(project);
  const related = collectRelatedSymbols(decl);

  console.log(`Equivalence set for ${CONCRETE_CLASS}.${METHOD_NAME}: ${related.size} symbol(s)\n`);
  let i = 0;
  for (const sym of related) {
    console.log(`Symbol #${++i}: ${sym.getName()}`);
    for (const d of sym.getDeclarations()) {
      console.log(`  - ${declKind(d)}  @ ${loc(d)}`);
    }
    console.log("");
  }
}

main();

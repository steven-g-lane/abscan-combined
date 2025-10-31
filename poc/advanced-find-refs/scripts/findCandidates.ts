// scripts/findCandidates.ts
import { Project, SyntaxKind } from "ts-morph";
import * as path from "node:path";
import * as fs from "node:fs";

function resolveTsconfig(p: string) {
  if (p.endsWith(".json")) return p;
  const guess = path.join(p, "tsconfig.json");
  if (fs.existsSync(guess)) return guess;
  throw new Error(`No tsconfig.json found for --project ${p}`);
}

function arg(name: string, def = "") {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : process.env[`P_${name.toUpperCase()}`] || def;
}

const projectPath = arg("project", process.cwd());
const className   = arg("class", "AnthropicConversationManager");
const methodName  = arg("method", "sendMessageWithAttachments");

const tsconfig = resolveTsconfig(projectPath);
console.log(`[candidates] tsconfig: ${tsconfig}`);
const project = new Project({ tsConfigFilePath: tsconfig });

const all = project.getSourceFiles()
  .flatMap(sf => sf.getDescendantsOfKind(SyntaxKind.MethodDeclaration))
  .filter(md =>
    md.getName() === methodName &&
    md.getFirstAncestorByKind(SyntaxKind.ClassDeclaration)?.getName() === className
  );

console.log(`[candidates] looking for ${className}.${methodName}`);
console.log(`[candidates] found: ${all.length}`);
for (const md of all) {
  const sf = md.getSourceFile();
  const { line, column } = sf.getLineAndColumnAtPos(md.getStart());
  console.log(` -> ${sf.getFilePath()}:${line}:${column}`);
}

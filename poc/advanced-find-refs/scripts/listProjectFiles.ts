// scripts/listProjectFiles.ts
import { Project } from "ts-morph";
import * as path from "node:path";
import * as fs from "node:fs";

function resolveTsconfig(p: string) {
  if (p.endsWith(".json")) return p;
  const guess = path.join(p, "tsconfig.json");
  if (fs.existsSync(guess)) return guess;
  throw new Error(`No tsconfig.json found for --project ${p}`);
}

const args = process.argv.slice(2);
const projectArgIndex = args.indexOf("--project");
const projectPath = projectArgIndex >= 0 ? args[projectArgIndex + 1] : process.cwd();

const tsconfig = resolveTsconfig(projectPath);
console.log(`[list] tsconfig: ${tsconfig}`);

const project = new Project({ tsConfigFilePath: tsconfig });
const files = project.getSourceFiles().map(sf => sf.getFilePath());
console.log(`[list] loaded ${files.length} source files`);
for (const f of files) console.log(" -", f);

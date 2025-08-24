import { Project, SourceFile } from 'ts-morph';
import { FileSummary } from '../models';
import { extractClasses } from '../extractors/classExtractor';
import { extractFunctions } from '../extractors/functionExtractor';
import { extractInterfaces } from '../extractors/interfaceExtractor';
import { extractTypes } from '../extractors/typeExtractor';
import { extractReactComponents } from '../extractors/reactExtractor';
import { extractIPC } from '../extractors/ipcExtractor';
import { extractSQLiteQueries } from '../extractors/sqliteExtractor';
import path from 'path';

const project = new Project({
  useInMemoryFileSystem: false,
});

export async function analyzeFile(filePath: string, projectRoot: string): Promise<FileSummary> {
  const sourceFile = project.addSourceFileAtPath(filePath);
  const relativePath = path.relative(projectRoot, filePath);
  
  const language = getLanguage(filePath);
  const kind = getFileKind(relativePath);

  const classes = extractClasses(sourceFile);
  const functions = extractFunctions(sourceFile);
  const interfaces = extractInterfaces(sourceFile);
  const types = extractTypes(sourceFile);
  const components = extractReactComponents(sourceFile);
  const ipc = extractIPC(sourceFile);
  const sqliteQueries = extractSQLiteQueries(sourceFile);

  const exports = {
    classes: classes.length > 0 ? classes : undefined,
    functions: functions.length > 0 ? functions : undefined,
    interfaces: interfaces.length > 0 ? interfaces : undefined,
    types: types.length > 0 ? types : undefined,
    components: components.length > 0 ? components : undefined,
  };

  return {
    path: relativePath,
    kind,
    language,
    exports,
    ipc: (ipc.handlers.length > 0 || ipc.invocations.length > 0) ? ipc : undefined,
    sqliteQueries: sqliteQueries.length > 0 ? sqliteQueries : undefined,
  };
}

function getLanguage(filePath: string): "ts" | "tsx" | "js" | "jsx" {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.ts': return 'ts';
    case '.tsx': return 'tsx';
    case '.js': return 'js';
    case '.jsx': return 'jsx';
    default: return 'ts';
  }
}

function getFileKind(relativePath: string): "main" | "renderer" | "shared" | "unknown" {
  const normalizedPath = relativePath.toLowerCase();
  
  if (normalizedPath.includes('main') || normalizedPath.includes('electron')) {
    return 'main';
  }
  if (normalizedPath.includes('renderer') || normalizedPath.includes('ui') || normalizedPath.includes('components')) {
    return 'renderer';
  }
  if (normalizedPath.includes('shared') || normalizedPath.includes('common') || normalizedPath.includes('utils')) {
    return 'shared';
  }
  
  return 'unknown';
}
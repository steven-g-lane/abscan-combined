import { ProjectSummary, TypeCatalogEntry, TypeUsageReference } from '../models';
import { analyzeFile } from '../analyzer/analyzeFile';
import { extractTypeCatalog, buildTypeCatalog } from '../extractors/typeCatalogExtractor';
import { TypeReferenceTracker } from '../utils/typeReferenceTracker';
import { Project } from 'ts-morph';
import path from 'path';

export async function scanProject(projectRoot: string): Promise<ProjectSummary> {
  const patterns = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx'
  ];

  const ignore = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.test.*',
    '**/*.spec.*'
  ];

  const globby = require('globby');
  const files = await globby(patterns, {
    cwd: projectRoot,
    ignore,
    absolute: true
  });

  const fileSummaries = await Promise.all(
    files.map((file: string) => analyzeFile(file, projectRoot))
  );

  // Extract type catalog from all files
  const project = new Project({
    useInMemoryFileSystem: false,
  });
  
  const allTypeEntries: TypeCatalogEntry[] = [];
  for (const file of files) {
    const sourceFile = project.addSourceFileAtPath(file);
    const typeEntries = extractTypeCatalog(sourceFile, projectRoot);
    allTypeEntries.push(...typeEntries);
  }
  
  const typeCatalog = buildTypeCatalog(allTypeEntries);
  
  // Track type usage references across all files
  const referenceTracker = new TypeReferenceTracker();
  const allReferences: TypeUsageReference[] = [];
  
  for (const file of files) {
    const sourceFile = project.getSourceFile(file);
    if (sourceFile) {
      const fileReferences = referenceTracker.trackReferences(sourceFile, typeCatalog, projectRoot);
      allReferences.push(...fileReferences);
    }
  }
  
  // Link references back to type catalog entries
  linkReferencesToTypes(typeCatalog, allReferences);

  return {
    projectRoot,
    scannedAt: new Date().toISOString(),
    files: fileSummaries,
    typeCatalog
  };
}

function linkReferencesToTypes(typeCatalog: any, allReferences: TypeUsageReference[]): void {
  // Group references by type ID
  const referencesByType = allReferences.reduce((acc, ref) => {
    if (!acc[ref.typeId]) {
      acc[ref.typeId] = [];
    }
    acc[ref.typeId].push(ref);
    return acc;
  }, {} as Record<string, TypeUsageReference[]>);

  // Link references to type catalog entries
  typeCatalog.entries.forEach((entry: any) => {
    const references = referencesByType[entry.id] || [];
    
    // Sort references by file path and line number
    references.sort((a, b) => {
      if (a.location.file !== b.location.file) {
        return a.location.file.localeCompare(b.location.file);
      }
      return a.location.line - b.location.line;
    });
    
    entry.references = references;
    
    // Update the map as well
    typeCatalog.entryMap.set(entry.id, entry);
  });
}
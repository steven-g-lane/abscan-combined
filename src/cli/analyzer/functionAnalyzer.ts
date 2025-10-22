import { Project, SourceFile } from 'ts-morph';
import { FunctionAnalysisResult, ComprehensiveFunctionSummary, FunctionReference } from '../models';
import { UnifiedFunctionScanner } from '../utils/unifiedFunctionScanner';
import path from 'path';
import globby from 'globby';
import { cliLogger } from '../../shared/logging/logger';

export class FunctionAnalyzer {
  private project: Project;

  constructor() {
    this.project = new Project({
      useInMemoryFileSystem: false,
    });
  }

  async analyzeFunctions(projectPath: string): Promise<FunctionAnalysisResult> {
    const logger = cliLogger('functionAnalyzer');
    logger.info('Starting function analysis phase with unified scanner');

    // Find all TypeScript and JavaScript files
    const pattern = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
    const files = await globby(pattern, {
      cwd: projectPath,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts']
    });

    logger.info('Loading source files', { fileCount: files.length });

    // Add all files to the project for cross-file analysis
    const sourceFiles = files.map(file => this.project.addSourceFileAtPath(file));
    logger.debug('Source files loaded', { loadedCount: sourceFiles.length });

    // Single pass: collect both definitions and references with qualified names
    logger.info('Starting unified function scan (definitions + references)');
    const scanner = new UnifiedFunctionScanner(this.project);
    const functionRegistry = scanner.scanAll();

    const functions = Array.from(functionRegistry.values());

    logger.info('Function analysis complete', {
      functionCount: functions.length,
      totalReferences: functions.reduce((sum, func) => sum + (func.referenceCount || 0), 0)
    });

    return {
      projectRoot: projectPath,
      scannedAt: new Date().toISOString(),
      functions
    };
  }

}

export async function analyzeFunctionsInProject(projectPath: string): Promise<FunctionAnalysisResult> {
  const analyzer = new FunctionAnalyzer();
  return await analyzer.analyzeFunctions(projectPath);
}
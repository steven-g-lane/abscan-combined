import { Project, SourceFile } from 'ts-morph';
import { FunctionAnalysisResult, ComprehensiveFunctionSummary, FunctionReference } from '../models';
import { extractFunctions } from '../extractors/functionExtractor';
import { FunctionReferenceTracker } from '../utils/functionReferenceTracker';
import path from 'path';
import globby from 'globby';

export class FunctionAnalyzer {
  private project: Project;
  private functionRegistry: Map<string, ComprehensiveFunctionSummary> = new Map();

  constructor() {
    this.project = new Project({
      useInMemoryFileSystem: false,
    });
  }

  async analyzeFunctions(projectPath: string): Promise<FunctionAnalysisResult> {
    console.log('🚀 Starting function analysis phase');
    
    // Find all TypeScript and JavaScript files
    const pattern = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
    const files = await globby(pattern, {
      cwd: projectPath,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts']
    });

    console.log(`📄 Loading ${files.length} source files for function analysis`);
    
    // Add all files to the project for cross-file analysis
    const sourceFiles = files.map(file => this.project.addSourceFileAtPath(file));
    console.log(`📄 Loaded ${sourceFiles.length} source files`);

    // First pass: catalog all functions
    console.log('🔍 Cataloging all functions...');
    sourceFiles.forEach(sourceFile => {
      this.catalogFunctions(sourceFile);
    });

    console.log(`📊 Found ${this.functionRegistry.size} functions across ${sourceFiles.length} files`);

    // Second pass: find function references using batch tracker for efficiency
    console.log('🔗 Finding function references...');
    const referenceTracker = new FunctionReferenceTracker(this.project);
    referenceTracker.buildReferenceMap();
    referenceTracker.applyReferencesToFunctions(this.functionRegistry);

    const functions = Array.from(this.functionRegistry.values());

    return {
      projectRoot: projectPath,
      scannedAt: new Date().toISOString(),
      functions
    };
  }

  private catalogFunctions(sourceFile: SourceFile): void {
    const filePath = sourceFile.getFilePath();
    const functions = extractFunctions(sourceFile);

    functions.forEach(func => {
      // Create a more unique ID that includes line number to prevent collisions
      // This handles cases where multiple functions with the same name exist in the same file
      const id = `${path.relative(process.cwd(), filePath)}:${func.name}:${func.location.line}`;
      
      // Calculate source LOC (simple estimation based on location)
      const sourceLOC = func.location.endLine ? 
        func.location.endLine - func.location.line + 1 : 
        1;

      const comprehensiveFunction: ComprehensiveFunctionSummary = {
        id,
        name: func.name,
        sourceFile: filePath,
        location: func.location,
        parameters: func.parameters,
        returnType: func.returnType,
        resolvedReturnType: func.resolvedReturnType,
        isExported: func.isExported,
        genericParameters: func.genericParameters,
        jsdocDescription: func.jsdocDescription,
        sourceLOC,
        sourceFilename: path.basename(filePath),
        references: [],
        referenceCount: 0,
        isReactComponent: func.isReactComponent
      };

      this.functionRegistry.set(id, comprehensiveFunction);
    });
  }

}

export async function analyzeFunctionsInProject(projectPath: string): Promise<FunctionAnalysisResult> {
  const analyzer = new FunctionAnalyzer();
  return await analyzer.analyzeFunctions(projectPath);
}
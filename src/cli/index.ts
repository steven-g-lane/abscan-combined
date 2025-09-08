#!/usr/bin/env node

import { Command } from 'commander';
import { scanProject } from './scanner/scanProject';
import { scanFileSystem } from './scanner/fileSystemScanner';
import { emitArchitectureJson, emitArchitectureMd, emitDependenciesJson } from './emitters';
import { aggregateData } from './emitters/aggregator';
import { transformFileSystemToMillerColumns, loadIconMapping } from './transformers/millerColumnsTransformer';
import { transformClassAnalysisToMillerColumns } from './transformers/classMillerColumnsTransformer';
import { transformFunctionAnalysisToMillerColumns } from './transformers/functionMillerColumnsTransformer';
import { transformInterfaceAnalysisToMillerColumns } from './transformers/interfaceMillerColumnsTransformer';
import { analyzeClassesInProject } from './analyzer/classAnalyzer';
import { analyzeFunctionsInProject } from './analyzer/functionAnalyzer';
import { analyzeInterfacesInProject } from './analyzer/interfaceAnalyzer';
import { createOutputPathManager } from './utils/outputPaths';
import { scanProfiler } from './utils/profiler';
import path from 'path';
import fs from 'fs-extra';

const program = new Command();

program
  .name('abscan')
  .description('CLI tool to scan and catalog code logic, abstractions, and dependencies')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan a codebase and generate architecture documentation')
  .option('-p, --path <path>', 'path to scan', '.')
  .option('-o, --output-dir <path>', 'output directory', './output')
  .option('--type-paths <mode>', 'type path display mode: clean, filename, or full', 'clean')
  .option('--include-node-modules', 'include node_modules in file system scan', false)
  .option('--include-git', 'include .git directory in file system scan', false)
  .option('--files-output <filename>', 'custom filename for file structure output', 'files.json')
  .option('--miller-output <filename>', 'custom filename for Miller columns output', 'miller-columns.json')
  .option('--icon-config <path>', 'path to custom icon mapping configuration file')
  .option('--skip-filesystem', 'skip file system scanning', false)
  .option('--skip-miller', 'skip Miller columns transformation', false)
  .option('--classes-output <filename>', 'custom filename for class analysis output', 'classes.json')
  .option('--class-miller-output <filename>', 'custom filename for class Miller columns output', 'class-miller-columns.json')
  .option('--skip-classes', 'skip class analysis', false)
  .option('--skip-class-miller', 'skip class Miller columns transformation', false)
  .option('--functions-output <filename>', 'custom filename for function analysis output', 'functions.json')
  .option('--function-miller-output <filename>', 'custom filename for function Miller columns output', 'function-miller-columns.json')
  .option('--skip-functions', 'skip function analysis', false)
  .option('--skip-function-miller', 'skip function Miller columns transformation', false)
  .option('--interfaces-output <filename>', 'custom filename for interface analysis output', 'interfaces.json')
  .option('--interface-miller-output <filename>', 'custom filename for interface Miller columns output', 'interface-miller-columns.json')
  .option('--skip-interfaces', 'skip interface analysis', false)
  .option('--skip-interface-miller', 'skip interface Miller columns transformation', false)
  .action(async (options) => {
    try {
      const scanPath = path.resolve(options.path);
      const outPath = path.resolve(options.outputDir);

      // Validate type-paths option
      const validTypePaths = ['clean', 'filename', 'full'];
      if (!validTypePaths.includes(options.typePaths)) {
        console.error(`Invalid --type-paths option: ${options.typePaths}. Must be one of: ${validTypePaths.join(', ')}`);
        process.exit(1);
      }

      // Validate and create output directory
      try {
        await fs.ensureDir(outPath);
        
        // Test write permissions
        const testFile = path.join(outPath, '.write-test');
        await fs.writeFile(testFile, 'test');
        await fs.remove(testFile);
      } catch (error: any) {
        console.error(`Error with output directory '${outPath}': ${error.message}`);
        console.error('Please check that the path is writable and accessible.');
        process.exit(1);
      }

      // Create centralized path manager
      const pathManager = createOutputPathManager(outPath, {
        filesOutput: options.filesOutput,
        millerOutput: options.millerOutput,
        classesOutput: options.classesOutput,
        classMillerOutput: options.classMillerOutput,
        functionsOutput: options.functionsOutput,
        functionMillerOutput: options.functionMillerOutput,
        interfacesOutput: options.interfacesOutput,
        interfaceMillerOutput: options.interfaceMillerOutput,
      });

      console.log(`Scanning: ${scanPath}`);
      console.log(`Output: ${outPath}`);
      console.log(`Type Path Mode: ${options.typePaths}`);
      console.log(''); // Add spacing before timing output

      // Start overall scan timing
      scanProfiler.startScan();

      // Project analysis phase
      scanProfiler.startPhase('Project analysis');
      const projectSummary = await scanProject(scanPath);
      scanProfiler.endPhase('Project analysis');
      
      await emitArchitectureJson(projectSummary, pathManager.getArchitecturePath());
      await emitArchitectureMd(projectSummary, pathManager.getArchitectureMdPath(), options.typePaths);
      await emitDependenciesJson(projectSummary, pathManager.getDependenciesPath());

      // File system scanning (in-memory only)
      let fileSystemResult = undefined;
      if (!options.skipFilesystem) {
        scanProfiler.startPhase('File system scan');
        fileSystemResult = await scanFileSystem(scanPath, {
          includeNodeModules: options.includeNodeModules,
          includeGit: options.includeGit,
          outputFilename: options.filesOutput
        });
        scanProfiler.endPhase('File system scan');
      }

      // Class analysis (in-memory only) 
      let classAnalysisResult = undefined;
      if (!options.skipClasses) {
        scanProfiler.startPhase('Class analysis');
        classAnalysisResult = await analyzeClassesInProject(scanPath);
        scanProfiler.endPhase('Class analysis');
      }

      // Function analysis (in-memory only) 
      let functionAnalysisResult = undefined;
      if (!options.skipFunctions) {
        scanProfiler.startPhase('Function analysis');
        functionAnalysisResult = await analyzeFunctionsInProject(scanPath);
        scanProfiler.endPhase('Function analysis');
      }

      // Interface analysis (in-memory only) 
      let interfaceAnalysisResult = undefined;
      if (!options.skipInterfaces) {
        scanProfiler.startPhase('Interface analysis');
        interfaceAnalysisResult = await analyzeInterfacesInProject(scanPath);
        scanProfiler.endPhase('Interface analysis');
      }

      // Miller columns transformation and output generation
      scanProfiler.startPhase('Output generation');
      await aggregateData(
        pathManager.getOutputDir(), 
        fileSystemResult,
        classAnalysisResult,
        functionAnalysisResult,
        interfaceAnalysisResult,
        options.iconConfig
      );
      scanProfiler.endPhase('Output generation');

      // End overall scan timing
      scanProfiler.endScan();

      console.log('\n✅ Scan complete!');
      console.log(`Generated: ${pathManager.getArchitecturePath()}`);
      console.log(`Generated: ${pathManager.getArchitectureMdPath()}`);
      console.log(`Generated: ${pathManager.getDependenciesPath()}`);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

program.parse();
#!/usr/bin/env node

import { Command } from 'commander';
import { scanProject } from './scanner/scanProject';
import { scanFileSystem } from './scanner/fileSystemScanner';
import { emitArchitectureJson, emitArchitectureMd, emitDependenciesJson, emitFileSystemJson, emitMillerColumnsJson, emitClassAnalysisJson, emitClassMillerColumnsJson, emitAggregatedJson } from './emitters';
import { transformFileSystemToMillerColumns, loadIconMapping } from './transformers/millerColumnsTransformer';
import { transformClassAnalysisToMillerColumns } from './transformers/classMillerColumnsTransformer';
import { analyzeClassesInProject } from './analyzer/classAnalyzer';
import { createOutputPathManager } from './utils/outputPaths';
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
      });

      console.log(`Scanning: ${scanPath}`);
      console.log(`Output: ${outPath}`);
      console.log(`Type Path Mode: ${options.typePaths}`);

      const projectSummary = await scanProject(scanPath);
      
      await emitArchitectureJson(projectSummary, pathManager.getArchitecturePath());
      await emitArchitectureMd(projectSummary, pathManager.getArchitectureMdPath(), options.typePaths);
      await emitDependenciesJson(projectSummary, pathManager.getDependenciesPath());

      // File system scanning
      if (!options.skipFilesystem) {
        console.log('\nScanning file system...');
        const fileSystemResult = await scanFileSystem(scanPath, {
          includeNodeModules: options.includeNodeModules,
          includeGit: options.includeGit,
          outputFilename: options.filesOutput
        });
        
        await emitFileSystemJson(fileSystemResult, pathManager.getFilesPath());
        console.log(`Generated: ${pathManager.getFilesPath()}`);

        // Miller columns transformation
        if (!options.skipMiller) {
          console.log('\nTransforming to Miller columns format...');
          const iconMapping = await loadIconMapping(options.iconConfig);
          const millerColumnsResult = await transformFileSystemToMillerColumns(fileSystemResult, iconMapping);
          
          await emitMillerColumnsJson(millerColumnsResult, pathManager.getMillerColumnsPath());
          console.log(`Generated: ${pathManager.getMillerColumnsPath()}`);
        }
      }

      // Class analysis
      if (!options.skipClasses) {
        console.log('\nAnalyzing classes...');
        const classAnalysisResult = await analyzeClassesInProject(scanPath);
        
        await emitClassAnalysisJson(classAnalysisResult, pathManager.getClassesPath());
        console.log(`Generated: ${pathManager.getClassesPath()}`);

        // Class Miller columns transformation
        if (!options.skipClassMiller) {
          console.log('\nTransforming classes to Miller columns format...');
          const classMillerColumnsResult = await transformClassAnalysisToMillerColumns(classAnalysisResult);
          
          await emitClassMillerColumnsJson(classMillerColumnsResult, pathManager.getClassMillerColumnsPath());
          console.log(`Generated: ${pathManager.getClassMillerColumnsPath()}`);
        }
      }

      // Aggregate data into single master file
      console.log('\nCreating aggregated master file...');
      await emitAggregatedJson(pathManager.getOutputDir());
      console.log(`Generated: ${pathManager.getAggregatedPath()}`);

      console.log('Scan complete!');
      console.log(`Generated: ${pathManager.getArchitecturePath()}`);
      console.log(`Generated: ${pathManager.getArchitectureMdPath()}`);
      console.log(`Generated: ${pathManager.getDependenciesPath()}`);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

program.parse();
import path from 'path';

export interface OutputPathConfig {
  outputDir: string;
  filenames: {
    files: string;
    millerColumns: string;
    classes: string;
    classMillerColumns: string;
    functions: string;
    functionMillerColumns: string;
    interfaces: string;
    interfaceMillerColumns: string;
    architecture: string;
    architectureMd: string;
    dependencies: string;
    aggregated: string;
  };
}

export class OutputPathManager {
  private config: OutputPathConfig;

  constructor(outputDir: string, customFilenames?: Partial<OutputPathConfig['filenames']>) {
    this.config = {
      outputDir,
      filenames: {
        files: customFilenames?.files || 'files.json',
        millerColumns: customFilenames?.millerColumns || 'miller-columns.json',
        classes: customFilenames?.classes || 'classes.json',
        classMillerColumns: customFilenames?.classMillerColumns || 'class-miller-columns.json',
        functions: customFilenames?.functions || 'functions.json',
        functionMillerColumns: customFilenames?.functionMillerColumns || 'function-miller-columns.json',
        interfaces: customFilenames?.interfaces || 'interfaces.json',
        interfaceMillerColumns: customFilenames?.interfaceMillerColumns || 'interface-miller-columns.json',
        architecture: customFilenames?.architecture || 'architecture.json',
        architectureMd: customFilenames?.architectureMd || 'ARCHITECTURE.md',
        dependencies: customFilenames?.dependencies || 'dependencies.json',
        aggregated: customFilenames?.aggregated || 'abscan.json',
      },
    };
  }

  getOutputDir(): string {
    return this.config.outputDir;
  }

  getFilesPath(): string {
    return path.join(this.config.outputDir, this.config.filenames.files);
  }

  getMillerColumnsPath(): string {
    return path.join(this.config.outputDir, this.config.filenames.millerColumns);
  }

  getClassesPath(): string {
    return path.join(this.config.outputDir, this.config.filenames.classes);
  }

  getClassMillerColumnsPath(): string {
    return path.join(this.config.outputDir, this.config.filenames.classMillerColumns);
  }

  getFunctionsPath(): string {
    return path.join(this.config.outputDir, this.config.filenames.functions);
  }

  getFunctionMillerColumnsPath(): string {
    return path.join(this.config.outputDir, this.config.filenames.functionMillerColumns);
  }

  getInterfacesPath(): string {
    return path.join(this.config.outputDir, this.config.filenames.interfaces);
  }

  getInterfaceMillerColumnsPath(): string {
    return path.join(this.config.outputDir, this.config.filenames.interfaceMillerColumns);
  }

  getArchitecturePath(): string {
    return path.join(this.config.outputDir, this.config.filenames.architecture);
  }

  getArchitectureMdPath(): string {
    return path.join(this.config.outputDir, this.config.filenames.architectureMd);
  }

  getDependenciesPath(): string {
    return path.join(this.config.outputDir, this.config.filenames.dependencies);
  }

  getAggregatedPath(): string {
    return path.join(this.config.outputDir, this.config.filenames.aggregated);
  }

  getCustomPath(filename: string): string {
    return path.join(this.config.outputDir, filename);
  }

  getAllPaths(): Record<string, string> {
    return {
      files: this.getFilesPath(),
      millerColumns: this.getMillerColumnsPath(),
      classes: this.getClassesPath(),
      classMillerColumns: this.getClassMillerColumnsPath(),
      functions: this.getFunctionsPath(),
      functionMillerColumns: this.getFunctionMillerColumnsPath(),
      interfaces: this.getInterfacesPath(),
      interfaceMillerColumns: this.getInterfaceMillerColumnsPath(),
      architecture: this.getArchitecturePath(),
      architectureMd: this.getArchitectureMdPath(),
      dependencies: this.getDependenciesPath(),
      aggregated: this.getAggregatedPath(),
    };
  }
}

export function createOutputPathManager(
  outputDir: string,
  customFilenames?: {
    filesOutput?: string;
    millerOutput?: string;
    classesOutput?: string;
    classMillerOutput?: string;
    functionsOutput?: string;
    functionMillerOutput?: string;
    interfacesOutput?: string;
    interfaceMillerOutput?: string;
  }
): OutputPathManager {
  return new OutputPathManager(outputDir, {
    files: customFilenames?.filesOutput,
    millerColumns: customFilenames?.millerOutput,
    classes: customFilenames?.classesOutput,
    classMillerColumns: customFilenames?.classMillerOutput,
    functions: customFilenames?.functionsOutput,
    functionMillerColumns: customFilenames?.functionMillerOutput,
    interfaces: customFilenames?.interfacesOutput,
    interfaceMillerColumns: customFilenames?.interfaceMillerOutput,
  });
}
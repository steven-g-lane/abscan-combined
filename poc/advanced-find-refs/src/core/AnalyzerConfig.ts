export interface AnalyzerConfig {
  concreteClass: string;
  methodName: string;
  projectPath: string;   // directory or path to tsconfig.json
  fileHint?: string;     // optional substring to disambiguate impl file
  debug?: boolean;
}

export interface CodeLocation {
  file: string;
  line: number;
  column: number;
  endLine?: number; // End line for classes and methods to support source scrolling
}

export interface ClassSummary {
  name: string;
  location: CodeLocation;
  methods: MethodSummary[];
  properties: PropertySummary[];
  constructors: MethodSummary[];
  extends?: string;
  implements?: string[];
  genericParameters?: GenericParameter[];
  jsdocDescription?: string;
  isAbstract?: boolean;
  sourceLOC?: number; // Lines of code in class definition
  sourceFilename?: string; // Basename of source file for display
}

export interface MethodReference {
  location: CodeLocation;
  contextLine: string; // The actual source code line showing the reference
  context?: string; // Additional context about the usage
}

export interface MethodSummary {
  name: string;
  location: CodeLocation;
  parameters: ParameterSummary[];
  returnType?: string;
  resolvedReturnType?: string;
  displayReturnType?: string; // Simplified return type for UI display
  isStatic?: boolean;
  visibility?: 'public' | 'private' | 'protected';
  genericParameters?: GenericParameter[];
  overloads?: FunctionOverload[];
  jsdocDescription?: string;
  isAbstract?: boolean;
  isConstructor?: boolean;
  references?: MethodReference[]; // Where this method is referenced
  referenceCount?: number; // Count of references to this method
}

export interface PropertySummary {
  name: string;
  location: CodeLocation;
  type?: string;
  displayType?: string; // Simplified type for UI display
  isStatic?: boolean;
  visibility?: 'public' | 'private' | 'protected';
}

export interface ParameterSummary {
  name: string;
  type?: string;
  displayType?: string; // Simplified type for UI display
  optional?: boolean;
  defaultValue?: string;
  isRest?: boolean;
  description?: string;
}

export interface FunctionOverload {
  parameters: ParameterSummary[];
  returnType?: string;
  description?: string;
}

export interface GenericParameter {
  name: string;
  constraint?: string;
  defaultType?: string;
}

export interface FunctionSummary {
  name: string;
  location: CodeLocation;
  parameters: ParameterSummary[];
  returnType?: string;
  resolvedReturnType?: string;
  isExported?: boolean;
  genericParameters?: GenericParameter[];
  overloads?: FunctionOverload[];
  jsdocDescription?: string;
}

export interface InterfaceSummary {
  name: string;
  location: CodeLocation;
  properties: PropertySummary[];
  methods: MethodSummary[];
  extends?: string[];
  genericParameters?: GenericParameter[];
  jsdocDescription?: string;
}

export interface TypeAliasSummary {
  name: string;
  location: CodeLocation;
  type: string;
}

export interface ReactComponentSummary {
  name: string;
  location: CodeLocation;
  type: 'function' | 'class';
  propsType?: string;
}

export interface IPCSummary {
  handlers: IPCHandlerSummary[];
  invocations: IPCInvocationSummary[];
}

export interface IPCHandlerSummary {
  channel: string;
  location: CodeLocation;
  type: 'handle' | 'on';
}

export interface IPCInvocationSummary {
  channel: string;
  location: CodeLocation;
  type: 'invoke' | 'send';
}

export interface SQLiteQuerySummary {
  query: string;
  location: CodeLocation;
  method: string;
}

export interface ExportSummary {
  classes?: ClassSummary[];
  functions?: FunctionSummary[];
  interfaces?: InterfaceSummary[];
  types?: TypeAliasSummary[];
  components?: ReactComponentSummary[];
}

export interface FileSummary {
  path: string;
  kind: "main" | "renderer" | "shared" | "unknown";
  language: "ts" | "tsx" | "js" | "jsx";
  exports: ExportSummary;
  ipc?: IPCSummary;
  sqliteQueries?: SQLiteQuerySummary[];
  comments?: string[];
}

export interface ProjectSummary {
  projectRoot: string;
  scannedAt: string;
  files: FileSummary[];
  typeCatalog: TypeCatalog;
}

export interface DefinitionNode {
  id: string;
  kind: "class" | "method" | "function" | "interface" | "type" | "component";
  name: string;
  parent?: string;
  location: CodeLocation;
}

export interface ReferenceNode {
  targetId: string;
  context: "call" | "import" | "extends" | "usage";
  location: CodeLocation;
}

export interface DependencyGraph {
  definitions: DefinitionNode[];
  references: ReferenceNode[];
}

// Type Catalog Models
export interface TypeCatalogEntry {
  id: string;
  name: string;
  kind: 'interface' | 'type' | 'enum' | 'import';
  definition: string;
  fullPath: string;
  filename: string;
  location: CodeLocation;
  sourceFile?: string; // For imports, the original source file
  isLocal: boolean;
  genericParameters?: GenericParameter[];
  extends?: string[];
  implementedBy?: string[];
  unionTypes?: string[];
  intersectionTypes?: string[];
  jsdocDescription?: string;
  references?: TypeUsageReference[]; // All places where this type is used
}

export interface TypeCatalog {
  entries: TypeCatalogEntry[];
  entryMap: Map<string, TypeCatalogEntry>; // For quick lookups by ID
}

export interface TypeReference {
  typeId: string;
  displayName: string;
  fullPath?: string;
}

export interface TypeUsageReference {
  id: string;
  typeId: string; // References the type being used
  location: CodeLocation;
  context: 'parameter' | 'return' | 'variable' | 'property' | 'generic' | 'extends' | 'implements' | 'type-annotation';
  contextDetails?: string; // Additional context like function name, parameter name, etc.
  usageType: 'local' | 'imported';
  sourceText?: string; // The actual text at the usage site
}

// Class Analysis Models
export interface ClassReference {
  location: CodeLocation;
  context?: string; // Usage context details
}

export interface ComprehensiveClassSummary {
  name: string;
  id: string;
  isLocal: boolean; // true for locally defined, false for imported
  sourceModule?: string; // module path for imported classes
  location?: CodeLocation; // only for local classes
  
  // Only for local classes
  properties?: PropertySummary[];
  methods?: MethodSummary[];
  constructors?: MethodSummary[];
  extends?: string;
  implements?: string[];
  genericParameters?: GenericParameter[];
  jsdocDescription?: string;
  isAbstract?: boolean;
  
  // For all classes (local and imported)
  references: ClassReference[];
  
  // Summary metrics for grid display
  sourceLOC?: number; // Lines of code in class definition
  referenceCount?: number; // Total number of references to this class
  sourceFilename?: string; // Basename of source file for display
}

export interface ClassAnalysisResult {
  projectRoot: string;
  scannedAt: string;
  classes: ComprehensiveClassSummary[];
}
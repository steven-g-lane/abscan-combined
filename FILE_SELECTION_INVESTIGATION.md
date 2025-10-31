# File Selection and Data Flow Investigation Report

## Executive Summary

The abscan-viewer uses a **Miller Columns navigation pattern** combined with a **bottom panel** that displays file contents and data grids. Currently, **file-level abstraction analysis (classes, functions, interfaces, etc. defined in a file) is NOT implemented**. The system has all the infrastructure in place to add this feature, but needs a new data structure and transformation layer.

## 1. Current Miller Columns Data Flow

### 1.1 Data Representation

**MillerItem Interface** (`src/shared/types/miller.ts`):
```typescript
export interface MillerItem {
  name: string;
  icon?: string;
  children?: MillerItem[];
  metadata?: unknown;
}
```

**Key characteristics:**
- Simple recursive tree structure
- `name` and `icon` drive UI display
- `metadata` field is flexible (can hold any data)
- No size limit on metadata (could store large structures)

### 1.2 How Files Are Currently Represented

**File System Scanner** (`src/cli/scanner/fileSystemScanner.ts`):
- Recursively scans directories
- Creates `FileSystemEntry` objects with comprehensive metadata
- Metadata includes: size, extension, line count, MIME type, file type info, permissions, etc.
- **No abstraction analysis at this level**

**File System to Miller Columns Transform** (`src/cli/transformers/millerColumnsTransformer.ts`):
```typescript
// Creates two top-level entries:
1. "Files" - hierarchical file/folder tree
2. "Files (flat)" - flattened list of all files with fullPath, extension metadata
```

**Metadata preserved in Miller Columns:**
```typescript
metadata: {
  fullPath: entryPath,
  directory: currentPath || '/',
  extension: entry.extension
}
```

### 1.3 Click Flow in Miller Columns

**When user clicks a file in Miller Columns** (`src/viewer/renderer/components/MillerColumns.tsx`):

1. `handleItemClick(item, columnIndex, itemIndex)` is called
2. Updates selected path tracking
3. If item has `children`, populates next column
4. Calls `onItemSelect(item)` callback to parent (App.tsx)

**Selected item passes to BottomPanel** (`src/viewer/renderer/components/BottomPanel.tsx`):

1. Receives `selectedItem` as prop
2. Determines if it's a file (leaf node with no children)
3. Checks `isFile` and loads file contents via IPC: `window.electronAPI.readFileContent(filePath)`
4. Displays full source code in CodeDisplay component

**Key limitation:** Currently only shows raw file contents, no abstraction summary.

## 2. How Abstractions Are Currently Analyzed

### 2.1 Abstraction Analysis Pipeline

**CLI Analysis Phase** (`src/cli/analyzer/`):
- `classAnalyzer.ts` - Extracts classes, methods, properties, references
- `functionAnalyzer.ts` - Extracts standalone functions
- `interfaceAnalyzer.ts` - Extracts interfaces
- `enumAnalyzer.ts` - Extracts enums
- `typeAnalyzer.ts` - Extracts type aliases

Each analyzer produces a `*AnalysisResult` that contains:
```typescript
interface ClassAnalysisResult {
  projectRoot: string;
  scannedAt: string;
  classes: ComprehensiveClassSummary[]; // Includes: name, location, methods, properties, references
}
```

**Location tracking in analyses:**
```typescript
interface CodeLocation {
  file: string;      // Full path to source file
  line: number;
  column: number;
  endLine?: number;
}
```

### 2.2 Current Miller Columns Organization for Abstractions

The transformers create **ABSTRACTION-CENTRIC** navigation, not **FILE-CENTRIC**:

**ClassMillerColumnsTransformer** creates:
```
Classes (N)
├── ClassName1 [individual class entry]
│   ├── Source [CodeLocation-based navigation]
│   ├── Properties
│   │   ├── propertyName: type
│   │   │   └── References (N)
│   │   └── ...
│   ├── Methods (N)
│   │   ├── methodName(params): return
│   │   │   ├── Source
│   │   │   └── References (N)
│   │   └── ...
│   └── References (N) [where class is used]
├── ClassName2
└── ...

Class Methods (flat) (N)  [Issue #74]
├── methodName1
├── methodName2
└── ...
```

**Same pattern for:**
- Functions
- Interfaces  
- Enums
- Types
- Components

### 2.3 Aggregation Process

**Aggregator** (`src/cli/emitters/aggregator.ts`):
1. Takes individual analysis results (classes, functions, interfaces, etc.)
2. Runs each through its transformer
3. Extracts specific top-level entries
4. Combines into single `abscan.json` file

**Final structure in abscan.json:**
```
items: [
  { name: "Classes (N)", children: [...] },
  { name: "Class Methods (flat) (N)", children: [...] },
  { name: "Interfaces (N)", children: [...] },
  { name: "Enums (N)", children: [...] },
  { name: "Types (N)", children: [...] },
  { name: "Components (N)", children: [...] },
  { name: "Functions (N)", children: [...] },
  { name: "Files", children: [...] },
  { name: "Files (flat) (N)", children: [...] }
]
```

## 3. Bottom Panel Data Handling

### 3.1 What BottomPanel Currently Displays

**For directories with children:**
- FilterableChildItemsGrid showing child items with columns based on item type

**For files:**
- CodeDisplay showing raw source code
- Optional line number highlighting for reference navigation

**For special items:**
- Summary grids for abstractions (class summaries, function summaries, etc.)
- References grids showing where abstractions are used

### 3.2 Metadata Type Detection

BottomPanel checks `selectedItem.metadata.type` to determine what to display:

**Abstraction summaries:**
- `'class_summary'` - Shows classes grid
- `'function_summary'` - Shows functions grid
- `'flattened_methods_summary'` - Shows all methods grid
- `'flattened_files_summary'` - Shows all files grid
- `'method_references'` - Shows where a method is used
- etc.

**File items:**
- No specific type - just identified by `isFile` flag (no children)
- Metadata contains: `fullPath`, `directory`, `extension`

## 4. File-Level Abstraction Analysis - Current State

### 4.1 What Analysis Data Exists Per File

Each abstraction analysis includes location information pointing to specific files:

```typescript
class.location = { file: "/path/to/MyClass.ts", line: 10, endLine: 50 }
method.location = { file: "/path/to/MyClass.ts", line: 15, endLine: 25 }
function.location = { file: "/path/to/helpers.ts", line: 1, endLine: 10 }
interface.location = { file: "/path/to/types.ts", line: 30, endLine: 40 }
```

### 4.2 Missing Piece: File-to-Abstractions Reverse Mapping

**The system has:**
- Abstractions pointing to files ✓
- File system scan creating file nodes ✓
- Infrastructure to add metadata ✓

**The system lacks:**
- A way to answer: "What abstractions are defined in file X?"
- File nodes with abstraction children
- A dedicated transformer for file abstractions

## 5. Where to Inject File Contents (Abstraction Categories)

### 5.1 Best Integration Points

**Option A: Files (flat) Enhancement** (RECOMMENDED)
- When user selects a file from "Files (flat)" list
- Add children to that file entry showing:
  - Classes (N) [in this file]
  - Interfaces (N) [in this file]
  - Functions (N) [in this file]
  - Enums (N) [in this file]
  - Types (N) [in this file]
- This follows existing pattern: abstractions navigate down from files

**Option B: Hybrid Files View in MillerColumns**
- Enhanced hierarchical view in "Files" tree
- File nodes expand to show abstraction categories
- More discoverable but requires deeper changes

**Option C: New "Files with Abstractions" Entry**
- Parallel to "Files (flat)"
- Pre-built mapping of file → abstractions
- Fastest to implement

### 5.2 Data Flow for File Abstractions

**Step 1: Build reverse mapping during analysis**
```typescript
// In analyzer or aggregator
const fileToAbstractions: Map<string, {
  classes: ClassSummary[],
  functions: FunctionSummary[],
  interfaces: InterfaceSummary[],
  enums: EnumSummary[],
  types: TypeAliasSummary[]
}> = new Map();

// Iterate all analyses and group by file location
classes.forEach(cls => {
  const file = cls.location.file;
  fileToAbstractions.get(file)?.classes.push(cls);
});
```

**Step 2: Create file abstraction entries in transformer**
```typescript
const fileAbstractionEntry = {
  item_name: fileName,
  lucide_icon: 'file-code',
  metadata: {
    fullPath: filePath,
    extension: '.ts',
    type: 'file'
  },
  children: [
    {
      item_name: `Classes (${classCount})`,
      lucide_icon: 'file-code-2',
      children: classesInFile.map(...),
      metadata: { type: 'file_classes_summary', ... }
    },
    {
      item_name: `Interfaces (${interfaceCount})`,
      lucide_icon: 'circle-dot',
      children: interfacesInFile.map(...),
      metadata: { type: 'file_interfaces_summary', ... }
    },
    // ... similar for functions, enums, types
  ]
};
```

**Step 3: Add to Files (flat) entry in aggregator**
```typescript
// In aggregateData(), enhance Files (flat) children
const filesFlat = fileSystemResult.entries
  .map(file => ({
    name: file.name,
    children: [ // NEW: abstraction children
      classesInFile,
      functionsInFile,
      etc...
    ]
  }));
```

**Step 4: BottomPanel handles file abstraction grids**
```typescript
// In BottomPanel renderContent()
const isFileClassesSummary = selectedItem?.metadata?.type === 'file_classes_summary';
if (isFileClassesSummary) {
  return <FilterableChildItemsGrid
    data={selectedItem.metadata.summaryData}
    columns={classSummaryGridColumns}
    // ... rest of config
  />;
}
```

## 6. Key Infrastructure Already in Place

### 6.1 Metadata Fields
- `metadata.type` - Identifies what kind of item this is
- `metadata.summaryData` - Can hold processed grid data
- `metadata.referencesData` - Pattern for holding reference lists
- Arbitrary metadata can store file/location info

### 6.2 Grid System
- `FilterableChildItemsGrid` - Handles double-click navigation
- Grid configurations defined for every abstraction type
- Pattern: `classSummaryGridColumns`, `functionsGridColumns`, etc.

### 6.3 Navigation Callbacks
- `handleGridRowNavigation` - Converts grid clicks to Miller column navigation
- Already handles mapping between summary data and Miller items
- Can be extended for file abstractions

### 6.4 File System Data
- Full file paths available in metadata
- Line information preserved in abstractions for scrolling
- FileTypeInfo available for syntax highlighting

## 7. Current Limitations

1. **No file-to-abstractions reverse mapping** - Need to build this
2. **File nodes are leaves** - Currently have no children in Miller columns
3. **Abstractions are grouped by type** - Would need to add file-level grouping
4. **Aggregator runs CLI analysis** - File mapping needs to happen here or in transformers
5. **No "file abstractions" metadata type** - Needs new types in BottomPanel

## 8. Implementation Order (Recommended)

1. **Create file abstraction reverse mapping** (aggregator or new module)
   - Group abstractions by source file
   - Handle missing file entries
   
2. **Extend Files (flat) transformer** (or create new transformer)
   - Add abstraction children to file entries
   - Create summary data for grids

3. **Add new metadata types** (BottomPanel)
   - `file_classes_summary`
   - `file_interfaces_summary`
   - `file_functions_summary`
   - etc.

4. **Add grid rendering** (BottomPanel)
   - Handle each new metadata type
   - Reuse existing grid configurations

5. **Test navigation flow**
   - File → Classes grid → Class in Miller columns
   - Ensure grid row double-click works

## 9. Example: Complete User Flow

```
User selects: "Files (flat)" in Miller Columns
  → Column shows: utils.ts, helpers.ts, index.ts, ...

User clicks: helpers.ts
  → BottomPanel shows:
    Classes (2)
    Interfaces (0)
    Functions (4)
    [File size, extension, path]

User double-clicks: "Classes (2)" in grid or navigates in Miller column
  → Next column shows: MyClass1, MyClass2

User clicks: MyClass1
  → BottomPanel shows class structure (existing behavior)
  → Source, Properties, Methods, References sections
```

## 10. Data Structures Needed

```typescript
// New in BottomPanel metadata
type FileAbstractionSummaryType = 
  | 'file_classes_summary'
  | 'file_interfaces_summary'
  | 'file_functions_summary'
  | 'file_enums_summary'
  | 'file_types_summary';

interface FileAbstractionMetadata {
  type: FileAbstractionSummaryType;
  filePath: string;
  fileName: string;
  extension: string;
  summaryData: Array<{
    item_name: string;
    lucide_icon: string;
    metadata: Record<string, unknown>;
  }>;
}

// Intermediate mapping (during aggregation)
interface FileAbstractionIndex {
  [filePath: string]: {
    classes: ClassSummary[];
    interfaces: InterfaceSummary[];
    functions: FunctionSummary[];
    enums: EnumSummary[];
    types: TypeAliasSummary[];
  };
}
```

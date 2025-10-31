# Codebase Architecture Analysis for File Contents Tracking (Issues #89, #90)

## Executive Summary

This document provides a comprehensive exploration of the abscan-combined codebase to understand how to implement file contents tracking with classes category. The implementation will allow selecting TS/JS files to show abstraction categories (Classes, Functions, etc.) in Miller columns, with Classes as the first implementation.

## 1. Miller Columns Architecture

### 1.1 Core Data Structures

**Location:** `/src/shared/types/miller.ts`

```typescript
export interface MillerItem {
  name: string;
  icon?: string;
  children?: MillerItem[];
  metadata?: unknown;
}

export interface MillerData {
  items: MillerItem[];
  root?: string;
}
```

**Key Points:**
- Single source of truth for all Miller column data
- Generic metadata field allows flexibility for various data types
- Normalized from raw JSON via `normalizeMillerItem()` and `normalizeMillerData()`
- Supports hierarchical navigation with children

### 1.2 Miller Columns Component

**Location:** `/src/viewer/renderer/components/MillerColumns.tsx`

**Core Functionality:**
- Manages 4-column layout with horizontal scrolling
- Listens for data via electronAPI: `onLoadMillerData()`, `onLoadMillerDataError()`
- Tracks selection state with `selectedPath` (indices) and `selectedItems` (objects)
- Exposes imperative handle for external manipulation via `handleItemClick()`
- Renders items with dynamic icon support (kebab-case to PascalCase conversion)

**Key Methods:**
- `handleItemClick()`: Updates selection, populates next column with children, notifies parent
- `renderIcon()`: Converts icon names from lucide-react library
- Dynamic breadcrumb footer showing selected path

**Selection Flow:**
```
User clicks item
→ handleItemClick() triggered
→ selectedPath updated (column index → item index)
→ selectedItems updated (column index → item object)
→ onItemSelect() callback fired
→ Next column populated with item.children
→ Subsequent columns cleared
```

### 1.3 Grid Display System

**Location:** `/src/viewer/renderer/components/ChildItemsGrid.tsx`

**Features:**
- Generic TanStack Table-based grid with type support
- Single/double-click handlers: `onRowClick` (selection) vs `onRowDoubleClick` (navigation)
- Row highlighting on selection
- Column sorting support
- Handles potential rendering errors gracefully

**Configuration Pattern:**
- `GridColumnConfig<T>` interface defines column specifications
- `accessorKey` for simple property access (dot notation supported)
- `accessorFn` for complex value extraction
- Custom `cell` renderers for UI control
- Size constraints: `size`, `minSize`, `maxSize`

### 1.4 Grid Configurations

**Location:** `/src/viewer/renderer/components/gridConfigurations.tsx`

**Existing Grid Types:**
1. `directoryGridColumns` - Full file metadata (name, size, permissions, owner, group)
2. `featurelessGridColumns` - Simple name-only display for navigation-only items
3. `classSummaryGridColumns` - Class Name, Source File, Source LOC, References
4. `methodGridColumns` - Method Name, Parameters, Source LOC, Reference Count
5. `propertyGridColumns` - Property Name, Type, Visibility, References
6. `flattenedMethodsGridColumns` - Method Name, Class Name, Parameters, Source LOC, Reference Count
7. `functionsGridColumns` - Function signatures, source file, line count, references
8. `componentsGridColumns` - Component Name, Source File, Line Count
9. Reference grids (methods, classes, interfaces, types, enums)

**Pattern for Custom Grids:**
```typescript
export const classSummaryGridColumns: GridColumnConfig<ClassSummaryGridItem>[] = [
  {
    id: 'className',
    header: 'Class Name',
    accessorFn: (row) => row.metadata?.name || 'Unknown',
    cell: ({ row }) => { /* custom rendering */ },
    size: 200,
    minSize: 150,
  },
  // Additional columns...
];
```

**Metadata Preservation:**
- Grid items can carry full `metadata` object
- Used to store original data for drill-down operations
- Common pattern: `metadata.type` for item classification

## 2. Class Analysis System

### 2.1 Class Analyzer

**Location:** `/src/cli/analyzer/classAnalyzer.ts`

**Architecture:**
- Three-pass analysis system:
  1. **Cataloging Phase**: Extracts local classes + imports from source files
  2. **Reference Finding Phase**: Scans identifiers to find class references
  3. **Method Reference Phase**: Batch processing of method/property references

**Key Data Structures:**

```typescript
export interface ComprehensiveClassSummary {
  name: string;
  id: string;
  isLocal: boolean;
  sourceModule?: string;  // For imported classes
  location?: CodeLocation; // Only local classes
  
  // Local class details
  properties?: PropertySummary[];
  methods?: MethodSummary[];
  constructors?: MethodSummary[];
  extends?: string;
  implements?: string[];
  
  // All classes
  references: ClassReference[];
  sourceLOC?: number;
  referenceCount?: number;
  methodCount?: number;
  sourceFilename?: string;
}
```

**Performance Optimizations:**
- Class name index for O(1) lookup by name: `classNameIndex: Map<string, string[]>`
- Batch reference tracking via `BatchReferenceTracker` to avoid O(n²) complexity
- Filtered file loading with exclusion of test/build directories

**Reference Types Supported:**
- Instantiation (`new ClassName()`)
- Type annotations (`className: Type`)
- Inheritance/implementation
- Variable declarations
- Parameter types
- Property definitions

### 2.2 Class Extraction

**Location:** `/src/cli/extractors/classExtractor.ts`

**Extracted Information:**
- Class name and location (line/column)
- Methods (with parameters, return types, visibility, modifiers)
- Properties (with types, visibility)
- Constructors
- Generic parameters
- JSDoc descriptions
- Extends/implements relationships
- Abstract indicator

**Properties per Method/Property:**
```typescript
export interface MethodSummary {
  name: string;
  location: CodeLocation;
  parameters: ParameterSummary[];
  returnType?: string;
  displayReturnType?: string; // Simplified for UI
  isStatic?: boolean;
  visibility?: 'public' | 'private' | 'protected';
  references?: MethodReference[];
  referenceCount?: number;
}
```

### 2.3 Analysis Result Format

**Location:** `/src/cli/models/index.ts`

```typescript
export interface ClassAnalysisResult {
  projectRoot: string;
  scannedAt: string;
  classes: ComprehensiveClassSummary[];
}
```

## 3. Miller Columns Transformation System

### 3.1 Class Miller Columns Transformer

**Location:** `/src/cli/transformers/classMillerColumnsTransformer.ts`

**Key Concept:** Converts `ClassAnalysisResult` into navigable Miller column structure

**Structure Created:**
```
Classes (count)
├── ClassName1
│   ├── Source
│   ├── Properties (count)
│   │   ├── propertyName: type
│   │   │   └── References (count)
│   │   │       ├── file:line
│   │   │       └── file:line
│   │   └── propertyName2: type2
│   ├── Methods (count)
│   │   ├── methodName(params): returnType
│   │   │   ├── Source
│   │   │   └── References (count)
│   │   └── methodName2(params)
│   └── References (count)
│       ├── file:line
│       └── file:line
└── ClassName2
    └── ...

Class Methods (flat)
├── methodName1
├── methodName2
└── methodName3
```

**Key Features:**
- **featurelessChildren** flag: marks items that should use simple navigation (no grid)
- Two top-level entries: "Classes (count)" and "Class Methods (flat) (count)"
- Metadata attached to each entry for drill-down operations
- File type info from filesystem scan

**Transformation Functions:**
- `transformClassToMillerColumns()`: Single class → Miller entry
- `transformClassAnalysisToMillerColumns()`: Full analysis → Miller result with both entries
- `emitClassMillerColumnsJson()`: Write to file

**Output Type:**
```typescript
export interface ClassMillerColumnsResult {
  root: string;
  transformedAt: string;
  column_entries: ClassMillerColumnsEntry[]; // Classes + Class Methods entries
}
```

### 3.2 Generic Miller Columns Transformer (File System)

**Location:** `/src/cli/transformers/millerColumnsTransformer.ts`

**Key Feature:** Creates file content categories for TS/JS files

**Function:** `createFileContentCategories()`
- Filters classes by file path (normalized path comparison)
- Creates category entries for each abstraction type found in file
- Each category has individual item entries as children

**Example Output for File with 2 Classes:**
```
Files
└── myfile.ts
    ├── Classes (2)
    │   ├── ClassName1
    │   │   ├── Source
    │   │   ├── Methods
    │   │   └── Properties
    │   └── ClassName2
    │       └── ...
    ├── Functions (0)
    └── Interfaces (0)
```

**Implemented Categories:**
1. Classes (with child drilldown)
2. Functions (placeholder)
3. Interfaces (placeholder)
4. Enums (placeholder)
5. Types (placeholder)

**Metadata Pattern:**
```typescript
metadata: {
  type: 'file_content_category',
  categoryType: 'classes', // or 'functions', 'interfaces', etc.
  sourceFile: filePath,
  count: fileClasses.length,
  items: fileClasses // Original analysis result items
}
```

### 3.3 Data Aggregation

**Location:** `/src/cli/emitters/aggregator.ts`

**Flow:**
1. Reads architecture.json and dependencies.json
2. Transforms each analysis result to Miller columns format
3. Converts to standardized `MillerItem` format
4. Combines all entries into single `MillerData` output

**Entry Order in aggregated output:**
1. Classes
2. Class Methods (flat)
3. Interfaces
4. Enums
5. Types
6. Components
7. Functions
8. Files
9. Files (flat)

**Standardization:**
- Converts `item_name` → `name`
- Converts `lucide_icon` → `icon`
- Preserves metadata
- Uses `normalizeMillerItem()` for consistency

## 4. Data Flow from File Selection to Display

### 4.1 Complete Flow

```
User clicks TypeScript file in Miller columns
↓
MillerColumns.handleItemClick() fires
↓
selectedItem updated in App.tsx
↓
App passes selectedItem to BottomPanel
↓
BottomPanel analyzes metadata.type to determine grid type
↓
BottomPanel renders appropriate GridColumnConfig
↓
Grid displays with row click/double-click handlers
↓
Double-click on grid row
↓
BottomPanel.handleGridRowNavigation() triggered
↓
Finds corresponding Miller column item in selectedItem.children
↓
Calls millerColumnsRef.current.handleItemClick()
↓
Miller columns updated, next column populated
```

### 4.2 Metadata Type Classifications

**Location:** `/src/viewer/renderer/components/BottomPanel.tsx` (lines 56-70)

Supported metadata types for grid routing:
- `class_summary` → uses `classSummaryGridColumns`
- `flattened_methods_summary` → uses `flattenedMethodsGridColumns`
- `file_content_category` → routes based on `categoryType`
- `interface_summary`, `enum_summary`, `type_summary`, etc.
- `function_summary`, `component_summary`
- Navigation sections: "Methods", "Functions", "Components"

### 4.3 Selection Highlighting

Pattern: Grid row click → visual highlight (blue-500/20 background with left border)
Navigation: Grid row double-click → Miller column drill-down

## 5. File Type Detection System

### 5.1 File Type Detector

**Location:** `/src/cli/utils/fileTypeDetector.ts`

**Multi-Stage Detection Pipeline:**
1. Extension-based (mime-types library)
2. Content-based (file-type library) 
3. Binary detection fallback (isbinaryfile)
4. Code detection pipeline (MIME, shebang, modelines, extension, structure)
5. Executable detection (extension, basename, directory, shebang)

**Result Structure:**
```typescript
export interface FileDetectionResult {
  isBinaryFile: boolean;
  mimeType: string;
  confidence: 'high' | 'medium' | 'low';
  detectionMethod: 'extension' | 'content' | 'fallback';
  isCode: boolean;
  languageHint: string;
  codeConfidence: 'high' | 'medium' | 'low';
  codeDetectionMethod: 'mime' | 'shebang' | 'modeline' | 'extension' | 'structure';
  isExecutable: boolean;
  executableConfidence: 'high' | 'medium' | 'low';
  executableReason: string;
}
```

**Key Classification:**
- TS/JS files identified with high confidence
- Extension mapping: `.ts`, `.tsx`, `.js`, `.jsx` → all marked as code, executable

## 6. Key Integration Points for Implementation

### 6.1 Metadata Flow for Classes Category

**When file selected in Miller columns:**
```
File item metadata structure:
{
  fullPath: string,
  extension: '.ts' | '.tsx' | '.js' | '.jsx',
  fileTypeInfo: {
    isBinaryFile: false,
    isCode: true,
    languageHint: 'typescript'
  }
}
```

**File content category metadata:**
```
{
  type: 'file_content_category',
  categoryType: 'classes',
  sourceFile: filePath,
  count: N,
  items: ComprehensiveClassSummary[] // Original analysis objects
}
```

### 6.2 Grid Configuration Selection Logic

In BottomPanel:
```typescript
if (selectedItem?.metadata?.type === 'file_content_category' && 
    selectedItem?.metadata?.categoryType === 'classes') {
  // Use classSummaryGridColumns
  // But with metadata from selectedItem.metadata.items for drill-down
}
```

### 6.3 Children Mapping for Summary Grids

Summary grids need both:
1. `summaryData`: Processed data for grid display
2. `children`: Original Miller column items for navigation

Pattern:
```typescript
children: classEntries // MillerColumnEntry[] with drill-down structure
metadata: {
  summaryData: processedForGrid // Flattened for grid display
}
```

## 7. Existing Implementation Patterns

### 7.1 File Content Category Implementation

**Location:** `/src/cli/transformers/millerColumnsTransformer.ts` (lines 268-461)

**Pattern for Categories:**
```typescript
const fileClasses = analysisResults.classes.classes.filter(cls => {
  // Path normalization and matching
  return normalizeFilePath(cls.location.file).endsWith(normalizedFilePath);
});

const classChildren = fileClasses.map(cls => ({
  item_name: cls.name,
  lucide_icon: 'box',
  metadata: {
    type: 'class_detail',
    classData: cls,
    sourceFile: filePath
  },
  children: [
    {
      item_name: 'Source',
      lucide_icon: 'file-text',
      metadata: { /* location info */ }
    },
    {
      item_name: `Methods (${cls.methods?.length || 0})`,
      lucide_icon: 'zap',
      metadata: { /* methods info */ }
    },
    // Additional sections...
  ]
}));

categories.push({
  item_name: `Classes (${fileClasses.length})`,
  lucide_icon: 'box',
  metadata: {
    type: 'file_content_category',
    categoryType: 'classes',
    sourceFile: filePath,
    count: fileClasses.length,
    items: fileClasses
  },
  children: classChildren
});
```

### 7.2 Flattenable Collections Pattern

**Example:** Class Methods (flat)

Used for:
- Creating searchable lists of all items of a type
- Enabling cross-file navigation
- Providing alternate navigation view

**Pattern:**
```typescript
const flattenedMethods = [];
classAnalysisResult.classes.forEach(classData => {
  classData.methods.forEach(method => {
    flattenedMethods.push({
      item_name: method.name,
      metadata: {
        type: 'method',
        className: classData.name,
        methodName: method.name,
        method: method,
        sourceFile: classData.location.file
      }
    });
  });
});

// Create entry with flatteningPattern
column_entries.push({
  item_name: `Class Methods (flat) (${flattenedMethods.length})`,
  lucide_icon: 'zap',
  children: flattenedMethods
});
```

## 8. Data Structure Summary

### 8.1 Key Interfaces Hierarchy

```
MillerData
├── items: MillerItem[]
│   ├── name: string
│   ├── icon: string
│   ├── metadata: unknown
│   └── children?: MillerItem[]
└── root: string

ComprehensiveClassSummary
├── name: string
├── id: string
├── isLocal: boolean
├── location?: CodeLocation
├── properties?: PropertySummary[]
├── methods?: MethodSummary[]
├── constructors?: MethodSummary[]
├── references: ClassReference[]
├── sourceFilename?: string
├── sourceLOC?: number
└── referenceCount?: number

MethodSummary / PropertySummary
├── name: string
├── location: CodeLocation
├── type?: string / returnType?: string
├── visibility: 'public' | 'private' | 'protected'
├── parameters?: ParameterSummary[]
└── references?: MethodReference[] / PropertyReference[]
```

### 8.2 File to Classes Mapping

**File Path Matching Logic:**
```typescript
const normalizeFilePath = (path: string): string => {
  return path.replace(/\\/g, '/'); // Windows → Unix
};

const fileClasses = analysisResults.classes.classes.filter(cls => {
  return normalizeFilePath(cls.location.file).endsWith(normalizedFilePath) ||
         normalizeFilePath(cls.location.file) === normalizedFilePath;
});
```

**Why two-condition match:**
- `.endsWith()`: Handles relative path variations
- `===`: Ensures exact match for absolute paths

## 9. UI Flow Details

### 9.1 Selection Highlighting

Pattern in MillerColumns:
```typescript
className={`... ${selectedPath[columnIndex] === itemIndex ? 'bg-[#555] text-white' : ''}`}
```

Pattern in ChildItemsGrid:
```typescript
className={`... ${isSelected ? 'bg-blue-500/20 border-l-2 border-blue-500' : ''} ...`}
```

### 9.2 Breadcrumb Display

Miller columns footer shows path:
```typescript
{selectedItems.map(item => getItemName(item)).join(' > ')}
```

### 9.3 Column State Tracking

App.tsx tracks:
- `selectedItem`: Currently selected item
- `currentColumnIndex`: Which column user last clicked
- `scanRoot`: Project root for relative path resolution

BottomPanel receives these and uses for:
- Grid routing based on item type
- Navigation click handling (knows which column to target next)
- File path resolution for code display

## 10. Key Files Reference

### CLI/Analyzer Layer
- Class analysis: `/src/cli/analyzer/classAnalyzer.ts`
- Class extraction: `/src/cli/extractors/classExtractor.ts`
- Miller transformation: `/src/cli/transformers/classMillerColumnsTransformer.ts`
- File system transformer: `/src/cli/transformers/millerColumnsTransformer.ts`
- Data aggregation: `/src/cli/emitters/aggregator.ts`
- File type detection: `/src/cli/utils/fileTypeDetector.ts`

### Renderer/UI Layer
- Miller columns component: `/src/viewer/renderer/components/MillerColumns.tsx`
- Bottom panel display: `/src/viewer/renderer/components/BottomPanel.tsx`
- Grid component: `/src/viewer/renderer/components/ChildItemsGrid.tsx`
- Grid configurations: `/src/viewer/renderer/components/gridConfigurations.tsx`
- Filterable grid: `/src/viewer/renderer/components/FilterableChildItemsGrid.tsx`
- Main app: `/src/viewer/renderer/App.tsx`

### Data Types
- Shared types: `/src/shared/types/miller.ts`
- Models: `/src/cli/models/index.ts`

## 11. Implementation Checklist for Issues #89 and #90

### Phase 1: Core File Content Categories (Issue #89)
- [x] File type detection system exists and works
- [x] Class analysis system exists with full data
- [x] Miller columns transformer can create file content categories
- [x] Aggregator can include file content categories in output
- [ ] Verify file content categories appear in Miller columns when file selected
- [ ] Test drill-down from category to individual items
- [ ] Test navigation from grid rows to Miller columns

### Phase 2: Classes Category Display (Issue #90)
- [x] Grid configuration exists for class summary
- [x] Class drill-down structure in transformer
- [x] Metadata routing in BottomPanel
- [ ] Test class grid displays with correct columns
- [ ] Test class double-click navigates to class details
- [ ] Test properties and methods drill-down
- [ ] Test references navigation

### Phase 3: Future Categories (Functions, Interfaces, Enums, Types)
- [x] Infrastructure for file content categories exists
- [ ] Implement Functions category similarly
- [ ] Implement Interfaces category similarly
- [ ] Implement Enums category similarly
- [ ] Implement Types category similarly

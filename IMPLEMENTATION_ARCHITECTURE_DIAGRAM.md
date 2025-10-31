# Implementation Architecture Diagrams

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION FLOW                         │
├─────────────────────────────────────────────────────────────────────┤

1. FILE SELECTION IN MILLER COLUMNS
   ├─ User clicks .ts file in Files > [directory] > [file]
   ├─ MillerColumns.handleItemClick() executes
   ├─ selectedPath and selectedItems updated
   └─ onItemSelect() callback fires with file item

2. FILE METADATA ANALYSIS
   ├─ BottomPanel receives selectedItem
   ├─ Checks: selectedItem.metadata.extension
   ├─ Detects: .ts, .tsx, .js, .jsx → code file
   └─ Routes to appropriate grid configuration

3. GRID DISPLAY
   ├─ For file_content_category + categoryType='classes':
   │  ├─ Renders classSummaryGridColumns
   │  ├─ Shows: Class Name, Source File, Source LOC, References
   │  └─ Data comes from selectedItem.children
   └─ User can click/double-click rows

4. GRID NAVIGATION
   ├─ User double-clicks class name in grid
   ├─ BottomPanel.handleGridRowNavigation() triggers
   ├─ Finds matching item in selectedItem.children
   ├─ Calls millerColumnsRef.handleItemClick()
   └─ Miller columns advances, shows class details

5. CLASS DETAILS DISPLAY
   ├─ MillerColumns now shows:
   │  ├─ Source (navigation to class definition)
   │  ├─ Properties (N) → drill down to properties
   │  ├─ Methods (N) → drill down to methods
   │  └─ References (N) → drill down to usages
   └─ User can navigate further
```

## Data Structure Transformations

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CLI ANALYSIS & TRANSFORMATION                    │
├─────────────────────────────────────────────────────────────────────┤

STEP 1: CLASS EXTRACTION (classExtractor.ts)
┌─────────────────────────┐
│  SourceFile (myclass.ts)│
│  ├─ ClassDeclaration    │
│  │  ├─ name: "MyClass"  │
│  │  ├─ methods: [...]   │
│  │  └─ properties: [...] │
│  └─ ...                 │
└─────────────────────────┘
            ↓
      Extracts classes
            ↓
┌─────────────────────────┐
│   ClassSummary[]        │
└─────────────────────────┘

STEP 2: CLASS ANALYSIS (classAnalyzer.ts)
Pass 1: Cataloging
├─ Extract local classes from all files
├─ Extract imported classes from all files
└─ Build classNameIndex: Map<className, classId[]>

Pass 2: Reference Finding
├─ Scan all identifiers
├─ Match against classRegistry
├─ Add references to each class

Pass 3: Method References
├─ Batch track method/property references
├─ Apply references to classes
└─ Calculate referenceCounts

Result:
┌──────────────────────────────┐
│ ClassAnalysisResult          │
│ ├─ projectRoot: string       │
│ ├─ scannedAt: string         │
│ └─ classes: [               │
│    ComprehensiveClassSummary │
│    ├─ name                   │
│    ├─ isLocal                │
│    ├─ methods[]              │
│    ├─ properties[]           │
│    ├─ references[]           │
│    └─ sourceFilename         │
│   ]                          │
└──────────────────────────────┘

STEP 3: FILE SYSTEM SCANNING (fileSystemScanner + fileTypeDetector)
┌─────────────────────────┐
│   File System Tree      │
│   ├─ src/              │
│   │  ├─ myclass.ts     │
│   │  ├─ utils.ts       │
│   │  └─ ...            │
│   └─ ...               │
└─────────────────────────┘
            ↓
   File type detection
   (extension, content, binary)
            ↓
┌──────────────────────────────┐
│ FileSystemResult             │
│ ├─ root: string              │
│ └─ entries: [                │
│    FileSystemEntry           │
│    ├─ name: string           │
│    ├─ type: 'file'|'dir'     │
│    ├─ extension: string      │
│    ├─ metadata:              │
│    │  ├─ fullPath            │
│    │  ├─ fileTypeInfo        │
│    │  └─ ...                 │
│    └─ children?              │
│   ]                          │
└──────────────────────────────┘

STEP 4: MILLER COLUMNS TRANSFORMATION (millerColumnsTransformer.ts)
For each TS/JS file with classes:
┌──────────────────────────────────────┐
│ File: myclass.ts                     │
│ ├─ classes: [MyClass, OtherClass]   │
│ └─ ...                              │
└──────────────────────────────────────┘
                ↓
    createFileContentCategories()
                ↓
┌──────────────────────────────────────┐
│ File Content Categories              │
│ ├─ item_name: "Classes (2)"         │
│ ├─ lucide_icon: "box"                │
│ ├─ metadata:                         │
│ │  ├─ type: "file_content_category" │
│ │  ├─ categoryType: "classes"        │
│ │  ├─ count: 2                       │
│ │  └─ items: [                       │
│ │     ComprehensiveClassSummary[]    │
│ │    ]                               │
│ └─ children: [                       │
│    {                                 │
│      item_name: "MyClass",           │
│      lucide_icon: "box",             │
│      children: [                     │
│        { item_name: "Source", ... }, │
│        { item_name: "Methods", ... },│
│        { item_name: "Properties" },  │
│        { item_name: "References" }   │
│      ]                               │
│    },                                │
│    { item_name: "OtherClass", ... }  │
│   ]                                  │
└──────────────────────────────────────┘

STEP 5: AGGREGATION (aggregator.ts)
Multiple analysis results combined:
┌────────────────────────────────┐
│ MillerData (standardized)       │
│ ├─ root: string                │
│ └─ items: [                    │
│    MillerItem with standard    │
│    name/icon/children/metadata │
│   ]                            │
│ - Classes                      │
│ - Class Methods (flat)         │
│ - Interfaces                   │
│ - Enums                        │
│ - Types                        │
│ - Components                   │
│ - Functions                    │
│ - Files                        │
│ - Files (flat)                 │
└────────────────────────────────┘
            ↓
    JSON written to disk
    (abscan.json)
```

## Runtime Component Interaction

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RENDERER COMPONENT ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────────┤

App.tsx (Main Container)
├─ State:
│  ├─ selectedItem: MillerColumnEntry
│  ├─ currentColumnIndex: number
│  ├─ scanRoot: string
│  └─ currentScanConfig: { ... }
├─ Refs:
│  └─ millerColumnsRef: MillerColumnsRef
└─ Event Handlers:
   ├─ handleItemSelection(item) → setSelectedItem
   ├─ handleColumnStateChange(index) → setCurrentColumnIndex
   └─ handleScanRootChange(root) → setScanRoot

         ↓
    [Passes props down]
         ↓

┌──────────────────────────────────────────────────────────────┐
│ MillerColumns (ref: millerColumnsRef)                        │
├──────────────────────────────────────────────────────────────┤
│ State:                                                       │
│ ├─ columns: MillerColumnEntry[][]                           │
│ ├─ selectedPath: number[]                                   │
│ ├─ selectedItems: MillerColumnEntry[]                       │
│ └─ currentColumnIndex: number                               │
│                                                             │
│ Input:                                                      │
│ ├─ onItemSelect(item) → App.handleItemSelection            │
│ ├─ onColumnStateChange(index) → App.handleColumnStateChange│
│ └─ onScanRootChange(root) → App.handleScanRootChange       │
│                                                             │
│ Render: 4-column layout                                     │
│ ├─ Column 0: Root items (Files, Classes, Functions, etc.)  │
│ ├─ Column 1: Selected root item's children                 │
│ ├─ Column 2: Selected child's children                     │
│ └─ Column 3: Further drill-down                            │
│                                                             │
│ Footer: Breadcrumb path display                            │
└──────────────────────────────────────────────────────────────┘

         ↓
    [selectedItem updated]
         ↓

┌──────────────────────────────────────────────────────────────┐
│ BottomPanel (container for grid or code display)             │
├──────────────────────────────────────────────────────────────┤
│ Inputs:                                                      │
│ ├─ selectedItem: MillerColumnEntry                          │
│ ├─ currentColumnIndex: number                               │
│ ├─ scanRoot: string                                         │
│ └─ millerColumnsRef: RefObject<MillerColumnsRef>            │
│                                                             │
│ Metadata Type Routing:                                      │
│ ├─ 'file_content_category' + 'classes'                     │
│ │  → ClassSummaryGrid                                       │
│ ├─ 'method' → MethodGrid                                    │
│ ├─ 'property' → PropertyGrid                                │
│ ├─ 'class_summary' → ClassSummaryGrid                       │
│ ├─ (other categories) → appropriate grid                    │
│ └─ (code file) → CodeDisplay                               │
│                                                             │
│ Grid Row Handlers:                                          │
│ ├─ onRowClick(item) → selection highlighting                │
│ └─ onRowDoubleClick(item)                                   │
│    → handleGridRowNavigation()                              │
│    → finds matching Miller item in children                 │
│    → calls millerColumnsRef.handleItemClick()              │
│    → Miller columns drill down continues                    │
└──────────────────────────────────────────────────────────────┘

         ↓
    [Renders one of]
         ↓

┌──────────────────────────────────────────────────────────────┐
│ ChildItemsGrid or FilterableChildItemsGrid                   │
├──────────────────────────────────────────────────────────────┤
│ Inputs:                                                      │
│ ├─ data: T[] (grid items)                                   │
│ ├─ columns: GridColumnConfig<T>[]                           │
│ └─ handlers:                                                │
│    ├─ onRowClick(item, rowIndex)                            │
│    └─ onRowDoubleClick(item, rowIndex)                      │
│                                                             │
│ Features:                                                   │
│ ├─ TanStack Table with sorting                             │
│ ├─ Row selection highlighting                              │
│ ├─ Custom column renderers                                 │
│ └─ (FilterableChildItemsGrid adds search)                  │
│                                                             │
│ Row Click Flow:                                             │
│ └─ Triggers onRowClick or onRowDoubleClick                 │
│    → Passed to parent (BottomPanel)                         │
│    → Handled in BottomPanel handlers                        │
└──────────────────────────────────────────────────────────────┘
```

## Class Details Drill-Down Sequence

```
File Selection → Classes Category → Class Details

Step 1: User clicks .ts file in Miller columns
┌──────────────────────────┐
│ Files (drill-down)        │
│ ├─ src/                  │
│ │  ├─ myclass.ts  ◄─ USER CLICKS HERE
│ │  └─ ...         │
│ └─ ...            │
└──────────────────────────┘

Step 2: MillerColumns navigates, BottomPanel shows classes
┌──────────────────────────┐
│ Files                    │ Files (...)      │ Classes (2)      │
│ ├─ src/ ◄─ selected      │ ├─ Classes (2)   │ ├─ MyClass       │
│ │  ├─ myclass.ts ◄─ sel  │ │  ├─ MyClass    │ ├─ OtherClass    │
│ │  └─ ...                │ │  └─ OtherClass  │ └─ ...           │
│ └─ ...                   │ ├─ Functions (0) │                  │
│ (Miller Column 0)        │ └─ Interfaces(0) │ (Miller Column 2)│
│                          │ (Miller Column 1)│                  │
│                                                                │
│ BottomPanel shows:                                             │
│ Grid with: Class Name, Source File, Source LOC, References   │
│ Data: selectedItem.children (from aggregated data)           │
└──────────────────────────┘

Step 3: User double-clicks "MyClass" in grid
┌──────────────────────────┐
│ handleGridRowNavigation()│
│ ├─ Find matching item in│
│ │  selectedItem.children│
│ ├─ Call millerColumnsRef│
│ │  .handleItemClick()   │
│ └─ Pass item & column   │
└──────────────────────────┘

Step 4: Miller columns advances
┌──────────────────────────┐
│ Classes (2)      │ MyClass              │ (Methods/Props)  │
│ ├─ MyClass       │ ├─ Source            │ ├─ method1()     │
│ │    ◄─ selected │ ├─ Methods (5) ◄─ sel│ ├─ method2()     │
│ ├─ OtherClass    │ ├─ Properties (3)    │ └─ ...           │
│ └─ ...           │ └─ References (12)   │ (drill-down)     │
│ (Miller Column 2)│ (Miller Column 3)    │                  │
│                                                            │
│ BottomPanel shows:                                         │
│ Methods grid for MyClass with: Name, Params, LOC, Refs    │
└──────────────────────────┘

Step 5: User can continue drilling down
├─ Click "Source" → code display at class definition
├─ Click method in Methods grid → drill to method details
├─ Click "References" → references grid showing usages
└─ etc.
```

## Grid Configuration Routing Logic

```
selectedItem received by BottomPanel
        ↓
    Analyze metadata
        ↓
    ┌─────────────────────────────────────────────────────┐
    │ if (metadata.type === 'file_content_category')      │
    │   ├─ if (metadata.categoryType === 'classes')       │
    │   │  ├─ columns = classSummaryGridColumns           │
    │   │  ├─ data = selectedItem.children                │
    │   │  └─ metadata.summaryData used for filtering     │
    │   ├─ else if (metadata.categoryType === 'functions')│
    │   │  └─ (future implementation)                     │
    │   └─ else if (metadata.categoryType === 'interfaces'
    │      └─ (future implementation)                     │
    │                                                     │
    │ else if (metadata.type === 'class_summary')         │
    │   ├─ columns = classSummaryGridColumns              │
    │   └─ data = from metadata.summaryData               │
    │                                                     │
    │ else if (metadata.type === 'flattened_methods...')  │
    │   ├─ columns = flattenedMethodsGridColumns          │
    │   └─ data = from metadata.summaryData               │
    │                                                     │
    │ else (directory, files, etc.)                       │
    │   └─ columns = directoryGridColumns                 │
    │      (or featurelessGridColumns)                    │
    └─────────────────────────────────────────────────────┘
        ↓
    Render grid with
    appropriate columns
```

## Metadata Property Reference

```
File item when selected:
{
  "name": "myclass.ts",
  "icon": "file-code",
  "metadata": {
    "fullPath": "/path/to/myclass.ts",
    "modificationTime": "2024-10-23...",
    "size": 1234,
    "owner": "user",
    "group": "staff",
    "permissions": "rw-r--r--",
    "isSymlink": false,
    "extension": ".ts",
    "fileTypeInfo": {
      "isBinaryFile": false,
      "mimeType": "application/typescript",
      "isCode": true,
      "languageHint": "typescript"
    }
  },
  "children": [
    {
      "name": "Classes (2)",
      "icon": "box",
      "metadata": {
        "type": "file_content_category",
        "categoryType": "classes",
        "sourceFile": "/path/to/myclass.ts",
        "count": 2,
        "items": [
          { ComprehensiveClassSummary }
        ]
      },
      "children": [
        {
          "name": "MyClass",
          "icon": "box",
          "metadata": {
            "type": "class_detail",
            "classData": { ComprehensiveClassSummary },
            "sourceFile": "/path/to/myclass.ts"
          },
          "children": [ ... ]
        }
      ]
    }
  ]
}

Class item when selected (from Classes category):
{
  "name": "MyClass",
  "icon": "box",
  "metadata": {
    "type": "class_detail",
    "classData": {
      "name": "MyClass",
      "id": "MyClass:/path/to/myclass.ts",
      "isLocal": true,
      "location": {
        "file": "/path/to/myclass.ts",
        "line": 5,
        "column": 7,
        "endLine": 45
      },
      "properties": [ PropertySummary[] ],
      "methods": [ MethodSummary[] ],
      "constructors": [ MethodSummary[] ],
      "references": [ ClassReference[] ],
      "sourceLOC": 40,
      "referenceCount": 5,
      "methodCount": 3,
      "sourceFilename": "myclass.ts"
    },
    "sourceFile": "/path/to/myclass.ts"
  },
  "children": [
    {
      "name": "Source",
      "icon": "file-text",
      "metadata": {
        "type": "source",
        "sourceFile": "/path/to/myclass.ts",
        "startLine": 5,
        "endLine": 45
      }
    },
    {
      "name": "Properties (2)",
      "icon": "settings",
      "children": [ ... ]
    },
    {
      "name": "Methods (3)",
      "icon": "zap",
      "children": [ ... ]
    },
    {
      "name": "References (5)",
      "icon": "arrow-right-left",
      "children": [ ... ]
    }
  ]
}
```

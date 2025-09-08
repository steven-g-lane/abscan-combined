# Architecture Summary

**Project Root:** /Users/slane/Documents/Code/abscan-combined/src/viewer/renderer/components
**Scanned At:** 2025-09-07T23:43:36.472Z
**Files Analyzed:** 11

## Files by Type

- **unknown**: 10 files
- **renderer**: 1 files

## Type Catalog

**Total Types:** 66

- **interface**: 26 entries
- **import**: 40 entries

### BottomPanel.tsx
- **BottomPanelItem** (interface) (8:1)
  - Used in 2 location(s):
    - **property** (2):
      - BottomPanel.tsx:11 (BottomPanelItem.children)
      - BottomPanel.tsx:16 (BottomPanelProps.selectedItem)
- **BottomPanelProps** (interface) (15:1)
  - **Unused** - No references found

### react (imported)
- **useState** (import) (1:1)
  - **Unused** - No references found
- **useEffect** (import) (1:1)
  - **Unused** - No references found
- **React** (import) (1:1)
  - Used in 8 location(s):
    - **property** (1):
      - BottomPanel.tsx:18 (BottomPanelProps.millerColumnsRef)
    - **variable** (6):
      - BottomPanel.tsx:22 (BottomPanel)
      - CodeDisplay.tsx:13 (CodeDisplay)
      - DetailPanel.tsx:12 (DetailPanel)
      - ExpandedGrid.tsx:19 (ExpandedGrid)
      - ScanConfigModal.tsx:19 (ScanConfigModal)
      - ScanProgressModal.tsx:9 (ScanProgressModal)
    - **extends** (1):
      - ui/button.tsx:37 (ButtonProps)
- **useMemo** (import) (1:1)
  - **Unused** - No references found
- **useRef** (import) (1:1)
  - **Unused** - No references found
- **Component** (import) (1:1)
  - Used in 1 location(s):
    - **extends** (1):
      - ErrorBoundary.tsx:14 (ErrorBoundary)
- **ErrorInfo** (import) (1:1)
  - Used in 1 location(s):
    - **parameter** (1):
      - ErrorBoundary.tsx:25 (ErrorBoundary.componentDidCatch(errorInfo))
- **ReactNode** (import) (1:1)
  - Used in 2 location(s):
    - **property** (2):
      - ErrorBoundary.tsx:4 (Props.children)
      - ErrorBoundary.tsx:5 (Props.fallback)
- **forwardRef** (import) (1:1)
  - **Unused** - No references found
- **useImperativeHandle** (import) (1:1)
  - **Unused** - No references found

### CodeDisplay
- **CodeDisplay** (import) (2:1)
  - **Unused** - No references found

### ChildItemsGrid
- **ChildItemsGrid** (import) (3:1)
  - **Unused** - No references found
- **GridColumnConfig** (import) (3:1)
  - Used in 8 location(s):
    - **property** (1):
      - ChildItemsGrid.tsx:31 (ChildItemsGridProps.columns)
    - **variable** (7):
      - gridConfigurations.tsx:94 (directoryGridColumns)
      - gridConfigurations.tsx:232 (featurelessGridColumns)
      - gridConfigurations.tsx:271 (classSummaryGridColumns)
      - gridConfigurations.tsx:353 (methodGridColumns)
      - gridConfigurations.tsx:478 (functionsGridColumns)
      - gridConfigurations.tsx:586 (componentsGridColumns)
      - gridConfigurations.tsx:665 (methodReferenceGridColumns)

### ErrorBoundary
- **ErrorBoundary** (import) (4:1)
  - **Unused** - No references found

### gridConfigurations
- **directoryGridColumns** (import) (5:1)
  - **Unused** - No references found
- **featurelessGridColumns** (import) (5:1)
  - **Unused** - No references found
- **classSummaryGridColumns** (import) (5:1)
  - **Unused** - No references found
- **methodReferenceGridColumns** (import) (5:1)
  - **Unused** - No references found
- **methodGridColumns** (import) (5:1)
  - **Unused** - No references found
- **functionsGridColumns** (import) (5:1)
  - **Unused** - No references found
- **componentsGridColumns** (import) (5:1)
  - **Unused** - No references found

### MillerColumns
- **MillerColumnsRef** (import) (6:1)
  - **Unused** - No references found

### ChildItemsGrid.tsx
- **GridItem** (interface) (13:1)
  - **Unused** - No references found
- **GridColumnConfig** (interface) (18:1)
  - Generics: <T = GridItem>
  - Used in 8 location(s):
    - **property** (1):
      - ChildItemsGrid.tsx:31 (ChildItemsGridProps.columns)
    - **variable** (7):
      - gridConfigurations.tsx:94 (directoryGridColumns)
      - gridConfigurations.tsx:232 (featurelessGridColumns)
      - gridConfigurations.tsx:271 (classSummaryGridColumns)
      - gridConfigurations.tsx:353 (methodGridColumns)
      - gridConfigurations.tsx:478 (functionsGridColumns)
      - gridConfigurations.tsx:586 (componentsGridColumns)
      - gridConfigurations.tsx:665 (methodReferenceGridColumns)
- **ChildItemsGridProps** (interface) (29:1)
  - Generics: <T = GridItem>
  - **Unused** - No references found

### react-table (imported)
- **useReactTable** (import) (2:1)
  - **Unused** - No references found
- **getCoreRowModel** (import) (2:1)
  - **Unused** - No references found
- **getSortedRowModel** (import) (2:1)
  - **Unused** - No references found
- **SortingState** (import) (2:1)
  - Used in 1 location(s):
    - **property** (1):
      - ChildItemsGrid.tsx:32 (ChildItemsGridProps.defaultSorting)
- **ColumnDef** (import) (2:1)
  - **Unused** - No references found
- **flexRender** (import) (2:1)
  - **Unused** - No references found

### lucide-react (imported)
- **ChevronUp** (import) (10:1)
  - **Unused** - No references found
- **ChevronDown** (import) (10:1)
  - **Unused** - No references found
- **Folder** (import) (2:1)
  - **Unused** - No references found
- **icons** (import) (2:1)
  - **Unused** - No references found
- **X** (import) (2:1)
  - **Unused** - No references found
- **AlertCircle** (import) (2:1)
  - **Unused** - No references found

### CodeDisplay.tsx
- **CodeDisplayProps** (interface) (5:1)
  - **Unused** - No references found

### react-syntax-highlighter (imported)
- **Prism** (import) (2:1)
  - **Unused** - No references found

### prism (imported)
- **vscDarkPlus** (import) (3:1)
  - **Unused** - No references found

### DetailPanel.tsx
- **DetailPanelProps** (interface) (3:1)
  - **Unused** - No references found

### ErrorBoundary.tsx
- **Props** (interface) (3:1)
  - Used in 1 location(s):
    - **parameter** (1):
      - ErrorBoundary.tsx:15 (ErrorBoundary.constructor(props))
- **State** (interface) (9:1)
  - Used in 1 location(s):
    - **return** (1):
      - ErrorBoundary.tsx:20 (ErrorBoundary.getDerivedStateFromError)

### ExpandedGrid.tsx
- **GridColumn** (interface) (3:1)
  - **Unused** - No references found
- **GridRow** (interface) (9:1)
  - Used in 1 location(s):
    - **property** (1):
      - ExpandedGrid.tsx:15 (ExpandedGridProps.data)
- **ExpandedGridProps** (interface) (14:1)
  - **Unused** - No references found

### MillerColumns.tsx
- **MillerColumnEntry** (interface) (4:1)
  - Used in 2 location(s):
    - **property** (2):
      - MillerColumns.tsx:7 (MillerColumnEntry.children)
      - MillerColumns.tsx:12 (MillerData.items)
- **MillerData** (interface) (11:1)
  - **Unused** - No references found
- **MillerColumnsProps** (interface) (15:1)
  - **Unused** - No references found
- **MillerColumnsRef** (interface) (22:1)
  - **Unused** - No references found

### ScanConfigModal.tsx
- **ScanConfig** (interface) (4:1)
  - **Unused** - No references found
- **ScanConfigModalProps** (interface) (12:1)
  - **Unused** - No references found

### ScanProgressModal.tsx
- **ScanProgressModalProps** (interface) (4:1)
  - **Unused** - No references found

### gridConfigurations.tsx
- **DirectoryGridItem** (interface) (6:1)
  - Used in 1 location(s):
    - **property** (1):
      - gridConfigurations.tsx:9 (DirectoryGridItem.children)
- **ClassSummaryGridItem** (interface) (256:1)
  - Used in 1 location(s):
    - **property** (1):
      - gridConfigurations.tsx:259 (ClassSummaryGridItem.children)
- **MethodGridItem** (interface) (337:1)
  - Used in 1 location(s):
    - **property** (1):
      - gridConfigurations.tsx:340 (MethodGridItem.children)
- **FunctionGridItem** (interface) (455:1)
  - Used in 1 location(s):
    - **property** (1):
      - gridConfigurations.tsx:458 (FunctionGridItem.children)
- **ComponentGridItem** (interface) (571:1)
  - Used in 1 location(s):
    - **property** (1):
      - gridConfigurations.tsx:574 (ComponentGridItem.children)
- **MethodReferenceGridItem** (interface) (649:1)
  - Used in 1 location(s):
    - **property** (1):
      - gridConfigurations.tsx:652 (MethodReferenceGridItem.children)

### button.tsx
- **ButtonProps** (interface) (36:1)
  - Extends: React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants>
  - **Unused** - No references found

### react-slot (imported)
- **Slot** (import) (2:1)
  - **Unused** - No references found

### class-variance-authority (imported)
- **cva** (import) (3:1)
  - **Unused** - No references found
- **VariantProps** (import) (3:1)
  - Used in 1 location(s):
    - **extends** (1):
      - ui/button.tsx:38 (ButtonProps)

### utils
- **cn** (import) (5:1)
  - **Unused** - No references found

## Classes

### ErrorBoundary.tsx
- **ErrorBoundary** (14:1)
  - Extends: Component<Props, State>
  - Constructors: 1
  - Methods:
    - **getDerivedStateFromError** (static)(error: Error): State
    - **componentDidCatch**(error: Error, errorInfo: ErrorInfo)
    - **render**()

## Functions

### BottomPanel.tsx
- **BottomPanel** (22:7)
  - Parameters: { selectedItem, millerColumnsRef, currentColumnIndex }

### ChildItemsGrid.tsx
- **ChildItemsGrid** (38:7)
  - Parameters: { 
  data, 
  columns, 
  defaultSorting = [],
  className = '',
  onRowClick
}: ChildItemsGridProps<T>

### CodeDisplay.tsx
- **CodeDisplay** (13:7)
  - Parameters: { content, languageHint, isCode = false, scrollToLine, highlightLine }

### DetailPanel.tsx
- **DetailPanel** (12:7)
  - Parameters: { selectedItem }

### ExpandedGrid.tsx
- **ExpandedGrid** (19:7)
  - Parameters: { data = [], selectedItem }

### ScanConfigModal.tsx
- **ScanConfigModal** (19:7)
  - Parameters: { 
  isOpen, 
  onClose, 
  onScan, 
  defaultScanPath = '' 
}

### ScanProgressModal.tsx
- **ScanProgressModal** (9:7)
  - Parameters: { isOpen, onCancel }

### gridConfigurations.tsx
- **formatFileSize** (29:14)
  - Parameters: bytes: number?
  - Returns: string
- **formatTimestamp** (43:14)
  - Parameters: date: Date
  - Returns: string
- **formatPermissions** (59:14)
  - Parameters: permissions: string
  - Returns: string
- **formatOwnership** (63:14)
  - Parameters: owner: string | null?, group: string | null?
  - Returns: string
- **renderFileIcon** (70:14)
  - Parameters: item: DirectoryGridItem
- **createSimplifiedSignature** (430:7)
  - Parameters: name: string, parameters: any[]
  - Returns: string

## React Components

### BottomPanel.tsx
- **BottomPanel** (function) (22:7)

### ChildItemsGrid.tsx
- **ChildItemsGrid** (function) (38:7)

### CodeDisplay.tsx
- **CodeDisplay** (function) (13:7)

### DetailPanel.tsx
- **DetailPanel** (function) (12:7)

### ErrorBoundary.tsx
- **ErrorBoundary** (class) (14:1)

### ExpandedGrid.tsx
- **ExpandedGrid** (function) (19:7)

### ScanConfigModal.tsx
- **ScanConfigModal** (function) (19:7)

### ScanProgressModal.tsx
- **ScanProgressModal** (function) (9:7)

### gridConfigurations.tsx
- **renderFileIcon** (function) (70:14)

## IPC Usage


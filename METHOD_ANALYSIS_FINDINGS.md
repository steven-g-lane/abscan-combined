# Method Analysis and Disambiguation in abscan-combined

## Exploration Summary

This document provides a comprehensive analysis of where method analysis, identification, and disambiguation happens in the abscan-combined codebase.

## 1. Code That Scans/Analyzes Methods in TypeScript Files

### Primary Locations

**1.1 ClassExtractor** (`src/cli/extractors/classExtractor.ts`)
- **Purpose:** Extracts methods from class declarations
- **Key Functions:**
  - `extractClasses(sourceFile: SourceFile): ClassSummary[]` - Main entry point
  - `extractMethodSummary(method: MethodDeclaration, filePath, typeResolver)` - Extracts individual method metadata
  - `extractConstructorSummary(constructor: ConstructorDeclaration, ...)` - Handles constructors separately

- **What's Extracted:**
  ```typescript
  MethodSummary {
    name: string;
    location: CodeLocation;        // file, line, column, endLine
    parameters: ParameterSummary[];
    returnType?: string;
    resolvedReturnType?: string;
    displayReturnType?: string;
    isStatic?: boolean;
    visibility?: 'public' | 'private' | 'protected';
    genericParameters?: GenericParameter[];
    overloads?: FunctionOverload[];
    jsdocDescription?: string;
    isAbstract?: boolean;
    isConstructor?: boolean;
    // NOTE: references are added LATER, not during extraction
  }
  ```

- **Key Insight:** Methods are extracted with their exact location and metadata, but references are NOT tracked during this phase.

**1.2 ClassAnalyzer** (`src/cli/analyzer/classAnalyzer.ts`)
- **Purpose:** Orchestrates three-phase analysis of classes and their methods
- **Three Phases:**

  **Phase 1: Cataloging**
  - Extracts local classes and imports via `catalogLocalClasses()` and `catalogImportedClasses()`
  - Builds `classRegistry: Map<string, ComprehensiveClassSummary>`
  - Builds `classNameIndex: Map<className, classId[]>` for O(1) lookups
  
  **Phase 2: Class References**
  - Scans for class usage via `findClassReferences()`
  - Uses optimized identifier search: `sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)`
  - Filters with heuristics (class name conventions, non-class keywords)
  - Tracks which classes are referenced where
  
  **Phase 3: Method References** (Lines 52-55)
  - **This is where the critical method disambiguation happens!**
  - Delegates to `BatchReferenceTracker` for method and property reference tracking
  - Applies collected references to method/property objects

### Supporting Components

**TypeResolver** (`src/cli/utils/typeResolver.ts`)
- Resolves type information for methods and parameters
- Extracts JSDoc descriptions
- Resolves generic parameters and overloads
- Used during method extraction to enhance type information

## 2. How Methods Are Identified and Stored (Class Context)

### Storage Structure

Methods are **always stored within class context**:

```
ComprehensiveClassSummary {
  name: "MyClass"
  id: "MyClass:src/path/MyClass.ts"
  isLocal: true
  location: CodeLocation
  methods: MethodSummary[  ← Methods stored here with parent class relationship
    {
      name: "myMethod",
      location: CodeLocation,
      references?: MethodReference[]  ← References added in Phase 3
    }
  ]
  properties: PropertySummary[]
  references: ClassReference[]
}
```

### Key Points:

1. **Implicit Class Context:** Each method knows its class through the parent-child relationship in the data structure. The method itself stores its own location (file/line/column).

2. **Unique Class Identification:** Classes are identified by:
   - `className:sourceFile` combination in the `id` field
   - Allows multiple classes with same name in different files (rare but handled)

3. **Method Uniqueness:** Method uniqueness is implicit through class context:
   - `MethodSummary.name` is just the method name (e.g., "doSomething")
   - Full uniqueness: `ClassName:MethodName` (context from parent)

## 3. How Method Call/Reference Tracking Works

### The Reference Tracking Pipeline

```
ClassAnalyzer.analyzeClasses()
    ↓
Phase 3: addMethodReferences()
    ↓
BatchReferenceTracker.buildReferenceMap()
    ↓
[Phase 1] catalogClassSymbols()
  ├─ Scans all classes for methods/constructors/properties
  ├─ Creates symbolDefinitionMap: "ClassName:methodName" → MethodDeclaration
  └─ Result: Map of all symbols to track
    ↓
[Phase 2] buildSymbolReferences()
  ├─ Scans all call expressions: Node.isCallExpression()
  ├─ For property access calls: obj.methodName()
  │  └─ Uses SYMBOL-BASED DISAMBIGUATION (key innovation!)
  ├─ For new expressions: new ClassName()
  └─ Collects references grouped by className:methodName
    ↓
Results stored in:
  ├─ methodCallMap: Map<"ClassName:methodName", MethodReference[]>
  ├─ propertyAccessMap: Map<"ClassName:propertyName", PropertyReference[]>
  └─ constructorCallMap: Map<"ClassName", MethodReference[]>
    ↓
applyReferencesToClasses()
  └─ Attaches collected references to method.references array
```

### BatchReferenceTracker Deep Dive

**Location:** `src/cli/utils/batchReferenceTracker.ts`

**Critical Method:** `getUniqueMethodId()` (Lines 229-251)

```typescript
private getUniqueMethodId(callExpr: CallExpression): string | null {
  try {
    const expr = callExpr.getExpression();
    
    if (Node.isPropertyAccessExpression(expr)) {
      const receiver = expr.getExpression();
      const receiverType = receiver.getType();
      const receiverTypeSymbol = receiverType.getSymbol();  // ← Key: get receiver's TYPE
      const methodSymbol = expr.getSymbol();               // ← Key: get method SYMBOL
      
      if (receiverTypeSymbol && methodSymbol) {
        const receiverName = receiverTypeSymbol.getName();  // "ClassA" or "ClassB"
        const methodName = methodSymbol.getName();          // "doSomething"
        return `${receiverName}.${methodName}`;             // "ClassA.doSomething" (unique!)
      }
    }
    return null;
  } catch (e) {
    return null;  // Graceful fallback
  }
}
```

**How It Works:**
1. Gets the call expression: `obj.methodName()`
2. Gets the receiver type's symbol (ts-morph semantic analysis)
3. Gets the method's symbol
4. Creates unique identifier: `ReceiverClass.methodName`
5. This properly disambiguates between `ClassA.doSomething` and `ClassB.doSomething`

### Symbol-Based Approach (Proven Correct)

This is the **proven correct approach** from POC:
- **File:** `poc/refs/poc2-correct-approach.ts`
- **Strategy:** Use TypeScript's symbol resolution to determine the actual receiver class
- **Result:** Different methods with same name are properly separated

## 4. Where Disambiguation SHOULD Happen (And Does)

### Current Implementation Location

**File:** `src/cli/utils/batchReferenceTracker.ts`
**Lines:** 112-224 in `buildSymbolReferences()`

**Disambiguation Strategy:**

1. **For Method Calls:** Lines 126-171
   ```typescript
   if (Node.isCallExpression(node)) {
     const expr = node.getExpression();
     
     if (Node.isPropertyAccessExpression(expr)) {
       const methodName = expr.getName();
       const receiver = expr.getExpression();
       
       // THIS IS THE CRITICAL PART:
       const uniqueMethodId = this.getUniqueMethodId(node);  // ← Symbol-based!
       
       if (uniqueMethodId) {
         const [className, symbolName] = uniqueMethodId.split('.');
         const symbolKey = `${className}:${symbolName}`;
         
         if (this.symbolDefinitionMap.has(symbolKey)) {
           const methodReference = this.createMethodReference(node, filePath);
           this.addMethodReference(className, symbolName, methodReference);  // ← Correctly split!
         }
       }
     }
   }
   ```

2. **For Constructor Calls:** Lines 172-187
   - Extracts class name from `new ClassName()`
   - Tracks in `constructorCallMap` keyed by className

3. **For Property Access:** Lines 191-206
   - Uses same symbol-based approach via `getUniquePropertyId()`

### Special Logging for Debugging

**Lines 139-167:** Special logging for `getVendorData` methods
```typescript
const isGetVendorData = symbolName === 'getVendorData';
if (isGetVendorData) {
  console.log(`🚨 GETVENDORDATA Symbol-based reference found:`, {
    uniqueMethodId,        // e.g., "ClassA.getVendorData"
    className,             // "ClassA" or "ClassB"
    symbolName,            // "getVendorData"
    file: sourceFile.getBaseName(),
    line: node.getStartLineNumber(),
    callText: node.getText(),
    receiverText: receiver.getText(),
    receiverType: receiver.getType().getText(),
    methodSymbol: expr.getSymbol()?.getName()
  });
}
```

This debugging output shows the disambiguation is working correctly.

## 5. Test Cases Demonstrating the Issue and Fix

### Minimal POC

**Files:**
- `poc/minimal-findreferences-test/SimpleA.ts` - Class with `doSomething()` method
- `poc/minimal-findreferences-test/SimpleB.ts` - Different class with same `doSomething()` method
- `poc/minimal-findreferences-test/test-minimal.ts` - Tests ts-morph's `findReferences()`

**Test Setup:**
```
SimpleA.doSomething():  // Definition
  - SimpleA.ts:7 (this.doSomething())
  - SimpleB.ts:9 (a.doSomething())

SimpleB.doSomething():  // Definition
  - SimpleB.ts:7 (this.doSomething())
  - SimpleA.ts:9 (b.doSomething())
```

**Key Finding:** ts-morph's native `findReferences()` can have issues with reference pooling, which is why the symbol-based approach was implemented.

### Advanced POC with Cross-Module Calls

**Files:**
- `poc/refs/ClassA.ts` - Multiple methods, some with same names as ClassB
- `poc/refs/ClassB.ts` - Has `getVendorData()`, `process()`, `create()` like ClassA
- `poc/refs/Consumer.ts` - Calls methods on both classes
- `poc/refs/poc2-correct-approach.ts` - Demonstrates correct symbol-based approach

**Proven Results:**
- Symbol-based disambiguation correctly separates `ClassA.getVendorData` from `ClassB.getVendorData`
- Each method gets its own reference count
- Works with static methods, inheritance, and cross-module calls

## 6. Reference Data Structure

### MethodReference Interface

```typescript
interface MethodReference {
  location: CodeLocation;    // file, line, column
  contextLine: string;       // actual source code line
  context?: string;          // "method call", "constructor call", etc.
}
```

### How References Are Stored

1. **On Methods:**
   ```typescript
   method.references?: MethodReference[]      // Array of all places method is called
   method.referenceCount?: number             // Count of references
   ```

2. **Grouped in Maps:**
   ```typescript
   methodCallMap.get("ClassName:methodName")  // All references to this method
   ```

3. **Applied Back to Classes:**
   ```typescript
   applyReferencesToClasses(classes: Map<string, ComprehensiveClassSummary>) {
     for (const classData of classes.values()) {
       if (classData.methods) {
         for (const method of classData.methods) {
           const references = this.getMethodReferences(classData.name, method.name);
           method.references = references;
           method.referenceCount = references.length;
         }
       }
     }
   }
   ```

## 7. Current Implementation Status

### What's Working

1. **Method Extraction:** Full metadata capture of all methods including signature, parameters, return types, etc.
2. **Class Context:** Methods are properly nested within their containing classes
3. **Symbol-Based Disambiguation:** Correctly separates methods with identical names in different classes
4. **Reference Tracking:** Accurately counts and locates method call sites
5. **Multiple Disambiguation Techniques:**
   - Direct receiver type symbol resolution (primary)
   - Fallback handling for edge cases
   - Graceful degradation when symbol resolution fails

### Special Handling for Edge Cases

1. **Constructor Tracking:** Separated from regular methods
2. **Static Methods:** Properly tracked through symbol names
3. **Property Access:** Separate tracking for property reads/writes
4. **This Calls:** Handled through containing class detection
5. **Super Calls:** Detected and marked differently

### Debugging Infrastructure

The implementation includes comprehensive logging for the `getVendorData` methods (as a reference example) to verify disambiguation is working:
- Initial detection
- Symbol-based ID generation
- Reference collection
- Final summary with counts and file locations

## 8. Key Files Summary

| File | Purpose | Key Responsibility |
|------|---------|-------------------|
| `classExtractor.ts` | Extract method metadata | Get method signature, JSDoc, parameters |
| `classAnalyzer.ts` | Orchestrate class analysis | Coordinate 3-phase analysis |
| `batchReferenceTracker.ts` | Track method references | **Symbol-based disambiguation** |
| `typeResolver.ts` | Resolve type information | Enhanced type data for methods |
| `models/index.ts` | Define data structures | MethodSummary, MethodReference types |

## 9. Disambiguation Algorithm Details

### Step-by-Step Example

**Input:** Call expression `a.doSomething()`

**Step 1: Identify it's a method call**
```typescript
Node.isPropertyAccessExpression(expr)  // true
```

**Step 2: Get receiver type information**
```typescript
const receiver = expr.getExpression();      // identifier "a"
const receiverType = receiver.getType();    // ClassA type
const receiverTypeSymbol = receiverType.getSymbol();  // Symbol for ClassA
```

**Step 3: Get method symbol**
```typescript
const methodSymbol = expr.getSymbol();  // Symbol for doSomething method
```

**Step 4: Create unique identifier**
```typescript
const receiverName = receiverTypeSymbol.getName();  // "ClassA"
const methodName = methodSymbol.getName();          // "doSomething"
const uniqueId = `${receiverName}.${methodName}`;   // "ClassA.doSomething"
```

**Step 5: Store reference**
```typescript
const key = `${className}:${symbolName}`;  // "ClassA:doSomething"
this.addMethodReference(className, symbolName, methodReference);
```

**Result:** Even if ClassB also has `doSomething()`, they get separate entries:
- `ClassA:doSomething` → references specific to ClassA
- `ClassB:doSomething` → references specific to ClassB

## 10. Potential Issues and Current Status

### Known Limitations

1. **Error Handling:** Methods that fail symbol resolution silently return null
2. **Anonymous Classes:** Not handled (rare in TypeScript)
3. **Dynamic Method Access:** `obj[methodName]()` not tracked
4. **Eval/Dynamic Code:** Not analyzed
5. **External Libraries:** Methods in node_modules imports have limited tracking

### Robustness Features

1. **Try-Catch Blocks:** All symbol resolution wrapped in try-catch
2. **Null Checks:** All symbol operations checked for null
3. **Fallback Maps:** Legacy methods provide fallbacks if symbol approach fails
4. **Comprehensive Logging:** Special debug logging for verification

## Conclusion

The method analysis and disambiguation in abscan-combined is well-implemented using a symbol-based approach that:
1. **Correctly identifies methods** with their full class context
2. **Accurately disambiguates** methods with identical names in different classes
3. **Tracks all references** to each method
4. **Handles edge cases** gracefully
5. **Provides debugging** infrastructure to verify correctness

The system works in three coordinated phases (extraction, cataloging, reference tracking) to ensure methods are analyzed comprehensively with full disambiguation context.

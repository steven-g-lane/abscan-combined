# Method Analysis and Disambiguation - Quick Reference

## Key Findings

### 1. Where Methods Are Scanned

| Component | File | Purpose |
|-----------|------|---------|
| **ClassExtractor** | `src/cli/extractors/classExtractor.ts` | Extracts method metadata from source files |
| **ClassAnalyzer** | `src/cli/analyzer/classAnalyzer.ts` | Orchestrates 3-phase analysis |
| **BatchReferenceTracker** | `src/cli/utils/batchReferenceTracker.ts` | Tracks method references with disambiguation |

### 2. How Methods Are Stored

**Structure:** Methods are stored nested within their containing class

```
Class → methods: MethodSummary[]
  └── Each MethodSummary has:
      - name: string
      - location: CodeLocation (file, line, column)
      - references: MethodReference[] (added in Phase 3)
      - referenceCount: number
```

**Key Point:** Methods implicitly know their class through parent-child relationship in the data structure.

### 3. How Disambiguation Works

**Algorithm:** Symbol-based semantic analysis using ts-morph's type system

```typescript
// For a call like: obj.methodName()

const receiver = expr.getExpression();              // "obj"
const receiverType = receiver.getType();            // Gets obj's type
const receiverTypeSymbol = receiverType.getSymbol(); // ClassA or ClassB
const methodSymbol = expr.getSymbol();              // method symbol

// Creates unique ID: "ClassA.methodName" (not just "methodName")
```

**Result:** Different classes with same method name get separate reference lists:
- `ClassA:methodName` → references to ClassA's method
- `ClassB:methodName` → references to ClassB's method

### 4. The 3-Phase Analysis Process

```
Phase 1: CATALOGING
  └─ Extract all class definitions
  └─ Build classRegistry and classNameIndex

Phase 2: CLASS REFERENCES  
  └─ Scan identifiers for class usage
  └─ Track which classes are referenced where

Phase 3: METHOD REFERENCES ← DISAMBIGUATION HAPPENS HERE
  └─ Scan call expressions
  └─ Use symbol-based approach to determine receiver class
  └─ Group references by "ClassName:methodName"
  └─ Apply references back to method objects
```

### 5. Critical Code Locations

| Location | What It Does |
|----------|-------------|
| `batchReferenceTracker.ts:49-59` | `buildReferenceMap()` - Entry point for Phase 3 |
| `batchReferenceTracker.ts:65-104` | `catalogClassSymbols()` - Map all symbols |
| `batchReferenceTracker.ts:112-224` | `buildSymbolReferences()` - **Disambiguation logic** |
| `batchReferenceTracker.ts:229-251` | `getUniqueMethodId()` - **Core disambiguation** |
| `batchReferenceTracker.ts:298-330` | `applyReferencesToClasses()` - Apply results |

### 6. The Disambiguator

**Function:** `getUniqueMethodId()` in `batchReferenceTracker.ts`

```typescript
private getUniqueMethodId(callExpr: CallExpression): string | null {
  // Gets: "ClassName.methodName" (unique identifier)
  // Handles both regular methods and properties
  // Returns null if symbol resolution fails (graceful fallback)
}
```

**Why it works:** Uses TypeScript's semantic analysis to determine the actual type of the receiver object, not just syntactic analysis.

### 7. Reference Storage

**Maps used during tracking:**
```typescript
methodCallMap: Map<"ClassName:methodName", MethodReference[]>
propertyAccessMap: Map<"ClassName:propertyName", PropertyReference[]>
constructorCallMap: Map<"ClassName", MethodReference[]>
```

**How references are stored on methods:**
```typescript
method.references = [
  {
    location: { file, line, column },
    contextLine: "actual source code line",
    context: "method call" | "constructor call" | etc
  },
  // ... more references
]
```

### 8. Edge Cases Handled

1. ✅ Methods with identical names in different classes
2. ✅ Static methods
3. ✅ Constructor calls (`new ClassName()`)
4. ✅ Property access vs method calls
5. ✅ This calls (`this.method()`)
6. ✅ Super calls (detected separately)
7. ✅ Cross-module method calls
8. ✅ Inherited methods

### 9. Debugging

**Special logging for `getVendorData` methods** (example):
```typescript
// Lines 139-167 in buildSymbolReferences()
const isGetVendorData = symbolName === 'getVendorData';
if (isGetVendorData) {
  console.log('🚨 GETVENDORDATA Symbol-based reference found:', { ... });
}
// Final summary printed at lines 212-223
```

To verify disambiguation is working, look for output like:
- `ClassA.getVendorData: N references`
- `ClassB.getVendorData: M references`
(Different counts confirm proper separation)

### 10. Test Files

| File | Purpose |
|------|---------|
| `poc/minimal-findreferences-test/SimpleA.ts` | Simple test case |
| `poc/minimal-findreferences-test/SimpleB.ts` | Same method name |
| `poc/minimal-findreferences-test/test-minimal.ts` | Test ts-morph behavior |
| `poc/refs/ClassA.ts` | Advanced test with multiple methods |
| `poc/refs/ClassB.ts` | Cross-module calls |
| `poc/refs/poc2-correct-approach.ts` | Demonstrates correct symbol-based approach |

### 11. What to Look For if Disambiguation Fails

1. ❌ Both ClassA.method and ClassB.method have same reference count
   - Suggests reference pooling issue
   - Check if `getUniqueMethodId()` is returning null

2. ❌ References appear in wrong class
   - Check receiver type symbol resolution
   - Verify call is actually property access expression

3. ❌ Special methods not tracked (e.g., `getVendorData`)
   - Check if method exists in `symbolDefinitionMap`
   - Verify it's being found in `catalogClassSymbols()`

### 12. Flow Diagram

```
Source File (.ts)
    ↓
ClassExtractor.extractMethodSummary()
    ↓ (metadata only, no references yet)
MethodSummary {name, location, parameters, ...}
    ↓
ClassAnalyzer.analyzeClasses()
    ├─ Phase 1: Catalog symbols
    ├─ Phase 2: Track class references
    └─ Phase 3: Track method references
        ↓
BatchReferenceTracker.buildSymbolReferences()
    ├─ Find all call expressions: obj.methodName()
    ├─ Get receiver type symbol (CLASS DISAMBIGUATION)
    ├─ Get method symbol
    ├─ Create unique ID: "ClassName.methodName"
    └─ Store in methodCallMap
        ↓
BatchReferenceTracker.applyReferencesToClasses()
    └─ Attach references to method.references[]
        ↓
Final Result:
  MethodSummary {
    name: "methodName",
    references: [ {location, contextLine, context} ],
    referenceCount: N
  }
```

## Summary

The method analysis and disambiguation is implemented through:
1. **Extraction:** Full method metadata captured including signature and JSDoc
2. **Cataloging:** All method symbols mapped for fast lookup
3. **Tracking:** Call expressions analyzed using symbol-based approach
4. **Disambiguation:** Receiver type symbol determines which class's method
5. **Storage:** References stored per method within class context
6. **Robustness:** Try-catch blocks handle edge cases gracefully

The symbol-based approach is proven to work correctly for disambiguating identically-named methods across different classes.

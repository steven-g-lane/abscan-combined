# Method Analysis and Disambiguation Exploration - Complete Index

## Overview

This directory contains comprehensive documentation of how method analysis and disambiguation works in the abscan-combined codebase. These documents were created through a thorough exploration of the TypeScript source code, examining how methods are scanned, analyzed, and tracked with proper class-based disambiguation.

## Document Guide

### 1. METHOD_ANALYSIS_QUICK_REFERENCE.md
**Best For:** Quick lookup, getting oriented, understanding the big picture

Contains:
- Where methods are scanned (3 main components)
- How methods are stored (data structure)
- How disambiguation works (algorithm)
- The 3-phase analysis process
- Critical code locations with line numbers
- Reference storage mechanism
- Edge cases handled
- Test files available
- Troubleshooting guide
- Flow diagram

**Read this first** for a comprehensive but concise overview.

### 2. METHOD_ANALYSIS_FINDINGS.md
**Best For:** Deep dive, implementation details, understanding design decisions

Contains:
- Detailed explanation of each scanning component
- Complete data structure documentation
- Reference tracking pipeline with full context
- BatchReferenceTracker deep dive with code examples
- Symbol-based approach explanation
- Test case documentation with expected results
- Reference data structure details
- Current implementation status and capabilities
- Potential issues and limitations
- Disambiguation algorithm step-by-step walkthrough
- Summary tables and comparison matrices

**Read this** when you need to understand how something works at a deeper level.

### 3. METHOD_ANALYSIS_INDEX.md
**This File**

Navigation guide to all documentation about method analysis.

## Key Files in the Codebase

### Critical Implementation Files

| File | Lines | Purpose | Key Insight |
|------|-------|---------|-------------|
| `src/cli/extractors/classExtractor.ts` | 73-167 | Extract method metadata | Methods extracted with full signature but no references yet |
| `src/cli/analyzer/classAnalyzer.ts` | 24-68 | 3-phase class analysis orchestration | Phase 3 delegates to BatchReferenceTracker for method refs |
| `src/cli/utils/batchReferenceTracker.ts` | 49-330 | Method reference tracking with disambiguation | **Core disambiguation logic using symbol-based approach** |
| `src/cli/utils/batchReferenceTracker.ts` | 229-251 | `getUniqueMethodId()` method | **The actual disambiguator function** |
| `src/cli/models/index.ts` | 29-45 | MethodSummary interface definition | Methods store references, referenceCount, and contextual info |

### Test/POC Files

| File | Purpose | Key Scenario |
|------|---------|--------------|
| `poc/minimal-findreferences-test/SimpleA.ts` | Simple test case | ClassA with doSomething() |
| `poc/minimal-findreferences-test/SimpleB.ts` | Simple test case | ClassB with same doSomething() |
| `poc/minimal-findreferences-test/test-minimal.ts` | Tests ts-morph behavior | Demonstrates findReferences() reference pooling issue |
| `poc/refs/ClassA.ts` | Advanced test case | Multiple methods, some shared names |
| `poc/refs/ClassB.ts` | Advanced test case | Cross-module method calls to ClassA |
| `poc/refs/poc2-correct-approach.ts` | Proven correct approach | Symbol-based disambiguation demonstration |

## Understanding the Flow

### High-Level Data Flow

```
TypeScript Source Files
    ↓
ClassExtractor (extract methods from classes)
    ↓ MethodSummary[] (no references yet)
    ↓
ClassAnalyzer (3-phase orchestration)
    ├─ Phase 1: Catalog all class symbols
    ├─ Phase 2: Find class references
    └─ Phase 3: Find method references
        ↓
BatchReferenceTracker.buildSymbolReferences()
    ├─ Scan all call expressions
    ├─ Use symbol-based disambiguation ← KEY INSIGHT
    ├─ Group by ClassName:methodName ← PROPER SEPARATION
    └─ Store in maps
        ↓
applyReferencesToClasses()
    └─ Attach references to method objects
        ↓
Final Output: MethodSummary with:
  - references: MethodReference[]
  - referenceCount: number
```

### Symbol-Based Disambiguation (The Core Innovation)

**Problem:** Methods with identical names in different classes should have separate reference lists
- Before: All "doSomething()" calls mixed together
- After: "ClassA.doSomething" separate from "ClassB.doSomething"

**Solution:** Use TypeScript's symbol resolution to determine actual receiver type
```typescript
const receiver = expr.getExpression();           // "obj"
const receiverTypeSymbol = receiverType.getSymbol(); // ClassA or ClassB
// Creates unique ID: "ClassA.doSomething" (not just "doSomething")
```

**Result:** Proper disambiguation with separate reference counts per class.

## How to Use These Documents

### Scenario 1: "I need to understand how method analysis works"
1. Read METHOD_ANALYSIS_QUICK_REFERENCE.md (5 min)
2. Check the "Flow Diagram" section
3. Look at the Critical Code Locations table
4. Check the test files to see real examples

### Scenario 2: "I need to fix a disambiguation bug"
1. Read METHOD_ANALYSIS_QUICK_REFERENCE.md section "What to Look For if Disambiguation Fails"
2. Go to METHOD_ANALYSIS_FINDINGS.md section "How Disambiguation Works"
3. Examine the `getUniqueMethodId()` function (line 229-251 in batchReferenceTracker.ts)
4. Check the debug output section to verify your fix

### Scenario 3: "I need to understand symbol-based disambiguation"
1. Read METHOD_ANALYSIS_FINDINGS.md section "Symbol-Based Approach"
2. Review the step-by-step example in section "Disambiguation Algorithm Details"
3. Look at poc2-correct-approach.ts to see the working implementation
4. Trace through getUniqueMethodId() in batchReferenceTracker.ts with a concrete example

### Scenario 4: "I need to add a new feature to method tracking"
1. Understand the 3-phase process in QUICK_REFERENCE.md
2. Decide which phase your feature belongs to:
   - Phase 1 (extraction): Modify classExtractor.ts
   - Phase 2 (class refs): Modify classAnalyzer.ts
   - Phase 3 (method refs): Modify batchReferenceTracker.ts
3. Check FINDINGS.md for detailed information about that phase
4. Review similar functionality in the existing code

## Key Insights

1. **Methods Always Have Class Context**
   - Methods are stored as array elements within ComprehensiveClassSummary
   - Method uniqueness is implicit through parent-child relationship
   - No need to explicitly store "className" in method object

2. **Symbol-Based Approach is Critical**
   - Syntactic parsing alone can't distinguish between methods with same names
   - Must use ts-morph's semantic analysis to get receiver type symbol
   - This is what enables proper class-based disambiguation

3. **Three-Phase Architecture is Essential**
   - Phase 1 (Cataloging): Fast symbol resolution
   - Phase 2 (Class Refs): Efficient identifier scanning
   - Phase 3 (Method Refs): Complex symbol-based disambiguation
   - Each phase uses optimized algorithms for its specific task

4. **Graceful Degradation**
   - Symbol resolution can fail (wrapped in try-catch)
   - Has fallback mechanisms
   - Returns null for unresolvable cases (doesn't crash)

5. **Proven with Tests**
   - Multiple POC files demonstrate correct behavior
   - Can be run independently to verify disambiguation
   - Special logging for verification

## Quick Reference Tables

### Components and Responsibilities

| Component | Responsibility | File |
|-----------|-----------------|------|
| ClassExtractor | Extract method metadata | src/cli/extractors/classExtractor.ts |
| ClassAnalyzer | Orchestrate 3-phase analysis | src/cli/analyzer/classAnalyzer.ts |
| BatchReferenceTracker | Track and disambiguate method refs | src/cli/utils/batchReferenceTracker.ts |
| TypeResolver | Resolve type information | src/cli/utils/typeResolver.ts |

### Data Structures

| Interface | Purpose | Parent |
|-----------|---------|--------|
| MethodSummary | Method metadata | ComprehensiveClassSummary.methods |
| MethodReference | Method reference location | MethodSummary.references |
| CodeLocation | File/line/column information | MethodSummary.location |

### Maps in BatchReferenceTracker

| Map | Key Format | Value |
|-----|-----------|-------|
| methodCallMap | "ClassName:methodName" | MethodReference[] |
| propertyAccessMap | "ClassName:propertyName" | PropertyReference[] |
| constructorCallMap | "ClassName" | MethodReference[] |
| symbolDefinitionMap | "ClassName:symbolName" | MethodDeclaration \| PropertyDeclaration |

## Related Documentation

Other files in the repository with relevant information:

- **CODEBASE_STRUCTURE_ANALYSIS.md** - Overall architecture and Miller columns data flow
- **IMPLEMENTATION_ARCHITECTURE_DIAGRAM.md** - Data flow diagrams and transformation layers
- **FILE_SELECTION_INVESTIGATION.md** - File-level abstraction tracking (uses method analysis)
- **QUICK_REFERENCE.md** - General quick reference for the codebase

## Navigation

- Start here → METHOD_ANALYSIS_QUICK_REFERENCE.md
- Deep dive → METHOD_ANALYSIS_FINDINGS.md
- Questions → This index document

## Troubleshooting

### If you can't find something:
1. Check the "Critical Code Locations" table in QUICK_REFERENCE
2. Search the codebase for the component name (e.g., "BatchReferenceTracker")
3. Look at the test files to see working examples

### If disambiguation seems broken:
1. Check the troubleshooting section in QUICK_REFERENCE.md
2. Run the POC files to verify symbol resolution works
3. Look at the special logging for getVendorData methods in batchReferenceTracker.ts
4. Verify the receiver type symbol is being resolved (not null)

### If you need to understand edge cases:
1. See "Edge Cases Handled" section in QUICK_REFERENCE.md
2. Look at the advanced POC files in poc/refs/
3. Check the comments in batchReferenceTracker.ts

## Questions?

If something is unclear:
1. Check both documentation files
2. Look at the test/POC files for concrete examples
3. Read the inline code comments
4. Review the commit history (git log) for context

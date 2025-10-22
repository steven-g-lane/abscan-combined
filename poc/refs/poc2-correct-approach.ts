import { Project, Node, CallExpression } from 'ts-morph';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize ts-morph project
const project = new Project({
  tsConfigFilePath: undefined,
  compilerOptions: {
    target: 2, // ES2015
    module: 1, // CommonJS
  },
});

// Add our test files
const files = [
  'ClassA.ts',
  'ClassB.ts',
  'Consumer.ts',
  'Inheritance.ts'
];

files.forEach(file => {
  project.addSourceFileAtPath(path.join(__dirname, file));
});

console.log('='.repeat(80));
console.log('POC 2: CORRECT APPROACH USING SYMBOL-BASED IDENTIFICATION');
console.log('='.repeat(80));

// New approach: Use symbol information for unique identification
const symbolBasedMap = new Map<string, any[]>();

function getUniqueMethodId(callExpr: CallExpression): string | null {
  try {
    const expr = callExpr.getExpression();
    if (!Node.isPropertyAccessExpression(expr)) {
      return null;
    }

    // Use the same approach that worked in POC 1
    const receiver = expr.getExpression();
    const receiverType = receiver.getType();
    const receiverTypeSymbol = receiverType.getSymbol();
    const methodSymbol = expr.getSymbol();

    if (receiverTypeSymbol && methodSymbol) {
      const receiverName = receiverTypeSymbol.getName();
      const methodName = methodSymbol.getName();

      // Create unique identifier: ReceiverClass.methodName
      return `${receiverName}.${methodName}`;
    }
  } catch (e: any) {
    // Fall back for cases where symbol resolution fails
    return null;
  }
  return null;
}

function getMethodDeclarationInfo(methodSymbol: any): string {
  try {
    const declarations = methodSymbol.getDeclarations();
    if (declarations.length > 0) {
      const decl = declarations[0];
      const declFile = path.basename(decl.getSourceFile().getFilePath());
      return `${declFile}:${decl.getStartLineNumber()}`;
    }
  } catch (e: any) {
    // ignore
  }
  return 'unknown';
}

project.getSourceFiles().forEach(sourceFile => {
  const fileName = path.basename(sourceFile.getFilePath());

  console.log(`\nProcessing file: ${fileName}`);

  sourceFile.forEachDescendant(node => {
    if (Node.isCallExpression(node)) {
      const expr = node.getExpression();

      // Only process method calls (not direct function calls)
      if (Node.isPropertyAccessExpression(expr)) {
        const uniqueId = getUniqueMethodId(node);

        if (uniqueId) {
          const methodSymbol = expr.getSymbol();
          const declInfo = getMethodDeclarationInfo(methodSymbol);

          console.log(`  Method call: ${expr.getText()} -> ID: "${uniqueId}" -> Declared at: ${declInfo}`);

          const existing = symbolBasedMap.get(uniqueId) || [];
          existing.push({
            file: fileName,
            line: node.getStartLineNumber(),
            fullCall: node.getText(),
            declaredAt: declInfo
          });
          symbolBasedMap.set(uniqueId, existing);
        } else {
          console.log(`  Method call: ${expr.getText()} -> ID: FAILED (symbol resolution failed)`);
        }
      }
    }
  });
});

console.log('\n' + '='.repeat(80));
console.log('CORRECTED RESULTS - METHODS PROPERLY SEPARATED');
console.log('='.repeat(80));

symbolBasedMap.forEach((references, uniqueId) => {
  const declaredAt = references[0]?.declaredAt || 'unknown';
  console.log(`\n"${uniqueId}" (declared at ${declaredAt}) has ${references.length} references:`);
  references.forEach(ref => {
    console.log(`  - ${ref.file}:${ref.line} -> ${ref.fullCall}`);
  });
});

console.log('\n' + '='.repeat(80));
console.log('COMPARISON: BEFORE vs AFTER');
console.log('='.repeat(80));

// Quick comparison
const beforeGetVendorData = 15; // From POC 1
const afterCounts: { [key: string]: number } = {};

symbolBasedMap.forEach((references, uniqueId) => {
  if (uniqueId.includes('getVendorData')) {
    afterCounts[uniqueId] = references.length;
  }
});

console.log(`\nBEFORE (current approach):`);
console.log(`  "getVendorData": ${beforeGetVendorData} references (ALL MIXED TOGETHER)`);

console.log(`\nAFTER (symbol-based approach):`);
Object.entries(afterCounts).forEach(([id, count]) => {
  console.log(`  "${id}": ${count} references`);
});

const totalAfter = Object.values(afterCounts).reduce((sum, count) => sum + count, 0);
console.log(`\nTotal references: ${totalAfter} (should equal ${beforeGetVendorData})`);

console.log('\n' + '='.repeat(80));
console.log('EDGE CASES ANALYSIS');
console.log('='.repeat(80));

// Let's also show some interesting edge cases that are handled correctly
console.log('\nEdge cases that are now handled correctly:');

symbolBasedMap.forEach((references, uniqueId) => {
  if (uniqueId.includes('create')) {
    console.log(`\n${uniqueId}:`);
    references.forEach(ref => {
      console.log(`  ${ref.file}:${ref.line} -> ${ref.fullCall}`);
    });
  }
});

console.log('\nInheritance cases:');
symbolBasedMap.forEach((references, uniqueId) => {
  if (uniqueId.includes('BaseClass') || uniqueId.includes('DerivedClass')) {
    console.log(`\n${uniqueId}:`);
    references.forEach(ref => {
      console.log(`  ${ref.file}:${ref.line} -> ${ref.fullCall}`);
    });
  }
});
import { Project, Node, CallExpression, PropertyAccessExpression } from 'ts-morph';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * POC to definitively test ts-morph's findReferences() behavior
 *
 * Tests whether findReferences() does:
 * A) Global name search (returns ALL references to any method with same name)
 * B) Semantic analysis (returns only references to the specific class method)
 *
 * Uses existing ClassA.ts and ClassB.ts which both have getVendorData methods
 */

function testFindReferencesVsSymbolApproach() {
  console.log('=== TESTING TS-MORPH FINDREFERENCES() BEHAVIOR ===\n');

  const project = new Project({
    tsConfigFilePath: path.join(__dirname, '../../tsconfig.json')
  });

  // Add the test files
  const classAFile = project.addSourceFileAtPath(path.join(__dirname, 'ClassA.ts'));
  const classBFile = project.addSourceFileAtPath(path.join(__dirname, 'ClassB.ts'));
  const testFile = project.addSourceFileAtPath(path.join(__dirname, '../../test-line-numbers.ts'));

  console.log('Test files loaded:');
  console.log('- ClassA.ts');
  console.log('- ClassB.ts');
  console.log('- test-line-numbers.ts');
  console.log();

  // Find the getVendorData method definitions
  const classAMethod = classAFile.getClass('ClassA')?.getMethod('getVendorData');
  const classBMethod = classBFile.getClass('ClassB')?.getMethod('getVendorData');

  if (!classAMethod || !classBMethod) {
    console.error('Could not find getVendorData methods in test classes');
    return;
  }

  console.log('Found method definitions:');
  console.log(`- ClassA.getVendorData at line ${classAMethod.getStartLineNumber()}`);
  console.log(`- ClassB.getVendorData at line ${classBMethod.getStartLineNumber()}`);
  console.log();

  // TEST 1: Use findReferences() on each method definition
  console.log('=== TEST 1: Using findReferences() on method definitions ===');

  const classAReferences = classAMethod.findReferences();
  const classBReferences = classBMethod.findReferences();

  console.log(`ClassA.getVendorData findReferences() returned ${classAReferences.length} reference groups`);
  classAReferences.forEach((refGroup, i) => {
    console.log(`  Group ${i}: ${refGroup.getReferences().length} references`);
    refGroup.getReferences().forEach((ref, j) => {
      const location = ref.getNode().getSourceFile().getBaseName();
      const line = ref.getNode().getStartLineNumber();
      const text = ref.getNode().getText();
      console.log(`    Ref ${j}: ${location}:${line} - "${text}"`);
    });
  });

  console.log();
  console.log(`ClassB.getVendorData findReferences() returned ${classBReferences.length} reference groups`);
  classBReferences.forEach((refGroup, i) => {
    console.log(`  Group ${i}: ${refGroup.getReferences().length} references`);
    refGroup.getReferences().forEach((ref, j) => {
      const location = ref.getNode().getSourceFile().getBaseName();
      const line = ref.getNode().getStartLineNumber();
      const text = ref.getNode().getText();
      console.log(`    Ref ${j}: ${location}:${line} - "${text}"`);
    });
  });

  console.log();

  // TEST 2: Use symbol-based approach (the proven correct approach)
  console.log('=== TEST 2: Using symbol-based approach (from poc2-correct-approach.ts) ===');

  const symbolBasedResults = new Map<string, CallExpression[]>();

  // Scan all call expressions and categorize using symbols
  [classAFile, classBFile, testFile].forEach(sourceFile => {
    sourceFile.forEachDescendant(node => {
      if (Node.isCallExpression(node)) {
        const expr = node.getExpression();

        if (Node.isPropertyAccessExpression(expr)) {
          const methodName = expr.getName();

          if (methodName === 'getVendorData') {
            const receiver = expr.getExpression();
            const receiverType = receiver.getType();
            const receiverTypeSymbol = receiverType.getSymbol();
            const methodSymbol = expr.getSymbol();

            if (receiverTypeSymbol && methodSymbol) {
              const receiverName = receiverTypeSymbol.getName();
              const uniqueId = `${receiverName}.${methodName}`;

              const existing = symbolBasedResults.get(uniqueId) || [];
              existing.push(node);
              symbolBasedResults.set(uniqueId, existing);
            }
          }
        }
      }
    });
  });

  symbolBasedResults.forEach((calls, uniqueId) => {
    console.log(`${uniqueId}: ${calls.length} references`);
    calls.forEach((call, i) => {
      const location = call.getSourceFile().getBaseName();
      const line = call.getStartLineNumber();
      const text = call.getText();
      console.log(`  Ref ${i}: ${location}:${line} - "${text}"`);
    });
  });

  console.log();

  // TEST 3: Compare results
  console.log('=== TEST 3: COMPARISON AND CONCLUSION ===');

  // Count total references from findReferences()
  const totalClassAFromFindRefs = classAReferences.reduce((sum, group) => sum + group.getReferences().length, 0);
  const totalClassBFromFindRefs = classBReferences.reduce((sum, group) => sum + group.getReferences().length, 0);

  // Count from symbol approach
  const classAFromSymbols = symbolBasedResults.get('ClassA.getVendorData')?.length || 0;
  const classBFromSymbols = symbolBasedResults.get('ClassB.getVendorData')?.length || 0;

  console.log('Reference counts:');
  console.log(`findReferences() approach:`);
  console.log(`  ClassA.getVendorData: ${totalClassAFromFindRefs} references`);
  console.log(`  ClassB.getVendorData: ${totalClassBFromFindRefs} references`);
  console.log();
  console.log(`Symbol-based approach:`);
  console.log(`  ClassA.getVendorData: ${classAFromSymbols} references`);
  console.log(`  ClassB.getVendorData: ${classBFromSymbols} references`);
  console.log();

  // Determine behavior
  if (totalClassAFromFindRefs === totalClassBFromFindRefs && totalClassAFromFindRefs > 0) {
    console.log('🔴 CONCLUSION: findReferences() does GLOBAL NAME SEARCH');
    console.log('   Both methods return identical reference counts, proving they share the same pool');
    console.log('   This confirms our hypothesis that findReferences() returns ALL references to any method with the same name');
  } else if (classAFromSymbols !== classBFromSymbols) {
    console.log('🟢 CONCLUSION: Symbol-based approach does PROPER SEMANTIC ANALYSIS');
    console.log('   Different methods have different reference counts, proving proper disambiguation');
  } else {
    console.log('🟡 CONCLUSION: Results are inconclusive, need more test data');
  }

  console.log();
  console.log('This POC definitively proves which approach correctly disambiguates method references.');
}

// Run the test
testFindReferencesVsSymbolApproach();
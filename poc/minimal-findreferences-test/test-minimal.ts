import { Project, Node } from 'ts-morph';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MINIMAL POC to test ts-morph findReferences() behavior
 *
 * Two classes, each with a doSomething() method
 * Each class calls both its own doSomething() and the other class's doSomething()
 *
 * Expected behavior: findReferences() should return different results for each method
 * Claimed issue: findReferences() returns inconsistent/shared results
 */

function testMinimalFindReferences() {
  console.log('=== MINIMAL FINDREFERENCES TEST ===\n');

  const project = new Project({
    tsConfigFilePath: path.join(__dirname, '../../tsconfig.json')
  });

  // Load the simple test files
  const simpleAFile = project.addSourceFileAtPath(path.join(__dirname, 'SimpleA.ts'));
  const simpleBFile = project.addSourceFileAtPath(path.join(__dirname, 'SimpleB.ts'));

  console.log('Files loaded:');
  console.log('- SimpleA.ts');
  console.log('- SimpleB.ts');
  console.log();

  // Find the doSomething method definitions
  const classA = simpleAFile.getClass('SimpleA');
  const classB = simpleBFile.getClass('SimpleB');

  if (!classA || !classB) {
    console.error('Could not find classes');
    return;
  }

  const methodA = classA.getMethod('doSomething');
  const methodB = classB.getMethod('doSomething');

  if (!methodA || !methodB) {
    console.error('Could not find doSomething methods');
    return;
  }

  console.log('Method definitions found:');
  console.log(`- SimpleA.doSomething at line ${methodA.getStartLineNumber()}`);
  console.log(`- SimpleB.doSomething at line ${methodB.getStartLineNumber()}`);
  console.log();

  // Test findReferences() on each method
  console.log('=== TESTING FINDREFERENCES() ===');

  console.log('1. SimpleA.doSomething findReferences():');
  const refsA = methodA.findReferences();
  console.log(`   Found ${refsA.length} reference groups`);

  let totalRefsA = 0;
  refsA.forEach((refGroup, groupIndex) => {
    const refs = refGroup.getReferences();
    totalRefsA += refs.length;
    console.log(`   Group ${groupIndex}: ${refs.length} references`);

    refs.forEach((ref, refIndex) => {
      const node = ref.getNode();
      const file = node.getSourceFile().getBaseName();
      const line = node.getStartLineNumber();
      const text = node.getText();
      const isDefinition = ref.isDefinition() ? ' [DEFINITION]' : '';
      console.log(`     ${refIndex}: ${file}:${line} - "${text}"${isDefinition}`);
    });
  });
  console.log(`   TOTAL REFERENCES: ${totalRefsA}`);
  console.log();

  console.log('2. SimpleB.doSomething findReferences():');
  const refsB = methodB.findReferences();
  console.log(`   Found ${refsB.length} reference groups`);

  let totalRefsB = 0;
  refsB.forEach((refGroup, groupIndex) => {
    const refs = refGroup.getReferences();
    totalRefsB += refs.length;
    console.log(`   Group ${groupIndex}: ${refs.length} references`);

    refs.forEach((ref, refIndex) => {
      const node = ref.getNode();
      const file = node.getSourceFile().getBaseName();
      const line = node.getStartLineNumber();
      const text = node.getText();
      const isDefinition = ref.isDefinition() ? ' [DEFINITION]' : '';
      console.log(`     ${refIndex}: ${file}:${line} - "${text}"${isDefinition}`);
    });
  });
  console.log(`   TOTAL REFERENCES: ${totalRefsB}`);
  console.log();

  // Analysis
  console.log('=== ANALYSIS ===');
  console.log(`SimpleA.doSomething total references: ${totalRefsA}`);
  console.log(`SimpleB.doSomething total references: ${totalRefsB}`);

  if (totalRefsA === totalRefsB) {
    console.log('🔴 SUSPICIOUS: Both methods have identical reference counts');
    console.log('   This suggests possible reference pooling or global name search');
  } else {
    console.log('🟢 NORMAL: Different methods have different reference counts');
    console.log('   This suggests proper semantic disambiguation');
  }

  // Expected references based on our simple code:
  // SimpleA.doSomething should be referenced at:
  //   - SimpleA.ts:7 (this.doSomething())
  //   - SimpleB.ts:9 (a.doSomething())
  //   Total: 2 + 1 definition = 3
  //
  // SimpleB.doSomething should be referenced at:
  //   - SimpleB.ts:7 (this.doSomething())
  //   - SimpleA.ts:9 (b.doSomething())
  //   Total: 2 + 1 definition = 3

  console.log();
  console.log('Expected references (excluding definitions):');
  console.log('- SimpleA.doSomething: 2 references (SimpleA.ts:7, SimpleB.ts:9)');
  console.log('- SimpleB.doSomething: 2 references (SimpleB.ts:7, SimpleA.ts:9)');

  const nonDefRefsA = totalRefsA - refsA.reduce((sum, group) =>
    sum + group.getReferences().filter(r => r.isDefinition()).length, 0);
  const nonDefRefsB = totalRefsB - refsB.reduce((sum, group) =>
    sum + group.getReferences().filter(r => r.isDefinition()).length, 0);

  console.log();
  console.log('Actual non-definition references:');
  console.log(`- SimpleA.doSomething: ${nonDefRefsA} references`);
  console.log(`- SimpleB.doSomething: ${nonDefRefsB} references`);

  if (nonDefRefsA === 2 && nonDefRefsB === 2) {
    console.log('✅ CORRECT: Each method has exactly 2 references as expected');
  } else {
    console.log('❌ UNEXPECTED: Reference counts don\'t match expectations');
    console.log('   This indicates either pooling issues or our test setup is wrong');
  }
}

testMinimalFindReferences();
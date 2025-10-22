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
console.log('EXPLORING WHAT TS-MORPH ACTUALLY TELLS US');
console.log('='.repeat(80));

console.log('\n1. REPRODUCING CURRENT BEHAVIOR:');
console.log('-'.repeat(50));

// Exactly mimic the current functionReferenceTracker logic
const functionCallMap = new Map<string, any[]>();

project.getSourceFiles().forEach(sourceFile => {
  const filePath = sourceFile.getFilePath();
  const fileName = path.basename(filePath);

  console.log(`\nProcessing file: ${fileName}`);

  sourceFile.forEachDescendant((node: Node) => {
    if (Node.isCallExpression(node)) {
      const expression = node.getExpression();
      let functionName = '';

      // Handle direct function calls like functionName()
      if (Node.isIdentifier(expression)) {
        functionName = expression.getText();
        console.log(`  Found direct call: ${functionName}`);
      }

      // Handle method-style calls like obj.functionName()
      if (Node.isPropertyAccessExpression(expression)) {
        functionName = expression.getName();
        console.log(`  Found method call: ${expression.getText()} -> storing as "${functionName}"`);
      }

      if (functionName) {
        const existing = functionCallMap.get(functionName) || [];
        existing.push({
          file: fileName,
          line: node.getStartLineNumber(),
          fullCall: node.getText()
        });
        functionCallMap.set(functionName, existing);
      }
    }
  });
});

console.log('\n2. CURRENT APPROACH RESULTS:');
console.log('-'.repeat(50));
functionCallMap.forEach((references, name) => {
  console.log(`\n"${name}" has ${references.length} references:`);
  references.forEach(ref => {
    console.log(`  - ${ref.file}:${ref.line} -> ${ref.fullCall}`);
  });
});

console.log('\n3. WHAT ELSE CAN TS-MORPH TELL US ABOUT THESE CALLS?');
console.log('-'.repeat(50));

project.getSourceFiles().forEach(sourceFile => {
  const fileName = path.basename(sourceFile.getFilePath());

  sourceFile.forEachDescendant(node => {
    if (Node.isCallExpression(node)) {
      const expr = node.getExpression();

      if (Node.isPropertyAccessExpression(expr)) {
        const methodName = expr.getName();
        const line = node.getStartLineNumber();

        console.log(`\nAnalyzing call: ${expr.getText()} at ${fileName}:${line}`);

        // What can we get from the expression?
        const receiver = expr.getExpression();
        console.log(`  Receiver node type: ${receiver.getKindName()}`);
        console.log(`  Receiver text: ${receiver.getText()}`);

        // Can we get any type information?
        try {
          const receiverType = receiver.getType();
          console.log(`  Receiver type: ${receiverType.getText()}`);
          console.log(`  Receiver type symbol: ${receiverType.getSymbol()?.getName() || 'none'}`);
        } catch (e: any) {
          console.log(`  Receiver type: failed to get (${e.message})`);
        }

        // What about the method itself?
        try {
          const methodSymbol = expr.getSymbol();
          console.log(`  Method symbol: ${methodSymbol?.getName() || 'none'}`);

          if (methodSymbol) {
            const declarations = methodSymbol.getDeclarations();
            console.log(`  Method declarations: ${declarations.length}`);
            declarations.forEach((decl, i) => {
              const declFile = path.basename(decl.getSourceFile().getFilePath());
              console.log(`    [${i}] ${declFile}:${decl.getStartLineNumber()}`);
            });
          }
        } catch (e: any) {
          console.log(`  Method symbol: failed to get (${e.message})`);
        }
      }
    }
  });
});

console.log('\n' + '='.repeat(80));
console.log('RAW OBSERVATIONS - NO CONCLUSIONS YET');
console.log('='.repeat(80));
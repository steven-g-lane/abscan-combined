export class ClassB {
  private data: number = 42;

  // Same method name as ClassA
  getVendorData(): number {
    return this.data * 2;
  }

  // Another method with same name as ClassA
  process(): void {
    console.log("Processing in ClassB");
  }

  // Static method with same name as ClassA
  static create(): ClassB {
    return new ClassB();
  }

  // Call our own method
  selfCall(): number {
    return this.getVendorData();
  }

  // Method that calls ClassA's method
  crossCall(): string {
    const a = new ClassA();
    return a.getVendorData(); // This should reference ClassA.getVendorData, not ClassB.getVendorData
  }
}

// Import and use ClassA
import { ClassA } from './ClassA';

// Module-level function with same name as in ModuleA
export function moduleFunction(): number {
  return 123;
}

// Function that makes cross-module calls
export function crossModuleCaller(): void {
  const a = ClassA.create();
  const b = ClassB.create();

  // These should be attributed to the correct classes
  a.getVendorData();
  b.getVendorData();
  a.process();
  b.process();
}
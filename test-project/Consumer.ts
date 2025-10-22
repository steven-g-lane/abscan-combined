import { ClassA, moduleFunction as moduleAFunc } from './ClassA';
import { ClassB, moduleFunction as moduleBFunc } from './ClassB';

export class Consumer {
  // Method that uses both classes with same-named methods
  useClasses(): void {
    const a = new ClassA();
    const b = new ClassB();

    // These calls should be attributed correctly:
    // a.getVendorData() -> ClassA.getVendorData
    // b.getVendorData() -> ClassB.getVendorData
    const dataA = a.getVendorData();
    const dataB = b.getVendorData();

    // Same for process methods
    a.process();
    b.process();

    // Static method calls
    const newA = ClassA.create();
    const newB = ClassB.create();

    console.log(dataA, dataB);
  }

  // Method that calls module functions with same names
  useModuleFunctions(): void {
    // These should be attributed to the correct modules
    const resultA = moduleAFunc();  // Should reference ClassA.moduleFunction
    const resultB = moduleBFunc();  // Should reference ClassB.moduleFunction

    console.log(resultA, resultB);
  }

  // Method with same name as other classes (but different signature)
  getVendorData(prefix: string): string {
    return prefix + "-consumer-data";
  }
}

// Standalone function calls
export function standaloneCaller(): void {
  const consumer = new Consumer();

  // This should reference Consumer.getVendorData
  const data = consumer.getVendorData("test");

  consumer.useClasses();
  consumer.useModuleFunctions();
}
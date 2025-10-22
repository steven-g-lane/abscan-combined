import { ClassA } from './ClassA';

// Base class
export class BaseClass {
  getVendorData(): string {
    return "base-data";
  }

  process(): void {
    console.log("Base processing");
  }
}

// Derived class that overrides methods
export class DerivedClass extends BaseClass {
  // Override with same name
  getVendorData(): string {
    return "derived-" + super.getVendorData();
  }

  // New method that calls parent
  callParent(): string {
    return super.getVendorData(); // Should reference BaseClass.getVendorData
  }

  // Method that calls external class
  callExternal(): string {
    const a = new ClassA();
    return a.getVendorData(); // Should reference ClassA.getVendorData
  }
}

// Function that demonstrates polymorphism
export function polymorphicCaller(obj: BaseClass): string {
  // This call could resolve to BaseClass.getVendorData OR DerivedClass.getVendorData
  // depending on the actual object type at runtime
  return obj.getVendorData();
}

// Function that creates complex call patterns
export function complexCaller(): void {
  const base = new BaseClass();
  const derived = new DerivedClass();

  // These should be attributed correctly
  base.getVendorData();    // -> BaseClass.getVendorData
  derived.getVendorData(); // -> DerivedClass.getVendorData

  // Polymorphic calls
  polymorphicCaller(base);    // Could be BaseClass.getVendorData
  polymorphicCaller(derived); // Could be DerivedClass.getVendorData
}
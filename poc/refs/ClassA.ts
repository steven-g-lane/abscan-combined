export class ClassA {
  private data: string = "A";

  // Same method name as ClassB
  getVendorData(): string {
    return this.data + "-vendor";
  }

  // Another method with same name as ClassB
  process(): void {
    console.log("Processing in ClassA");
  }

  // Static method with same name as ClassB
  static create(): ClassA {
    return new ClassA();
  }

  // Call our own method
  selfCall(): string {
    return this.getVendorData();
  }
}

// Module-level function with same name as in ModuleB
export function moduleFunction(): string {
  return "from module A";
}

// Another module function
export function helperFunction(): void {
  const instance = ClassA.create();
  instance.process();
  const data = instance.getVendorData();
  console.log(data);
}
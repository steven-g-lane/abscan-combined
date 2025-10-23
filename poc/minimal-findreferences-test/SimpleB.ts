export class SimpleB {
  doSomething(): number {
    return 42;
  }

  callOther(): void {
    this.doSomething();  // Line 7: SimpleB calling own method
    const a = new SimpleA();
    a.doSomething();     // Line 9: SimpleB calling SimpleA method
  }
}

import { SimpleA } from './SimpleA';
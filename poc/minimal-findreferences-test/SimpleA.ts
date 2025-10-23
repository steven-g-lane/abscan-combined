export class SimpleA {
  doSomething(): string {
    return "A";
  }

  callOther(): void {
    this.doSomething();  // Line 7: SimpleA calling own method
    const b = new SimpleB();
    b.doSomething();     // Line 9: SimpleA calling SimpleB method
  }
}

import { SimpleB } from './SimpleB';
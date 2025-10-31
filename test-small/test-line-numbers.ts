class TestClass {
  getVendorData(): string {
    return "test data";
  }
}

// Line 7: This should be the reference line
const obj = new TestClass();
const result = obj.getVendorData();  // This call should be on line 9
console.log(result);
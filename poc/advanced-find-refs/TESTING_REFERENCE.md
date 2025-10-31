# Quick Reference: Testing getVendorData Methods

## Test Implementation Strategy

This reference guide helps understand where and how to test the getVendorData polymorphic pattern in ai-client.

---

## What Gets Tested

### Message Level Testing

**Method**: `Message.getVendorData(): T`

**Classes to Test**:
1. `AnthropicMessage.getVendorData()` -> `Anthropic.Messages.MessageParam`
2. `GeminiMessage.getVendorData()` -> `Content`
3. `OpenAIMessage.getVendorData()` -> `OpenAI.Responses.EasyInputMessage`

**Key Testing Points**:
- Correct type is returned
- Wrapped SDK-specific data is accessible
- Multiple content blocks are properly formatted
- Vendor-specific properties are preserved

**Example Test Pattern**:
```typescript
describe('AnthropicMessage.getVendorData()', () => {
  it('should return Anthropic.Messages.MessageParam with correct structure', () => {
    const message = new AnthropicMessage('user')
      .addTextContent('Hello')
      .addImageFromURL('https://...');
    
    const data = message.getVendorData();
    
    // Type is correct
    expect(data).toHaveProperty('role');
    expect(data).toHaveProperty('content');
    expect(data.role).toBe('user');
    expect(Array.isArray(data.content)).toBe(true);
    
    // Content blocks are correct
    expect(data.content).toHaveLength(2);
    expect(data.content[0].type).toBe('text');
    expect(data.content[1].type).toBe('image');
  });
});
```

---

### Manager Level Testing

**Method**: `ConversationManager.getVendorData(): Record<string, any>`

**Classes to Test**:
1. `AnthropicConversationManager.getVendorData()`
2. `GeminiConversationManager.getVendorData()`
3. `OpenAIConversationManager.getVendorData()`

**Key Testing Points**:
- Persistence data includes required fields
- Token usage is tracked and returned
- Model/config information is persisted
- setVendorData can restore state

**Example Test Pattern** (from integration.test.ts line 351):
```typescript
describe('AnthropicConversationManager.getVendorData()', () => {
  it('should return persistence-ready vendor data', async () => {
    const manager = new AnthropicConversationManager();
    
    // Send message to accumulate token data
    const message = new AnthropicMessage('user')
      .addTextContent('Hello');
    await manager.sendMessage(message);
    
    // Get vendor data
    const vendorData = manager.getVendorData();
    
    // Check required fields
    expect(vendorData).toHaveProperty('model');
    expect(vendorData).toHaveProperty('maxTokens');
    expect(vendorData).toHaveProperty('tokenUsage');
    
    // Token tracking should work
    expect(vendorData.tokenUsage).toBeDefined();
    expect(vendorData.tokenUsage.totalTokens).toBeGreaterThan(0);
  });
});
```

---

## Usage Locations (Where getVendorData is Called)

### Message Level Calls

**Critical Call Sites**:

| File | Line | Context | Usage |
|------|------|---------|-------|
| AnthropicConversationManager.ts | 96 | sendMessage() | Extract MessageParam from wrapper |
| AnthropicConversationManager.ts | 388 | Batch operations | Extract MessageParam |
| AnthropicConversationManager.ts | 593 | Document injection | Extract MessageParam |
| GeminiConversationManager.ts | 85 | sendMessage() | Extract Content from wrapper |
| OpenAIConversationManager.ts | 78 | sendMessage() | Extract EasyInputMessage from wrapper |

**Pattern** (all managers):
```typescript
async sendMessage(message: XxxMessage): Promise<string> {
    // CRITICAL: This is where polymorphism happens
    const vendorData = message.getVendorData();
    
    // vendorData is now vendor-specific SDK type
    this.messages.push(vendorData);
    
    // Send to vendor API
    const response = await this.client.xxx.create({
        messages: this.messages,  // Type-safe - compiler knows structure
        // ...
    });
}
```

### Manager Level Calls

| File | Line | Context | Usage |
|------|------|---------|-------|
| ConversationService.ts | ? | Persistence | Save manager state to DB |
| integration.test.ts | 351 | Token tracking | Verify persistence data |

---

## Test Coverage Checklist

### Message-Level Tests

- [ ] AnthropicMessage.getVendorData() returns Anthropic.Messages.MessageParam
  - [ ] Has role property
  - [ ] Has content array
  - [ ] Content blocks properly typed
  
- [ ] GeminiMessage.getVendorData() returns Content
  - [ ] Has role property
  - [ ] Has parts array
  - [ ] Inline data properly formatted
  
- [ ] OpenAIMessage.getVendorData() returns EasyInputMessage
  - [ ] Has role property
  - [ ] Has content array
  - [ ] Content items properly typed

- [ ] Polymorphism works with base Message reference
  - [ ] Can assign any concrete class to Message<T>
  - [ ] getVendorData() returns correct type at runtime

- [ ] Complex content scenarios
  - [ ] Multiple text blocks
  - [ ] Mixed text and images
  - [ ] Document attachments
  - [ ] Cache control (Anthropic)

### Manager-Level Tests

- [ ] AnthropicConversationManager.getVendorData()
  - [ ] Returns Record with model, maxTokens, tokenUsage
  - [ ] tokenUsage accumulates correctly
  - [ ] setVendorData restores state

- [ ] GeminiConversationManager.getVendorData()
  - [ ] Returns Record with modelId, maxTokens, tokenUsage
  - [ ] Persistence round-trip works
  
- [ ] OpenAIConversationManager.getVendorData()
  - [ ] Returns Record with model, maxTokens, tokenUsage
  - [ ] State restoration preserves config

- [ ] Message extraction in sendMessage()
  - [ ] manager.sendMessage(message) properly calls message.getVendorData()
  - [ ] Extracted data is used correctly
  - [ ] Type safety is maintained

### Integration Tests

- [ ] Full conversation flow with polymorphism
  - [ ] Create message with specific vendor class
  - [ ] Pass to manager.sendMessage()
  - [ ] Manager extracts vendor data via getVendorData()
  - [ ] Data sent to correct vendor API
  - [ ] Response processed correctly

- [ ] Persistence round-trip
  - [ ] manager.getVendorData() returns state
  - [ ] State can be serialized to JSON
  - [ ] setVendorData() restores state
  - [ ] Manager continues functioning after restore

---

## Type Safety Verification

### Compile-Time Tests

```typescript
// These should all compile without errors

// Message level - type inference
const msg1 = new AnthropicMessage('user');
const data1 = msg1.getVendorData();
// TypeScript infers: Anthropic.Messages.MessageParam
// Can access: data1.role, data1.content

const msg2 = new GeminiMessage('user');
const data2 = msg2.getVendorData();
// TypeScript infers: Content
// Can access: data2.role, data2.parts

// Manager level - interface contract
const manager: ConversationManager = getManager(vendor);
const data = manager.getVendorData();
// TypeScript infers: Record<string, any>
// Can access: data[key] (runtime lookup)
```

### Runtime Tests

```typescript
// Verify actual types at runtime
const msg = new AnthropicMessage('user');
const data = msg.getVendorData();

// Should be true
console.assert(typeof data.role === 'string');
console.assert(Array.isArray(data.content));

// Should not throw
for (const block of data.content) {
    console.assert(typeof block.type === 'string');
}
```

---

## Key Assertions for Tests

### Message Level

```typescript
// Type checking
expect(typeof vendorData).toBe('object');
expect(vendorData).not.toBeNull();

// Structure validation
expect(vendorData).toHaveProperty('role');
expect(vendorData).toHaveProperty('content'); // Anthropic, OpenAI
expect(vendorData).toHaveProperty('parts');   // Gemini

// Content validation
expect(Array.isArray(vendorData.content) || 
        Array.isArray(vendorData.parts)).toBe(true);

// Block type validation
const blocks = vendorData.content || vendorData.parts;
blocks.forEach(block => {
    expect(block).toHaveProperty('type');
    expect(['text', 'image', 'document', 'input_file']).toContain(block.type);
});
```

### Manager Level

```typescript
// Required properties
expect(vendorData).toHaveProperty('tokenUsage');
expect(vendorData.tokenUsage).toHaveProperty('inputTokens');
expect(vendorData.tokenUsage).toHaveProperty('outputTokens');
expect(vendorData.tokenUsage).toHaveProperty('totalTokens');

// Token values (after sending message)
expect(vendorData.tokenUsage.totalTokens).toBeGreaterThan(0);

// Persistence test
const saved = manager.getVendorData();
const newManager = new AnthropicConversationManager();
newManager.setVendorData(saved);
expect(newManager.getVendorData()).toEqual(saved);
```

---

## Files to Review for Testing Patterns

1. **Existing Integration Test**:
   - Path: `/src/tests/integration.test.ts`
   - Key lines: 351 (manager.getVendorData() usage)
   - Pattern: Real API testing with assertions

2. **Message Classes** (for structure):
   - `/src/messages/Message.ts` (abstract definition)
   - `/src/messages/AnthropicMessage.ts` (implementation)
   - `/src/messages/GeminiMessage.ts` (implementation)
   - `/src/messages/OpenAIMessage.ts` (implementation)

3. **Manager Classes** (for state management):
   - `/src/managers/ConversationManager.ts` (interface)
   - `/src/managers/AnthropicConversationManager.ts` (325-352 for getVendorData)
   - `/src/managers/GeminiConversationManager.ts` (208-214)
   - `/src/managers/OpenAIConversationManager.ts` (237-243)

---

## Testing Complexity Levels

### Level 1: Unit Tests (Simple)
- Test individual getVendorData() methods
- Mock dependencies
- Focus on return type and structure
- ~20 tests per class

### Level 2: Integration Tests (Medium)
- Test message creation -> manager.sendMessage() flow
- Test manager.getVendorData() after conversations
- Verify token tracking
- ~10 tests per manager

### Level 3: End-to-End Tests (Complex)
- Full conversation with persistence
- Cross-vendor testing (run same test with all 3 vendors)
- Performance/stress testing
- ~5 tests total

---

## Common Pitfalls to Avoid

1. **Type Safety Confusion**
   - Message level: Generic types (T = specific vendor type)
   - Manager level: Record<string, any> (uniform interface)
   - Don't confuse the two levels

2. **Vendor-Specific Properties**
   - Anthropic: messageParam.content is array
   - Gemini: content.parts is array
   - OpenAI: messageParam.content is array
   - Structure differs - test each specifically

3. **Persistence Round-Trip**
   - getVendorData() returns what can be persisted
   - NOT all internal state (e.g., messages array omitted in Anthropic)
   - setVendorData() must handle this correctly

4. **Polymorphic Resolution**
   - At compile time: type is known (Message<T>)
   - At runtime: type depends on actual class
   - Both work because of covariant override

---

## Summary

The getVendorData pattern is tested through:

1. **Direct unit tests** on message classes
2. **Integration tests** on manager classes
3. **Type safety verification** at compile and runtime
4. **Persistence round-trip** validation
5. **Polymorphic resolution** verification

All tests verify that vendor abstraction layers correctly expose vendor-specific SDK types while maintaining polymorphic contract at each level.

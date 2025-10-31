# Absolute Paths Reference

All absolute file paths from the ai-client codebase exploration.

## Source Code Files

### Message Classes (Abstract Base + Implementations)

**Base Class**:
- `/Users/slane/Documents/Code/electron/ai-client/src/messages/Message.ts`
  - Line 22: `abstract getVendorData(): T;`

**Anthropic Implementation**:
- `/Users/slane/Documents/Code/electron/ai-client/src/messages/AnthropicMessage.ts`
  - Lines 272-274: `getVendorData()` method
  - Returns: `Anthropic.Messages.MessageParam`

**Google/Gemini Implementation**:
- `/Users/slane/Documents/Code/electron/ai-client/src/messages/GeminiMessage.ts`
  - Lines 146-148: `getVendorData()` method
  - Returns: `Content`

**OpenAI Implementation**:
- `/Users/slane/Documents/Code/electron/ai-client/src/messages/OpenAIMessage.ts`
  - Lines 168-170: `getVendorData()` method
  - Returns: `OpenAI.Responses.EasyInputMessage`

---

### Manager Classes (Interface + Implementations)

**Base Interface**:
- `/Users/slane/Documents/Code/electron/ai-client/src/managers/ConversationManager.ts`
  - Line 31: `getVendorData(): Record<string, any>;`
  - Line 39: `setVendorData(data: Record<string, any>): void;`

**Anthropic Manager Implementation**:
- `/Users/slane/Documents/Code/electron/ai-client/src/managers/AnthropicConversationManager.ts`
  - Lines 325-333: `getVendorData()` implementation
  - Lines 335-352: `setVendorData()` implementation
  - Line 96: Polymorphic call: `const messageParam = message.getVendorData();`
  - Line 388: Polymorphic call in batch operations
  - Line 593: Polymorphic call in document injection

**Google/Gemini Manager Implementation**:
- `/Users/slane/Documents/Code/electron/ai-client/src/managers/GeminiConversationManager.ts`
  - Lines 208-214: `getVendorData()` implementation
  - Lines 216-234: `setVendorData()` implementation
  - Line 85: Polymorphic call: `const content = message.getVendorData();`

**OpenAI Manager Implementation**:
- `/Users/slane/Documents/Code/electron/ai-client/src/managers/OpenAIConversationManager.ts`
  - Lines 237-243: `getVendorData()` implementation
  - Lines 245-261: `setVendorData()` implementation
  - Line 78: Polymorphic call: `const messageParam = message.getVendorData();`

---

### Service Layer

**Orchestration Service**:
- `/Users/slane/Documents/Code/electron/ai-client/src/services/ConversationService.ts`
  - ~908 lines total
  - Uses both manager.getVendorData() and message.getVendorData() indirectly

---

### Testing

**Integration Tests**:
- `/Users/slane/Documents/Code/electron/ai-client/tests/integration.test.ts`
  - Line 351: `const vendorData = manager.getVendorData();`
  - Tests token tracking and persistence data

---

## Configuration Files

**TypeScript Configuration**:
- `/Users/slane/Documents/Code/electron/ai-client/tsconfig.json`
  - Target: ES2022
  - Strict mode: enabled
  - Paths: `@/*` -> `src/*`
  - Declaration maps: enabled

---

## Critical Call Sites Summary

### Message Level Calls (where polymorphism is used)

1. **AnthropicConversationManager.ts:96**
   ```
   /Users/slane/Documents/Code/electron/ai-client/src/managers/AnthropicConversationManager.ts:96
   const messageParam = message.getVendorData();
   ```

2. **AnthropicConversationManager.ts:388**
   ```
   /Users/slane/Documents/Code/electron/ai-client/src/managers/AnthropicConversationManager.ts:388
   const messageParam = anthropicMessage.getVendorData();
   ```

3. **AnthropicConversationManager.ts:593**
   ```
   /Users/slane/Documents/Code/electron/ai-client/src/managers/AnthropicConversationManager.ts:593
   const messageParam = anthropicMessage.getVendorData();
   ```

4. **GeminiConversationManager.ts:85**
   ```
   /Users/slane/Documents/Code/electron/ai-client/src/managers/GeminiConversationManager.ts:85
   const content = message.getVendorData();
   ```

5. **OpenAIConversationManager.ts:78**
   ```
   /Users/slane/Documents/Code/electron/ai-client/src/managers/OpenAIConversationManager.ts:78
   const messageParam = message.getVendorData();
   ```

### Manager Level Calls (for persistence)

6. **AnthropicConversationManager.ts:325-333**
   ```
   /Users/slane/Documents/Code/electron/ai-client/src/managers/AnthropicConversationManager.ts:325-333
   getVendorData() method returning persistence data
   ```

7. **GeminiConversationManager.ts:208-214**
   ```
   /Users/slane/Documents/Code/electron/ai-client/src/managers/GeminiConversationManager.ts:208-214
   getVendorData() method returning persistence data
   ```

8. **OpenAIConversationManager.ts:237-243**
   ```
   /Users/slane/Documents/Code/electron/ai-client/src/managers/OpenAIConversationManager.ts:237-243
   getVendorData() method returning persistence data
   ```

### Test Level Calls (verification)

9. **integration.test.ts:351**
   ```
   /Users/slane/Documents/Code/electron/ai-client/tests/integration.test.ts:351
   const vendorData = manager.getVendorData();
   ```

---

## Directory Structure

### Source Directories

```
/Users/slane/Documents/Code/electron/ai-client/src/
├── assets/                    # Fonts and images
├── components/                # React UI components
├── config/                    # Configuration
├── constants/                 # Constants (roles, tokens)
├── contexts/                  # React contexts
├── database/                  # Database schema and service
├── hooks/                     # React hooks
├── ipc/                       # Electron IPC
├── lib/                       # Utilities
├── managers/                  # Conversation managers (POLYMORPHIC)
├── messages/                  # Message classes (POLYMORPHIC)
├── repositories/              # Data access layer
├── schemas/                   # Data schemas
├── services/                  # Business logic services
├── types/                     # Type definitions
└── utils/                     # Utility functions
```

### Key Directories for Polymorphism

**Messages (Tier 1)**:
- `/Users/slane/Documents/Code/electron/ai-client/src/messages/`

**Managers (Tier 2)**:
- `/Users/slane/Documents/Code/electron/ai-client/src/managers/`

**Tests**:
- `/Users/slane/Documents/Code/electron/ai-client/tests/`

---

## Project Root

**Main Directory**:
- `/Users/slane/Documents/Code/electron/ai-client/`

**Related Project** (abscan-combined):
- `/Users/slane/Documents/Code/abscan-combined/`

**Documentation** (this exploration):
- `/Users/slane/Documents/Code/abscan-combined/poc/advanced-find-refs/`

---

## File Statistics

### By Type

**Message Files**:
- 1 abstract base class
- 3 concrete implementations
- Total: 4 files

**Manager Files**:
- 1 interface definition
- 3 concrete implementations
- Total: 4 files

**Support Files**:
- 1 service layer file (ConversationService.ts)
- 1 test file (integration.test.ts)
- 1 config file (tsconfig.json)
- Total: 3 files

**Total Core Files Analyzed**: 11 files

### Line Counts

| File | Type | Lines | Key Method |
|------|------|-------|-----------|
| Message.ts | Base | 25 | Line 22 |
| AnthropicMessage.ts | Impl | 311 | Lines 272-274 |
| GeminiMessage.ts | Impl | 178 | Lines 146-148 |
| OpenAIMessage.ts | Impl | 177 | Lines 168-170 |
| ConversationManager.ts | Interface | 77 | Line 31 |
| AnthropicConversationManager.ts | Impl | 650+ | Lines 325-333 |
| GeminiConversationManager.ts | Impl | 240+ | Lines 208-214 |
| OpenAIConversationManager.ts | Impl | 270+ | Lines 237-243 |
| ConversationService.ts | Service | 908 | Multiple |
| integration.test.ts | Test | 400+ | Line 351 |
| tsconfig.json | Config | 30 | Config |

---

## SDK Dependencies

The polymorphic pattern works with three vendor-specific SDKs:

1. **Anthropic SDK**
   - Package: `@anthropic-ai/sdk`
   - Type: `Anthropic.Messages.MessageParam`
   - File: `/Users/slane/Documents/Code/electron/ai-client/src/messages/AnthropicMessage.ts`

2. **Google Generative AI SDK**
   - Package: `@google/genai`
   - Type: `Content`
   - File: `/Users/slane/Documents/Code/electron/ai-client/src/messages/GeminiMessage.ts`

3. **OpenAI SDK**
   - Package: `openai`
   - Type: `OpenAI.Responses.EasyInputMessage`
   - File: `/Users/slane/Documents/Code/electron/ai-client/src/messages/OpenAIMessage.ts`

---

## Quick Copy-Paste Reference

### All Message Files

```
/Users/slane/Documents/Code/electron/ai-client/src/messages/Message.ts
/Users/slane/Documents/Code/electron/ai-client/src/messages/AnthropicMessage.ts
/Users/slane/Documents/Code/electron/ai-client/src/messages/GeminiMessage.ts
/Users/slane/Documents/Code/electron/ai-client/src/messages/OpenAIMessage.ts
```

### All Manager Files

```
/Users/slane/Documents/Code/electron/ai-client/src/managers/ConversationManager.ts
/Users/slane/Documents/Code/electron/ai-client/src/managers/AnthropicConversationManager.ts
/Users/slane/Documents/Code/electron/ai-client/src/managers/GeminiConversationManager.ts
/Users/slane/Documents/Code/electron/ai-client/src/managers/OpenAIConversationManager.ts
```

### All Polymorphic Call Sites

```
/Users/slane/Documents/Code/electron/ai-client/src/managers/AnthropicConversationManager.ts:96
/Users/slane/Documents/Code/electron/ai-client/src/managers/AnthropicConversationManager.ts:388
/Users/slane/Documents/Code/electron/ai-client/src/managers/AnthropicConversationManager.ts:593
/Users/slane/Documents/Code/electron/ai-client/src/managers/GeminiConversationManager.ts:85
/Users/slane/Documents/Code/electron/ai-client/src/managers/OpenAIConversationManager.ts:78
/Users/slane/Documents/Code/electron/ai-client/tests/integration.test.ts:351
```

---

Generated: 2025-10-30
For use with reference finder testing on getVendorData polymorphic patterns

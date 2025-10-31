# Visual Architecture: getVendorData Polymorphic Pattern

## Two-Tier Polymorphism Architecture

```
                            SERVICE LAYER
                                  |
                    ConversationService
                    (orchestrator - uses both tiers)
                           |
                ___________+___________
               |                       |
        Manager Tier            Message Tier
       (Interface-based)      (Generic-based)

┌─────────────────────────────────────────────────────────────────┐
│                     MANAGER TIER (Tier 2)                        │
│              Interface-based Polymorphism                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  interface ConversationManager {                                │
│    getVendorData(): Record<string, any>                        │
│    setVendorData(data: Record<string, any>): void              │
│    ...                                                           │
│  }                                                               │
│                                                                   │
│  ┌─────────────────────┬──────────────────┬──────────────────┐ │
│  │                     │                  │                  │ │
│  v                     v                  v                  │ │
│                                                               │ │
│ AnthropicConversation GeminiConversation  OpenAIConversation│ │
│ Manager              Manager              Manager            │ │
│ ─────────────────────────────────────────────────────────── │ │
│ getVendorData():     getVendorData():     getVendorData():  │ │
│ {                    {                    {                 │ │
│   model: string      modelId: string      model: string     │ │
│   maxTokens: num     maxTokens: num       maxTokens: num    │ │
│   tokenUsage: {...}  tokenUsage: {...}    tokenUsage: {...} │ │
│ }                    }                    }                 │ │
│                                                               │ │
└─────────────────────────────────────────────────────────────────┘

                            BRIDGING LAYER
                    (Manager calls Message.getVendorData())

┌─────────────────────────────────────────────────────────────────┐
│                     MESSAGE TIER (Tier 1)                        │
│            Generic Type Parameter Polymorphism                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  abstract class Message<T = any> {                              │
│    abstract getVendorData(): T                                  │
│  }                                                               │
│                                                                   │
│  ┌──────────────────────┬──────────────────┬────────────────┐  │
│  │                      │                  │                │  │
│  v                      v                  v                │  │
│                                                              │  │
│ AnthropicMessage     GeminiMessage       OpenAIMessage      │  │
│ extends Message<     extends Message<    extends Message<  │  │
│   Anthropic.        Content              OpenAI.Responses  │  │
│   Messages.                              .Easy             │  │
│   MessageParam>                          InputMessage>     │  │
│ ─────────────────────────────────────────────────────────  │  │
│ getVendorData():     getVendorData():     getVendorData():  │  │
│ Anthropic.Messages   Content              OpenAI.Responses  │  │
│ .MessageParam {      {                    .EasyInputMessage │  │
│   role,              role,                {                 │  │
│   content: [...]     parts: [...]         role,             │  │
│ }                    }                    content: [...]    │  │
│                                           }                 │  │
│                                                              │  │
└─────────────────────────────────────────────────────────────────┘

                            SDK LAYER
                    (Vendor-specific libraries)

    ┌──────────────────┬──────────────────┬──────────────────┐
    │                  │                  │                  │
    v                  v                  v                  │
                                                             │
  @anthropic-ai/sdk  @google/genai     openai               │
  ─────────────────  ─────────────────  ──────────────────  │
  Messages.         Content            Responses.          │
  MessageParam      {role, parts}      EasyInputMessage    │
  {                                    {role, content}     │
    role,                                                  │
    content: [...]                                         │
  }                                                        │
                                                            │
└────────────────────────────────────────────────────────────┘
```

## Data Flow Through Polymorphic Chain

```
USER CREATES MESSAGE
        |
        v
┌──────────────────────────────────────────┐
│ new AnthropicMessage('user')             │
│   .addTextContent('Hello')               │
│   .addImageFromURL('https://...')        │
└──────────────────────────────────────────┘
        |
        | message wrapper created
        v
┌──────────────────────────────────────────┐
│ manager.sendMessage(message)             │ <-- Pass to Manager
└──────────────────────────────────────────┘
        |
        | Manager extracts vendor data
        v
┌──────────────────────────────────────────┐
│ const messageParam = message.             │
│   getVendorData()                        │
│                                          │
│ Returns:                                 │
│ Anthropic.Messages.MessageParam {       │
│   role: 'user',                          │
│   content: [                             │
│     { type: 'text', text: 'Hello' },    │
│     { type: 'image', source: {...} }    │
│   ]                                      │
│ }                                        │
└──────────────────────────────────────────┘
        |
        | Vendor-specific format
        v
┌──────────────────────────────────────────┐
│ this.messages.push(messageParam)         │
│ await this.client.messages.create({      │
│   messages: this.messages,               │
│   ...                                    │
│ })                                       │
└──────────────────────────────────────────┘
        |
        | Send to Anthropic API
        v
    [ANTHROPIC API]
```

## Polymorphic Resolution Examples

### Example 1: AnthropicMessage.getVendorData()

```
┌─────────────────────────────────────────────────────────┐
│ Compile Time Type Checking                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ const message: Message<Anthropic.Messages.MessageParam> │
│   = new AnthropicMessage(...)                           │
│                                                          │
│ const data = message.getVendorData()                    │
│ // TypeScript infers:                                  │
│ // const data: Anthropic.Messages.MessageParam         │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Runtime Resolution                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ AnthropicMessage.prototype.getVendorData = function()  │
│   { return this.messageParam; }                         │
│                                                          │
│ // Returns actual Anthropic.Messages.MessageParam       │
│ // with role + content properties                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Example 2: Manager-level polymorphism

```
┌─────────────────────────────────────────────────────────┐
│ Interface Contract                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ const manager: ConversationManager                      │
│   = getManagerForVendor(vendor)                         │
│                                                          │
│ const data = manager.getVendorData()                   │
│ // TypeScript infers:                                  │
│ // const data: Record<string, any>                     │
│                                                          │
│ // At runtime could be:                                │
│ // - AnthropicConversationManager.getVendorData()      │
│ // - GeminiConversationManager.getVendorData()        │
│ // - OpenAIConversationManager.getVendorData()        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Type Safety Progression

```
TIER 1 (Message Level)         TIER 2 (Manager Level)
Generic Type Parameter         Interface Implementation

Specific Types                 Generic Type
↓                             ↓
AnthropicMessage extends Message<Anthropic.Messages.MessageParam>
  getVendorData() returns specific Anthropic type

GeminiMessage extends Message<Content>
  getVendorData() returns specific Google type

OpenAIMessage extends Message<OpenAI.Responses.EasyInputMessage>
  getVendorData() returns specific OpenAI type

                              ↓
                    Manager consumes these
                    vendor-specific types
                              ↓
                    AnthropicConversationManager
                      sendMessage(message: AnthropicMessage)
                      const param = message.getVendorData()
                      // Type is known: Anthropic.Messages.MessageParam
                              ↓
                    Type-safe API call
                    this.client.messages.create({
                      messages: [messageParam, ...]
                    })
```

## Critical Polymorphic Call Sites

```
File: AnthropicConversationManager.ts

Line 96:  const messageParam = message.getVendorData();
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
          POLYMORPHIC CALL
          - Runtime: calls AnthropicMessage.getVendorData()
          - Returns: Anthropic.Messages.MessageParam

Line 388: const messageParam = anthropicMessage.getVendorData();
Line 593: const messageParam = anthropicMessage.getVendorData();
          Same pattern - extract vendor-specific type


File: GeminiConversationManager.ts

Line 85:  const content = message.getVendorData();
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
          POLYMORPHIC CALL
          - Runtime: calls GeminiMessage.getVendorData()
          - Returns: Content (Google's type)


File: OpenAIConversationManager.ts

Line 78:  const messageParam = message.getVendorData();
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
          POLYMORPHIC CALL
          - Runtime: calls OpenAIMessage.getVendorData()
          - Returns: OpenAI.Responses.EasyInputMessage


File: ConversationService.ts

Uses manager.getVendorData() for persistence
- Each manager returns different persistence data
- Service handles all three implementations through interface
```

## Method Override Chain

```
Base Definition              Override 1              Override 2              Override 3
(Abstract Base)             (Anthropic)             (Google)                (OpenAI)

Message<T>                  AnthropicMessage        GeminiMessage           OpenAIMessage
─────────────               ────────────────        ─────────────           ──────────────
abstract getVendorData()    getVendorData():        getVendorData():        getVendorData():
  : T                       Anthropic.Messages      Content                 OpenAI.Responses
                            .MessageParam           {role, parts}           .EasyInputMessage
                            {role, content}                                 {role, content}
```

## Generic Type Parameter Binding

```
ABSTRACT BASE CLASS
│
├─ Message<T = any> 
│  abstract getVendorData(): T
│
CONCRETE IMPLEMENTATIONS
│
├─ class AnthropicMessage extends Message<Anthropic.Messages.MessageParam>
│  ├─ Generic parameter T bound to: Anthropic.Messages.MessageParam
│  ├─ getVendorData() returns: Anthropic.Messages.MessageParam ✓
│  └─ Satisfies: Message<T> contract
│
├─ class GeminiMessage extends Message<Content>
│  ├─ Generic parameter T bound to: Content
│  ├─ getVendorData() returns: Content ✓
│  └─ Satisfies: Message<T> contract
│
└─ class OpenAIMessage extends Message<OpenAI.Responses.EasyInputMessage>
   ├─ Generic parameter T bound to: OpenAI.Responses.EasyInputMessage
   ├─ getVendorData() returns: OpenAI.Responses.EasyInputMessage ✓
   └─ Satisfies: Message<T> contract
```

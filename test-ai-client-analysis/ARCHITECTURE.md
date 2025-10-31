# Architecture Summary

**Project Root:** /Users/slane/Documents/Code/electron/ai-client
**Scanned At:** 2025-10-31T01:39:22.628Z
**Files Analyzed:** 127

## Files by Type

- **unknown**: 76 files
- **main**: 4 files
- **renderer**: 32 files
- **shared**: 15 files

## Type Catalog

**Total Types:** 419

- **import**: 300 entries
- **interface**: 77 entries
- **type**: 42 entries

### fs (imported)
- **fs** (import) (2:1)
  - **Unused** - No references found

### main (imported)
- **app** (import) (1:1)
  - **Unused** - No references found
- **BrowserWindow** (import) (1:1)
  - **Unused** - No references found
- **Menu** (import) (1:1)
  - **Unused** - No references found

### path (imported)
- **path** (import) (8:1)
  - **Unused** - No references found
- **dirname** (import) (4:1)
  - **Unused** - No references found
- **join** (import) (4:1)
  - **Unused** - No references found

### dotenv (imported)
- **dotenv** (import) (1:1)
  - **Unused** - No references found
- **config** (import) (6:1)
  - **Unused** - No references found

### settings-handlers.js
- **registerSettingsHandlers** (import) (14:1)
  - **Unused** - No references found
- **registerSettingsHandlers** (import) (9:1)
  - **Unused** - No references found
- **registerSettingsHandlers** (import) (9:1)
  - **Unused** - No references found

### logging-handlers.js
- **registerLoggingHandlers** (import) (15:1)
  - **Unused** - No references found

### conversation-handlers.js
- **setupConversationHandlers** (import) (16:1)
  - **Unused** - No references found
- **setupConversationHandlers** (import) (10:1)
  - **Unused** - No references found
- **setupConversationHandlers** (import) (10:1)
  - **Unused** - No references found

### dialog-handlers.js
- **setupDialogHandlers** (import) (17:1)
  - **Unused** - No references found
- **setupDialogHandlers** (import) (11:1)
  - **Unused** - No references found
- **setupDialogHandlers** (import) (11:1)
  - **Unused** - No references found

### import-handlers.js
- **registerImportHandlers** (import) (18:1)
  - **Unused** - No references found
- **registerImportHandlers** (import) (12:1)
  - **Unused** - No references found
- **registerImportHandlers** (import) (12:1)
  - **Unused** - No references found

### GeminiContentProcessor.js
- **GeminiContentProcessor** (import) (9:1)
  - **Unused** - No references found

### genai (imported)
- **GroundingMetadata** (import) (7:1)
  - Used in 2 location(s):
    - **parameter** (1):
      - src/utils/GeminiContentProcessor.ts:328 (GeminiContentProcessor.processGroundingResponse(groundingMetadata))
    - **return** (1):
      - test-citation-positioning.ts:8 (createTestGroundingMetadata)
- **GroundingChunk** (import) (7:1)
  - Used in 2 location(s):
    - **parameter** (2):
      - src/utils/GeminiContentProcessor.ts:23 (GeminiContentProcessor.convertGroundingChunksToWebSearchResults(chunks))
      - src/utils/GeminiContentProcessor.ts:149 (GeminiContentProcessor.addInlineCitations(chunks))
- **GroundingSupport** (import) (7:1)
  - Used in 1 location(s):
    - **parameter** (1):
      - src/utils/GeminiContentProcessor.ts:148 (GeminiContentProcessor.addInlineCitations(supports))
- **GoogleGenAI** (import) (4:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/managers/GeminiConversationManager.ts:28 (GeminiConversationManager.client)
- **Content** (import) (4:1)
  - Used in 5 location(s):
    - **property** (2):
      - src/managers/GeminiConversationManager.ts:32 (GeminiConversationManager.history)
      - src/messages/GeminiMessage.ts:12 (GeminiMessage.content)
    - **return** (2):
      - src/managers/GeminiConversationManager.ts:195 (GeminiConversationManager.getConversationHistory)
      - src/messages/GeminiMessage.ts:146 (GeminiMessage.getVendorData)
    - **parameter** (1):
      - src/messages/GeminiMessage.ts:23 (GeminiMessage.fromContent(content))
- **Chat** (import) (4:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/managers/GeminiConversationManager.ts:29 (GeminiConversationManager.chat)
- **Part** (import) (4:1)
  - Used in 1 location(s):
    - **parameter** (1):
      - src/messages/GeminiMessage.ts:29 (GeminiMessage.addPart(part))

### GeminiConversationManager.js
- **GeminiConversationManager** (import) (7:1)
  - **Unused** - No references found
- **GeminiConversationManager** (import) (7:1)
  - **Unused** - No references found

### AnthropicFileManager
- **AnthropicFileManager** (import) (7:1)
  - Used in 2 location(s):
    - **parameter** (2):
      - scripts/anthropic-files-poc.ts:12 (listAndAnalyzeFiles(fileManager))
      - scripts/anthropic-files-poc.ts:50 (uploadAndAnalyzeFile(fileManager))

### DatabaseBackupService.js
- **DatabaseBackupService** (import) (5:1)
  - **Unused** - No references found

### readline (imported)
- **readline** (import) (9:1)
  - **Unused** - No references found

### FileMigrationService.js
- **FileMigrationService** (import) (5:1)
  - **Unused** - No references found

### FileStorageService.js
- **FileStorageService** (import) (6:1)
  - Used in 2 location(s):
    - **property** (2):
      - src/services/ConversationService.ts:40 (ConversationService.fileStorageService)
      - src/services/FileMigrationService.ts:24 (FileMigrationService.fileStorageService)
- **StoredFileWithMetadata** (import) (13:1)
  - Used in 4 location(s):
    - **parameter** (4):
      - src/managers/AnthropicConversationManager.ts:580 (AnthropicConversationManager.sendMessageWithAttachments(attachments))
      - src/managers/ConversationManager.ts:75 (ConversationManager.sendMessageWithAttachments(attachments))
      - src/managers/GeminiConversationManager.ts:318 (GeminiConversationManager.sendMessageWithAttachments(attachments))
      - src/managers/OpenAIConversationManager.ts:341 (OpenAIConversationManager.sendMessageWithAttachments(attachments))

### MessageRepository.js
- **MessageRepository** (import) (8:1)
  - Used in 2 location(s):
    - **property** (2):
      - src/services/ConversationService.ts:37 (ConversationService.messageRepository)
      - src/services/FileMigrationService.ts:26 (FileMigrationService.messageRepository)

### DatabaseService.js
- **DatabaseService** (import) (6:1)
  - Used in 15 location(s):
    - **return** (1):
      - src/database/DatabaseService.ts:28 (DatabaseService.getInstance)
    - **parameter** (9):
      - src/managers/AnthropicWebImportManager.ts:531 (AnthropicWebImportManager.storeMessageFileReferences(dbService))
      - src/managers/AnthropicWebImportManager.ts:704 (AnthropicWebImportManager.storeMessageAttachments(dbService))
      - src/repositories/ConversationRepository.ts:17 (ConversationRepository.constructor(dbService))
      - src/repositories/FileAttachmentRepository.ts:13 (FileAttachmentRepository.constructor(dbService))
      - src/repositories/MessageRepository.ts:13 (MessageRepository.constructor(dbService))
      - src/repositories/ModelRepository.ts:22 (ModelRepository.constructor(dbService))
      - src/services/ConversationService.ts:43 (ConversationService.constructor(dbService))
      - src/services/FileMigrationService.ts:30 (FileMigrationService.constructor(dbService))
      - src/services/FileStorageService.ts:32 (FileStorageService.constructor(dbService))
    - **property** (4):
      - src/repositories/ConversationRepository.ts:13 (ConversationRepository.dbService)
      - src/repositories/FileAttachmentRepository.ts:11 (FileAttachmentRepository.dbService)
      - src/repositories/MessageRepository.ts:11 (MessageRepository.dbService)
      - src/repositories/ModelRepository.ts:19 (ModelRepository.dbService)
    - **variable** (1):
      - tests/conversation-flow-test.ts:21 (dbService)

### AnthropicWebImportManager.js
- **AnthropicWebImportManager** (import) (8:1)
  - **Unused** - No references found

### logger.js
- **logger** (import) (5:1)
  - **Unused** - No references found
- **createConversationLogger** (import) (5:1)
  - **Unused** - No references found

### sdk (imported)
- **Anthropic** (import) (2:1)
  - Used in 25 location(s):
    - **parameter** (8):
      - src/AnthropicProject.ts:21 (AnthropicProject.addDocument(document))
      - src/managers/AnthropicConversationManager.ts:520 (AnthropicConversationManager.createDocumentBlock(source))
      - src/managers/AnthropicConversationManager.ts:532 (AnthropicConversationManager.createUserMessage(content))
      - src/managers/AnthropicConversationManager.ts:540 (AnthropicConversationManager.renderMessageForConsole(message))
      - src/messages/AnthropicMessage.ts:23 (AnthropicMessage.fromMessageParam(messageParam))
      - src/messages/AnthropicMessage.ts:37 (AnthropicMessage.addContentBlock(block))
      - src/utils/AnthropicStopReason.ts:14 (AnthropicStopReason.constructor(stopReasonText))
      - src/utils/AnthropicStopReason.ts:48 (AnthropicStopReason.fromApiResponse(response))
    - **property** (6):
      - src/data/mockLogs.ts:8 (ApiLogEntry.vendor)
      - src/managers/AnthropicConversationManager.ts:43 (AnthropicConversationManager.client)
      - src/managers/AnthropicConversationManager.ts:44 (AnthropicConversationManager.messages)
      - src/managers/AnthropicFileManager.ts:8 (AnthropicFileManager.client)
      - src/messages/AnthropicMessage.ts:12 (AnthropicMessage.messageParam)
      - src/utils/AnthropicStopReason.ts:10 (AnthropicStopReason.stopReasonText)
    - **return** (11):
      - src/managers/AnthropicConversationManager.ts:274 (AnthropicConversationManager.getConversationHistory)
      - src/managers/AnthropicConversationManager.ts:426 (AnthropicConversationManager.createTextBlock)
      - src/managers/AnthropicConversationManager.ts:433 (AnthropicConversationManager.createImageBlockFromUrl)
      - src/managers/AnthropicConversationManager.ts:448 (AnthropicConversationManager.createImageBlockFromFile)
      - src/managers/AnthropicConversationManager.ts:469 (AnthropicConversationManager.createPlainTextSource)
      - src/managers/AnthropicConversationManager.ts:477 (AnthropicConversationManager.createPlainTextSourceFromFile)
      - src/managers/AnthropicConversationManager.ts:489 (AnthropicConversationManager.createURLPDFSource)
      - src/managers/AnthropicConversationManager.ts:499 (AnthropicConversationManager.createBase64PDFSourceFromFile)
      - src/managers/AnthropicConversationManager.ts:524 (AnthropicConversationManager.createDocumentBlock)
      - src/managers/AnthropicConversationManager.ts:532 (AnthropicConversationManager.createUserMessage)
      - src/messages/AnthropicMessage.ts:272 (AnthropicMessage.getVendorData)
- **toFile** (import) (4:1)
  - **Unused** - No references found

### AnthropicConversationManager.js
- **AnthropicConversationManager** (import) (5:1)
  - **Unused** - No references found

### Models.ts
- **Vendor** (interface) (4:1)
  - Used in 3 location(s):
    - **variable** (1):
      - src/constants.ts:9 (SUPPORTED_VENDORS)
    - **property** (1):
      - src/Models.ts:22 (Model.SUPPORTED_VENDORS)
    - **return** (1):
      - src/Models.ts:57 (Model.getVendorByName)

### crypto (imported)
- **randomUUID** (import) (6:1)
  - **Unused** - No references found

### luxon (imported)
- **DateTime** (import) (7:1)
  - **Unused** - No references found

### utils.js
- **resolveFromProjectRoot** (import) (7:1)
  - **Unused** - No references found

### settings.js
- **ApiKey** (import) (9:1)
  - Used in 2 location(s):
    - **property** (2):
      - src/components/Settings/ApiKeyList.tsx:9 (ApiKeyListProps.apiKeys)
      - src/types/settings.ts:22 (SettingsConfig.apiKeys)
- **SettingsConfig** (import) (9:1)
  - Used in 2 location(s):
    - **parameter** (1):
      - src/SettingsService.ts:41 (SettingsService.saveSettings(config))
    - **return** (1):
      - src/SettingsService.ts:123 (SettingsService.createDefaultSettings)
- **LoggingConfig** (import) (9:1)
  - Used in 3 location(s):
    - **parameter** (1):
      - src/SettingsService.ts:106 (SettingsService.setLoggingConfig(loggingConfig))
    - **return** (1):
      - src/SettingsService.ts:131 (SettingsService.getDefaultLoggingConfig)
    - **property** (1):
      - src/types/settings.ts:24 (SettingsConfig.logging)

### constants.ts
- **Vendor** (interface) (4:1)
  - Used in 3 location(s):
    - **variable** (1):
      - src/constants.ts:9 (SUPPORTED_VENDORS)
    - **property** (1):
      - src/Models.ts:22 (Model.SUPPORTED_VENDORS)
    - **return** (1):
      - src/Models.ts:57 (Model.getVendorByName)

### pino (imported)
- **pino** (import) (4:1)
  - **Unused** - No references found

### url (imported)
- **fileURLToPath** (import) (3:1)
  - **Unused** - No references found

### conversation-flow-test.ts
- **HistoryResult** (type) (26:1)
  - **Unused** - No references found
- **SendMessageResult** (type) (27:1)
  - **Unused** - No references found

### ConversationService.js
- **ConversationService** (import) (5:1)
  - Used in 1 location(s):
    - **variable** (1):
      - tests/conversation-flow-test.ts:22 (conversationService)

### Models.js
- **Model** (import) (4:1)
  - Used in 5 location(s):
    - **property** (2):
      - src/Models.ts:6 (Vendor.models)
      - src/types/conversation.ts:45 (ConversationState.selectedModel)
    - **return** (3):
      - src/Models.ts:65 (Model.getModelById)
      - src/Models.ts:73 (Model.getModelsByVendor)
      - src/Models.ts:78 (Model.getAllModels)

### conversation.js
- **Conversation** (import) (8:1)
  - Used in 3 location(s):
    - **return** (2):
      - src/repositories/ConversationRepository.ts:123 (ConversationRepository.transformToConversationSync)
      - src/repositories/ConversationRepository.ts:145 (ConversationRepository.create)
    - **property** (1):
      - src/types/conversation.ts:44 (ConversationState.currentConversation)
- **Message** (import) (7:1)
  - Used in 7 location(s):
    - **return** (3):
      - src/managers/AnthropicConversationManager.ts:279 (AnthropicConversationManager.getMessages)
      - src/managers/GeminiConversationManager.ts:200 (GeminiConversationManager.getMessages)
      - src/managers/OpenAIConversationManager.ts:209 (OpenAIConversationManager.getMessages)
    - **extends** (3):
      - src/messages/AnthropicMessage.ts:11 (AnthropicMessage)
      - src/messages/GeminiMessage.ts:11 (GeminiMessage)
      - src/messages/OpenAIMessage.ts:11 (OpenAIMessage)
    - **property** (1):
      - src/types/conversation.ts:32 (Conversation.messages)
- **createMessage** (import) (7:1)
  - **Unused** - No references found

### roles.ts
- **AnthropicRole** (type) (21:1)
  - Union Types: typeof ANTHROPIC_ROLES.USER | typeof ANTHROPIC_ROLES.ASSISTANT
  - Used in 1 location(s):
    - **parameter** (1):
      - src/messages/AnthropicMessage.ts:14 (AnthropicMessage.constructor(role))
- **OpenAIRole** (type) (22:1)
  - Union Types: typeof OPENAI_ROLES.USER | typeof OPENAI_ROLES.ASSISTANT | typeof OPENAI_ROLES.SYSTEM
  - Used in 1 location(s):
    - **parameter** (1):
      - src/messages/OpenAIMessage.ts:14 (OpenAIMessage.constructor(role))
- **GeminiRole** (type) (23:1)
  - Union Types: typeof GEMINI_ROLES.USER | typeof GEMINI_ROLES.ASSISTANT
  - Used in 1 location(s):
    - **parameter** (1):
      - src/messages/GeminiMessage.ts:14 (GeminiMessage.constructor(role))

### mockLogs.ts
- **ApiLogEntry** (interface) (4:1)
  - Used in 1 location(s):
    - **variable** (1):
      - src/data/mockLogs.ts:33 (mockApiLogs)

### better-sqlite3 (imported)
- **Database** (import) (4:1)
  - Used in 2 location(s):
    - **property** (1):
      - src/database/DatabaseService.ts:17 (DatabaseService.sqlite)
    - **return** (1):
      - src/database/DatabaseService.ts:475 (DatabaseService.getSqlite)
- **drizzle** (import) (5:1)
  - **Unused** - No references found

### migrator (imported)
- **migrate** (import) (6:1)
  - **Unused** - No references found

### schema.js
- **vendors** (import) (7:1)
  - **Unused** - No references found
- **models** (import) (7:1)
  - **Unused** - No references found
- **VendorRecord** (import) (9:1)
  - **Unused** - No references found
- **ModelRecord** (import) (7:1)
  - **Unused** - No references found
- **MessageRecord** (import) (7:1)
  - Used in 1 location(s):
    - **return** (1):
      - src/repositories/MessageRepository.ts:21 (MessageRepository.create)
- **FileAttachmentRecord** (import) (5:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/types/conversation.ts:15 (Message.fileAttachments)
- **NewConversation** (import) (7:1)
  - Used in 1 location(s):
    - **parameter** (1):
      - src/repositories/ConversationRepository.ts:145 (ConversationRepository.create(conversation))
- **NewMessage** (import) (7:1)
  - Used in 1 location(s):
    - **parameter** (1):
      - src/repositories/MessageRepository.ts:21 (MessageRepository.create(message))
- **NewFileAttachment** (import) (7:1)
  - Used in 1 location(s):
    - **parameter** (1):
      - src/repositories/FileAttachmentRepository.ts:21 (FileAttachmentRepository.create(attachment))
- **conversations** (import) (7:1)
  - **Unused** - No references found
- **messages** (import) (7:1)
  - **Unused** - No references found
- **fileAttachments** (import) (7:1)
  - **Unused** - No references found
- **ConversationRecord** (import) (7:1)
  - Used in 2 location(s):
    - **parameter** (2):
      - src/repositories/ConversationRepository.ts:101 (ConversationRepository.transformToConversation(record))
      - src/repositories/ConversationRepository.ts:123 (ConversationRepository.transformToConversationSync(record))

### drizzle-orm (imported)
- **eq** (import) (4:1)
  - **Unused** - No references found
- **and** (import) (4:1)
  - **Unused** - No references found
- **desc** (import) (4:1)
  - **Unused** - No references found
- **sql** (import) (4:1)
  - **Unused** - No references found
- **count** (import) (4:1)
  - **Unused** - No references found
- **max** (import) (4:1)
  - **Unused** - No references found
- **inArray** (import) (4:1)
  - **Unused** - No references found

### schema.ts
- **VendorRecord** (type) (73:1)
  - **Unused** - No references found
- **ModelRecord** (type) (74:1)
  - **Unused** - No references found
- **ConversationRecord** (type) (75:1)
  - Used in 2 location(s):
    - **parameter** (2):
      - src/repositories/ConversationRepository.ts:101 (ConversationRepository.transformToConversation(record))
      - src/repositories/ConversationRepository.ts:123 (ConversationRepository.transformToConversationSync(record))
- **MessageRecord** (type) (76:1)
  - Used in 1 location(s):
    - **return** (1):
      - src/repositories/MessageRepository.ts:21 (MessageRepository.create)
- **FileAttachmentRecord** (type) (77:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/types/conversation.ts:15 (Message.fileAttachments)
- **NewVendor** (type) (79:1)
  - **Unused** - No references found
- **NewModel** (type) (80:1)
  - **Unused** - No references found
- **NewConversation** (type) (81:1)
  - Used in 1 location(s):
    - **parameter** (1):
      - src/repositories/ConversationRepository.ts:145 (ConversationRepository.create(conversation))
- **NewMessage** (type) (82:1)
  - Used in 1 location(s):
    - **parameter** (1):
      - src/repositories/MessageRepository.ts:21 (MessageRepository.create(message))
- **NewFileAttachment** (type) (83:1)
  - Used in 1 location(s):
    - **parameter** (1):
      - src/repositories/FileAttachmentRepository.ts:21 (FileAttachmentRepository.create(attachment))

### sqlite-core (imported)
- **sqliteTable** (import) (4:1)
  - **Unused** - No references found
- **text** (import) (4:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/types/anthropic.ts:75 (ScrapedTextBlock.type)
- **integer** (import) (4:1)
  - **Unused** - No references found
- **real** (import) (4:1)
  - **Unused** - No references found

### clsx (imported)
- **ClassValue** (import) (1:1)
  - Used in 1 location(s):
    - **parameter** (1):
      - src/lib/utils.ts:5 (cn(inputs))
- **clsx** (import) (1:1)
  - **Unused** - No references found

### tailwind-merge (imported)
- **twMerge** (import) (2:1)
  - **Unused** - No references found

### react (imported)
- **useState** (import) (4:1)
  - **Unused** - No references found
- **useEffect** (import) (4:1)
  - **Unused** - No references found
- **useCallback** (import) (4:1)
  - **Unused** - No references found
- **React** (import) (4:1)
  - Used in 63 location(s):
    - **variable** (29):
      - src/App.tsx:18 (AppContent)
      - src/App.tsx:43 (App)
      - src/components/Chat/index.tsx:19 (Chat)
      - src/components/Home/index.tsx:6 (Home)
      - src/components/Layout/index.tsx:14 (Layout)
      - src/components/LogViewer/index.tsx:10 (LogViewer)
      - src/components/RecentChats/index.tsx:11 (RecentChats)
      - src/components/Settings/ApiKeyList.tsx:14 (ApiKeyList)
      - src/components/Settings/ApiKeyModal.tsx:30 (ApiKeyModal)
      - src/components/Settings/index.tsx:15 (Settings)
      - src/components/StarredChats/index.tsx:11 (StarredChats)
      - src/components/ui/ChatActionMenu.tsx:20 (ChatActionMenu)
      - src/components/ui/ChatSettings.tsx:22 (ChatSettings)
      - src/components/ui/CitationLozenge.tsx:16 (CitationLozenge)
      - src/components/ui/ContentRenderer.tsx:29 (ContentRenderer)
      - src/components/ui/ConversationTooltip.tsx:12 (ConversationTooltip)
      - src/components/ui/DeleteChatModal.tsx:13 (DeleteChatModal)
      - src/components/ui/DeleteMultipleChatsModal.tsx:15 (DeleteMultipleChatsModal)
      - src/components/ui/FileLozenge.tsx:38 (FileLozenge)
      - src/components/ui/ImportWebChatModal.tsx:15 (ImportWebChatModal)
      - src/components/ui/RenameChatModal.tsx:13 (RenameChatModal)
      - src/components/ui/Toast.tsx:22 (Toast)
      - src/components/ui/ToastContainer.tsx:12 (ToastContainer)
      - src/components/ui/TokenDisplay.tsx:14 (TokenDisplay)
      - src/components/ui/WebSearchDisplay.tsx:22 (WebSearchDisplay)
      - src/components/ViewChats/index.tsx:58 (ViewChats)
      - src/contexts/RecentChatsContext.tsx:20 (RecentChatsProvider)
      - src/contexts/StarredChatsContext.tsx:20 (StarredChatsProvider)
      - src/contexts/ToastContext.tsx:23 (ToastProvider)
    - **property** (4):
      - src/components/Layout/index.tsx:11 (LayoutProps.children)
      - src/components/ui/ConversationTooltip.tsx:8 (ConversationTooltipProps.children)
      - src/contexts/RecentChatsContext.tsx:17 (RecentChatsProviderProps.children)
      - src/contexts/StarredChatsContext.tsx:17 (StarredChatsProviderProps.children)
    - **parameter** (30):
      - src/components/ui/button.tsx:44 (Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}))
      - src/components/ui/card.tsx:5 (Card({ className, ...props }))
      - src/components/ui/card.tsx:18 (CardHeader({ className, ...props }))
      - src/components/ui/card.tsx:31 (CardTitle({ className, ...props }))
      - src/components/ui/card.tsx:41 (CardDescription({ className, ...props }))
      - src/components/ui/card.tsx:51 (CardAction({ className, ...props }))
      - src/components/ui/card.tsx:64 (CardContent({ className, ...props }))
      - src/components/ui/card.tsx:74 (CardFooter({ className, ...props }))
      - src/components/ui/dialog.tsx:9 (Dialog({
  ...props
}))
      - src/components/ui/dialog.tsx:15 (DialogTrigger({
  ...props
}))
      - src/components/ui/dialog.tsx:21 (DialogPortal({
  ...props
}))
      - src/components/ui/dialog.tsx:27 (DialogClose({
  ...props
}))
      - src/components/ui/dialog.tsx:34 (DialogOverlay({
  className,
  ...props
}))
      - src/components/ui/dialog.tsx:52 (DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}))
      - src/components/ui/dialog.tsx:81 (DialogHeader({ className, ...props }))
      - src/components/ui/dialog.tsx:91 (DialogFooter({ className, ...props }))
      - src/components/ui/dialog.tsx:107 (DialogTitle({
  className,
  ...props
}))
      - src/components/ui/dialog.tsx:120 (DialogDescription({
  className,
  ...props
}))
      - src/components/ui/input.tsx:5 (Input({ className, type, ...props }))
      - src/components/ui/label.tsx:11 (Label({
  className,
  ...props
}))
      - src/components/ui/select.tsx:9 (Select({
  ...props
}))
      - src/components/ui/select.tsx:15 (SelectGroup({
  ...props
}))
      - src/components/ui/select.tsx:21 (SelectValue({
  ...props
}))
      - src/components/ui/select.tsx:30 (SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}))
      - src/components/ui/select.tsx:56 (SelectContent({
  className,
  children,
  position = "popper",
  ...props
}))
      - src/components/ui/select.tsx:89 (SelectLabel({
  className,
  ...props
}))
      - src/components/ui/select.tsx:103 (SelectItem({
  className,
  children,
  ...props
}))
      - src/components/ui/select.tsx:126 (SelectSeparator({
  className,
  ...props
}))
      - src/components/ui/select.tsx:139 (SelectScrollUpButton({
  className,
  ...props
}))
      - src/components/ui/select.tsx:157 (SelectScrollDownButton({
  className,
  ...props
}))
- **createContext** (import) (4:1)
  - **Unused** - No references found
- **useContext** (import) (4:1)
  - **Unused** - No references found
- **ReactNode** (import) (4:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/contexts/ToastContext.tsx:20 (ToastProviderProps.children)
- **render** (import) (3:1)
  - **Unused** - No references found
- **KeyboardEvent** (import) (4:1)
  - **Unused** - No references found
- **useRef** (import) (4:1)
  - **Unused** - No references found
- **useMemo** (import) (4:1)
  - **Unused** - No references found

### useRecentChats.ts
- **RecentChat** (interface) (7:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/hooks/useRecentChats.ts:19 (UseRecentChatsResult.recentChats)
- **UseRecentChatsResult** (interface) (18:1)
  - **Unused** - No references found

### constants
- **RECENT_CHATS_SIDEBAR_LIMIT** (import) (5:1)
  - **Unused** - No references found
- **STARRED_CHATS_SIDEBAR_LIMIT** (import) (5:1)
  - **Unused** - No references found

### useStarredChats.ts
- **StarredChat** (interface) (7:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/hooks/useStarredChats.ts:18 (UseStarredChatsResult.starredChats)
- **UseStarredChatsResult** (interface) (17:1)
  - **Unused** - No references found

### AnthropicProject.js
- **AnthropicProject** (import) (7:1)
  - Used in 2 location(s):
    - **property** (1):
      - src/managers/AnthropicConversationManager.ts:47 (AnthropicConversationManager.project)
    - **parameter** (1):
      - src/managers/AnthropicConversationManager.ts:60 (AnthropicConversationManager.constructor(project))

### AnthropicMessage.js
- **AnthropicMessage** (import) (11:1)
  - Used in 3 location(s):
    - **parameter** (2):
      - src/managers/AnthropicConversationManager.ts:86 (AnthropicConversationManager.sendMessage(message))
      - src/managers/AnthropicConversationManager.ts:359 (AnthropicConversationManager.restoreMessage(message))
    - **return** (1):
      - src/messages/AnthropicMessage.ts:23 (AnthropicMessage.fromMessageParam)

### ConversationManager.js
- **ConversationManager** (import) (4:1)
  - Used in 4 location(s):
    - **implements** (3):
      - src/managers/AnthropicConversationManager.ts:21 (AnthropicConversationManager)
      - src/managers/GeminiConversationManager.ts:16 (GeminiConversationManager)
      - src/managers/OpenAIConversationManager.ts:16 (OpenAIConversationManager)
    - **property** (1):
      - src/services/ConversationService.ts:26 (ConversationData.manager)

### roles.js
- **ANTHROPIC_ROLES** (import) (15:1)
  - **Unused** - No references found
- **GEMINI_ROLES** (import) (9:1)
  - **Unused** - No references found
- **OPENAI_ROLES** (import) (12:1)
  - **Unused** - No references found
- **AnthropicRole** (import) (9:1)
  - Used in 1 location(s):
    - **parameter** (1):
      - src/messages/AnthropicMessage.ts:14 (AnthropicMessage.constructor(role))
- **GeminiRole** (import) (9:1)
  - Used in 1 location(s):
    - **parameter** (1):
      - src/messages/GeminiMessage.ts:14 (GeminiMessage.constructor(role))
- **OpenAIRole** (import) (9:1)
  - Used in 1 location(s):
    - **parameter** (1):
      - src/messages/OpenAIMessage.ts:14 (OpenAIMessage.constructor(role))

### AnthropicContentBlockProcessor.js
- **AnthropicContentBlockProcessor** (import) (16:1)
  - **Unused** - No references found

### AnthropicStopReason.js
- **AnthropicStopReason** (import) (17:1)
  - Used in 1 location(s):
    - **return** (1):
      - src/utils/AnthropicStopReason.ts:48 (AnthropicStopReason.fromApiResponse)

### tokens.js
- **DEFAULT_MAX_TOKENS_FALLBACK** (import) (9:1)
  - **Unused** - No references found
- **MIN_MAX_TOKENS** (import) (9:1)
  - **Unused** - No references found
- **MAX_MAX_TOKENS** (import) (9:1)
  - **Unused** - No references found
- **MAX_TOKENS_CAP_UNTIL_STREAMING** (import) (9:1)
  - **Unused** - No references found

### LoggingService.js
- **LoggingService** (import) (5:1)
  - **Unused** - No references found

### WebImportManager.js
- **WebImportManager** (import) (8:1)
  - Used in 1 location(s):
    - **implements** (1):
      - src/managers/AnthropicWebImportManager.ts:29 (AnthropicWebImportManager)
- **WebImportValidationResult** (import) (8:1)
  - **Unused** - No references found
- **WebImportConversationData** (import) (8:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/managers/WebImportManager.ts:27 (WebImportProcessResult.conversationData)
- **WebImportMessage** (import) (8:1)
  - Used in 3 location(s):
    - **return** (2):
      - src/managers/AnthropicWebImportManager.ts:272 (AnthropicWebImportManager.processMessage)
      - src/managers/WebImportManager.ts:59 (WebImportManager.processMessage)
    - **property** (1):
      - src/managers/WebImportManager.ts:28 (WebImportProcessResult.messages)
- **WebImportProcessResult** (import) (8:1)
  - **Unused** - No references found

### WebChatJSONValidator.js
- **WebChatJSONValidator** (import) (7:1)
  - **Unused** - No references found

### ConversationRepository.js
- **ConversationRepository** (import) (8:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/services/ConversationService.ts:36 (ConversationService.conversationRepository)

### FileAttachmentRepository.js
- **FileAttachmentRepository** (import) (8:1)
  - Used in 3 location(s):
    - **property** (3):
      - src/services/ConversationService.ts:38 (ConversationService.fileAttachmentRepository)
      - src/services/FileMigrationService.ts:25 (FileMigrationService.fileAttachmentRepository)
      - src/services/FileStorageService.ts:29 (FileStorageService.fileAttachmentRepository)

### anthropicGuards (imported)
- **normalizeWebToStrictContentBlocks** (import) (26:1)
  - **Unused** - No references found
- **isStrictContentBlocks** (import) (26:1)
  - **Unused** - No references found
- **isTextBlock** (import) (6:1)
  - **Unused** - No references found
- **isWebSearchToolUse** (import) (6:1)
  - **Unused** - No references found
- **isScrapedWebCitation** (import) (6:1)
  - **Unused** - No references found
- **isToolUse** (import) (6:1)
  - **Unused** - No references found
- **isToolResult** (import) (6:1)
  - **Unused** - No references found
- **isScrapedWebSearchToolResultWithArray** (import) (6:1)
  - **Unused** - No references found
- **isSdkWebSearchToolResultWithArray** (import) (6:1)
  - **Unused** - No references found

### ConversationManager.ts
- **ConversationManager** (interface) (6:1)
  - Used in 4 location(s):
    - **implements** (3):
      - src/managers/AnthropicConversationManager.ts:21 (AnthropicConversationManager)
      - src/managers/GeminiConversationManager.ts:16 (GeminiConversationManager)
      - src/managers/OpenAIConversationManager.ts:16 (OpenAIConversationManager)
    - **property** (1):
      - src/services/ConversationService.ts:26 (ConversationData.manager)

### GeminiMessage.js
- **GeminiMessage** (import) (6:1)
  - Used in 4 location(s):
    - **parameter** (1):
      - src/managers/GeminiConversationManager.ts:77 (GeminiConversationManager.sendMessage(message))
    - **return** (3):
      - src/messages/GeminiMessage.ts:23 (GeminiMessage.fromContent)
      - src/messages/GeminiMessage.ts:164 (GeminiMessage.createTextMessage)
      - src/messages/GeminiMessage.ts:168 (GeminiMessage.createImageMessage)

### openai (imported)
- **OpenAI** (import) (4:1)
  - Used in 14 location(s):
    - **property** (3):
      - src/managers/OpenAIConversationManager.ts:30 (OpenAIConversationManager.client)
      - src/managers/OpenAIConversationManager.ts:31 (OpenAIConversationManager.messages)
      - src/messages/OpenAIMessage.ts:12 (OpenAIMessage.messageParam)
    - **return** (2):
      - src/managers/OpenAIConversationManager.ts:205 (OpenAIConversationManager.getConversationHistory)
      - src/messages/OpenAIMessage.ts:168 (OpenAIMessage.getVendorData)
    - **parameter** (9):
      - src/messages/OpenAIMessage.ts:23 (OpenAIMessage.fromMessageParam(messageParam))
      - src/messages/OpenAIMessage.ts:37 (OpenAIMessage.addContentPart(part))
      - src/utils/OpenAIContentProcessor.ts:56 (OpenAIContentProcessor.findLinksToRemove(urlCitations))
      - src/utils/OpenAIContentProcessor.ts:97 (OpenAIContentProcessor.removeMatchedLinksAndAdjustCitations(urlCitations))
      - src/utils/OpenAIContentProcessor.ts:194 (OpenAIContentProcessor.processTextWithCitations(textBlock))
      - src/utils/OpenAIContentProcessor.ts:287 (OpenAIContentProcessor.generateCitationLozenge(citation))
      - src/utils/OpenAIContentProcessor.ts:504 (OpenAIContentProcessor.processContentBlocksWithWebSearch(contentBlocks))
      - src/utils/OpenAIContentProcessor.ts:535 (OpenAIContentProcessor.processContentBlocksWithEnrichedWebSearch(contentBlocks))
      - src/utils/OpenAIContentProcessor.ts:585 (OpenAIContentProcessor.processContentBlocks(contentBlocks))

### OpenAIMessage.js
- **OpenAIMessage** (import) (6:1)
  - Used in 2 location(s):
    - **parameter** (1):
      - src/managers/OpenAIConversationManager.ts:70 (OpenAIConversationManager.sendMessage(message))
    - **return** (1):
      - src/messages/OpenAIMessage.ts:23 (OpenAIMessage.fromMessageParam)

### OpenAIContentProcessor.js
- **OpenAIContentProcessor** (import) (13:1)
  - **Unused** - No references found

### WebImportManager.ts
- **WebImportValidationResult** (interface) (4:1)
  - **Unused** - No references found
- **WebImportConversationData** (interface) (9:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/managers/WebImportManager.ts:27 (WebImportProcessResult.conversationData)
- **WebImportMessage** (interface) (18:1)
  - Used in 3 location(s):
    - **return** (2):
      - src/managers/AnthropicWebImportManager.ts:272 (AnthropicWebImportManager.processMessage)
      - src/managers/WebImportManager.ts:59 (WebImportManager.processMessage)
    - **property** (1):
      - src/managers/WebImportManager.ts:28 (WebImportProcessResult.messages)
- **WebImportProcessResult** (interface) (25:1)
  - **Unused** - No references found
- **WebImportManager** (interface) (32:1)
  - Used in 1 location(s):
    - **implements** (1):
      - src/managers/AnthropicWebImportManager.ts:29 (AnthropicWebImportManager)

### Message.js
- **Message** (import) (7:1)
  - Used in 7 location(s):
    - **return** (3):
      - src/managers/AnthropicConversationManager.ts:279 (AnthropicConversationManager.getMessages)
      - src/managers/GeminiConversationManager.ts:200 (GeminiConversationManager.getMessages)
      - src/managers/OpenAIConversationManager.ts:209 (OpenAIConversationManager.getMessages)
    - **extends** (3):
      - src/messages/AnthropicMessage.ts:11 (AnthropicMessage)
      - src/messages/GeminiMessage.ts:11 (GeminiMessage)
      - src/messages/OpenAIMessage.ts:11 (OpenAIMessage)
    - **property** (1):
      - src/types/conversation.ts:32 (Conversation.messages)

### fileValidation.js
- **isFileValidForUpload** (import) (23:1)
  - **Unused** - No references found

### electron (imported)
- **ipcMain** (import) (4:1)
  - **Unused** - No references found
- **dialog** (import) (4:1)
  - **Unused** - No references found
- **contextBridge** (import) (4:1)
  - **Unused** - No references found
- **ipcRenderer** (import) (4:1)
  - **Unused** - No references found
- **webUtils** (import) (4:1)
  - **Unused** - No references found

### pdfUtils.js
- **PDFUtils** (import) (8:1)
  - **Unused** - No references found

### result.js
- **Result** (import) (6:1)
  - Used in 3 location(s):
    - **return** (2):
      - src/types/result.ts:8 (success)
      - src/types/result.ts:12 (failure)
    - **parameter** (1):
      - src/types/result.ts:16 (isSuccess(res))
- **success** (import) (6:1)
  - Used in 3 location(s):
    - **property** (2):
      - src/components/ui/Toast.tsx:9 (ToastData.type)
      - src/contexts/ToastContext.tsx:14 (ToastContextType.showBatchImportResults)
    - **return** (1):
      - src/schemas/AnthropicV1Schema.ts:94 (validateAnthropicV1)
- **failure** (import) (6:1)
  - **Unused** - No references found

### pdfUtils.ts
- **PDFMetadata** (interface) (7:1)
  - **Unused** - No references found

### SettingsService (imported)
- **SettingsService** (import) (5:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/services/ConversationService.ts:41 (ConversationService.settingsService)

### Models (imported)
- **Model** (import) (9:1)
  - Used in 5 location(s):
    - **property** (2):
      - src/Models.ts:6 (Vendor.models)
      - src/types/conversation.ts:45 (ConversationState.selectedModel)
    - **return** (3):
      - src/Models.ts:65 (Model.getModelById)
      - src/Models.ts:73 (Model.getModelsByVendor)
      - src/Models.ts:78 (Model.getAllModels)

### result (imported)
- **Result** (import) (7:1)
  - Used in 3 location(s):
    - **return** (2):
      - src/types/result.ts:8 (success)
      - src/types/result.ts:12 (failure)
    - **parameter** (1):
      - src/types/result.ts:16 (isSuccess(res))
- **success** (import) (7:1)
  - Used in 3 location(s):
    - **property** (2):
      - src/components/ui/Toast.tsx:9 (ToastData.type)
      - src/contexts/ToastContext.tsx:14 (ToastContextType.showBatchImportResults)
    - **return** (1):
      - src/schemas/AnthropicV1Schema.ts:94 (validateAnthropicV1)
- **failure** (import) (7:1)
  - **Unused** - No references found

### settings (imported)
- **ApiKey** (import) (8:1)
  - Used in 2 location(s):
    - **property** (2):
      - src/components/Settings/ApiKeyList.tsx:9 (ApiKeyListProps.apiKeys)
      - src/types/settings.ts:22 (SettingsConfig.apiKeys)
- **LoggingConfig** (import) (8:1)
  - Used in 3 location(s):
    - **parameter** (1):
      - src/SettingsService.ts:106 (SettingsService.setLoggingConfig(loggingConfig))
    - **return** (1):
      - src/SettingsService.ts:131 (SettingsService.getDefaultLoggingConfig)
    - **property** (1):
      - src/types/settings.ts:24 (SettingsConfig.logging)

### electron.js
- **ElectronAPI** (import) (5:1)
  - Used in 1 location(s):
    - **variable** (1):
      - src/preload/preload.ts:9 (electronAPI)

### AnthropicV1Schema.ts
- **AnthropicContent** (type) (84:1)
  - **Unused** - No references found
- **AnthropicMessage** (type) (85:1)
  - Used in 3 location(s):
    - **parameter** (2):
      - src/managers/AnthropicConversationManager.ts:86 (AnthropicConversationManager.sendMessage(message))
      - src/managers/AnthropicConversationManager.ts:359 (AnthropicConversationManager.restoreMessage(message))
    - **return** (1):
      - src/messages/AnthropicMessage.ts:23 (AnthropicMessage.fromMessageParam)
- **AnthropicSettings** (type) (86:1)
  - **Unused** - No references found
- **AnthropicV1Export** (type) (87:1)
  - **Unused** - No references found

### zod (imported)
- **z** (import) (6:1)
  - **Unused** - No references found

### ConversationService.ts
- **ConversationData** (interface) (25:1)
  - **Unused** - No references found

### OpenAIConversationManager.js
- **OpenAIConversationManager** (import) (6:1)
  - **Unused** - No references found

### ModelRepository.js
- **ModelRepository** (import) (11:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/services/ConversationService.ts:39 (ConversationService.modelRepository)

### SettingsService.js
- **SettingsService** (import) (19:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/services/ConversationService.ts:41 (ConversationService.settingsService)

### DatabaseBackupService.ts
- **BackupInfo** (interface) (10:1)
  - Used in 1 location(s):
    - **return** (1):
      - src/services/DatabaseBackupService.ts:96 (DatabaseBackupService.listBackups)

### FileMigrationService.ts
- **MigrationStats** (interface) (15:1)
  - Used in 2 location(s):
    - **property** (1):
      - src/services/FileMigrationService.ts:28 (FileMigrationService.stats)
    - **return** (1):
      - src/services/FileMigrationService.ts:230 (FileMigrationService.getMigrationStats)

### FileStorageService.ts
- **StoredFileResult** (interface) (11:1)
  - Used in 1 location(s):
    - **extends** (1):
      - src/services/FileStorageService.ts:16 (StoredFileWithMetadata)
- **StoredFileWithMetadata** (interface) (16:1)
  - Extends: StoredFileResult
  - Used in 4 location(s):
    - **parameter** (4):
      - src/managers/AnthropicConversationManager.ts:580 (AnthropicConversationManager.sendMessageWithAttachments(attachments))
      - src/managers/ConversationManager.ts:75 (ConversationManager.sendMessageWithAttachments(attachments))
      - src/managers/GeminiConversationManager.ts:318 (GeminiConversationManager.sendMessageWithAttachments(attachments))
      - src/managers/OpenAIConversationManager.ts:341 (OpenAIConversationManager.sendMessageWithAttachments(attachments))
- **FileStorageStats** (interface) (23:1)
  - **Unused** - No references found

### UrlEnrichmentService.ts
- **UrlEnrichmentOptions** (interface) (11:1)
  - Used in 2 location(s):
    - **parameter** (2):
      - src/services/UrlEnrichmentService.ts:32 (UrlEnrichmentService.enrichUrl(options))
      - src/services/UrlEnrichmentService.ts:121 (UrlEnrichmentService.enrichUrls(options))

### node-fetch (imported)
- **fetch** (import) (4:1)
  - **Unused** - No references found

### WebSearchDisplay.js
- **WebSearchResult** (import) (6:1)
  - Used in 5 location(s):
    - **property** (1):
      - src/components/ui/WebSearchDisplay.tsx:17 (WebSearchDisplayProps.results)
    - **return** (2):
      - src/services/UrlEnrichmentService.ts:211 (UrlEnrichmentService.createFallbackResult)
      - src/utils/OpenAIContentProcessor.ts:362 (OpenAIContentProcessor.transformWebSearchSources)
    - **parameter** (2):
      - src/utils/GeminiContentProcessor.ts:150 (GeminiContentProcessor.addInlineCitations(enrichedResults))
      - src/utils/GeminiContentProcessor.ts:284 (GeminiContentProcessor.generateWebSearchHTML(results))

### constants.js
- **STARRED_CHATS_SIDEBAR_LIMIT** (import) (10:1)
  - **Unused** - No references found
- **RECENT_CHATS_SIDEBAR_LIMIT** (import) (10:1)
  - **Unused** - No references found

### ModelRepository.ts
- **ModelMaxTokensInfo** (interface) (11:1)
  - **Unused** - No references found

### messages (imported)
- **TextCitation** (import) (4:1)
  - **Unused** - No references found
- **Message** (import) (4:1)
  - Used in 7 location(s):
    - **return** (3):
      - src/managers/AnthropicConversationManager.ts:279 (AnthropicConversationManager.getMessages)
      - src/managers/GeminiConversationManager.ts:200 (GeminiConversationManager.getMessages)
      - src/managers/OpenAIConversationManager.ts:209 (OpenAIConversationManager.getMessages)
    - **extends** (3):
      - src/messages/AnthropicMessage.ts:11 (AnthropicMessage)
      - src/messages/GeminiMessage.ts:11 (GeminiMessage)
      - src/messages/OpenAIMessage.ts:11 (OpenAIMessage)
    - **property** (1):
      - src/types/conversation.ts:32 (Conversation.messages)
- **ContentBlock** (import) (4:1)
  - **Unused** - No references found
- **ContentBlockParam** (import) (4:1)
  - **Unused** - No references found
- **TextBlock** (import) (4:1)
  - **Unused** - No references found
- **StopReason** (import) (4:1)
  - **Unused** - No references found

### UrlEnrichmentService.js
- **UrlEnrichmentService** (import) (7:1)
  - **Unused** - No references found

### OpenAIContentProcessor.ts
- **MarkdownLink** (interface) (15:1)
  - Description: Processor for handling OpenAI ResponseOutputText content blocks
and converting URLCitation annotations into inline citation lozenges
  - Used in 4 location(s):
    - **return** (2):
      - src/utils/OpenAIContentProcessor.ts:30 (OpenAIContentProcessor.parseMarkdownLinks)
      - src/utils/OpenAIContentProcessor.ts:57 (OpenAIContentProcessor.findLinksToRemove)
    - **parameter** (2):
      - src/utils/OpenAIContentProcessor.ts:55 (OpenAIContentProcessor.findLinksToRemove(markdownLinks))
      - src/utils/OpenAIContentProcessor.ts:96 (OpenAIContentProcessor.removeMatchedLinksAndAdjustCitations(linksToRemove))

### WebChatJSONValidator.ts
- **VendorDetectionResult** (interface) (8:1)
  - **Unused** - No references found

### AnthropicV1Schema.js
- **validateAnthropicV1** (import) (6:1)
  - **Unused** - No references found

### fileTypeDetector.ts
- **FileDetectionResult** (interface) (6:1)
  - Used in 1 location(s):
    - **return** (1):
      - src/utils/fileTypeDetector.ts:224 (FileTypeDetector.detectByExtension)

### mime-types (imported)
- **mimeTypes** (import) (1:1)
  - **Unused** - No references found

### file-type (imported)
- **fileTypeFromFile** (import) (2:1)
  - **Unused** - No references found

### isbinaryfile (imported)
- **isBinaryFile** (import) (3:1)
  - **Unused** - No references found

### fileValidation.ts
- **FileValidationResult** (interface) (8:1)
  - **Unused** - No references found
- **VendorLimits** (interface) (20:1)
  - Used in 2 location(s):
    - **variable** (1):
      - src/utils/fileValidation.ts:78 (DEFAULT_LIMITS)
    - **return** (1):
      - src/utils/fileValidation.ts:197 (FileValidationService.getVendorLimits)

### fileTypeDetector.js
- **FileTypeDetector** (import) (4:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/utils/fileValidation.ts:85 (FileValidationService.fileTypeDetector)

### unified (imported)
- **unified** (import) (4:1)
  - **Unused** - No references found

### remark-parse (imported)
- **remarkParse** (import) (5:1)
  - **Unused** - No references found

### remark-gfm (imported)
- **remarkGfm** (import) (6:1)
  - **Unused** - No references found

### remark-rehype (imported)
- **remarkRehype** (import) (7:1)
  - **Unused** - No references found

### rehype-raw (imported)
- **rehypeRaw** (import) (7:1)
  - **Unused** - No references found

### rehype-sanitize (imported)
- **defaultSchema** (import) (8:1)
  - **Unused** - No references found
- **rehypeSanitize** (import) (8:1)
  - **Unused** - No references found

### rehype-stringify (imported)
- **rehypeStringify** (import) (10:1)
  - **Unused** - No references found

### he (imported)
- **he** (import) (11:1)
  - **Unused** - No references found

### anthropic.ts
- **ScrapedServerToolUseBlock** (interface) (37:1)
  - **Unused** - No references found
- **ScrapedWebSearchToolResult** (interface) (45:1)
  - **Unused** - No references found
- **ScrapedWebCitationSource** (interface) (57:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/types/anthropic.ts:88 (ScrapedWebCitation.sources)
- **ScrapedWebCitationMetadata** (interface) (65:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/types/anthropic.ts:86 (ScrapedWebCitation.metadata)
- **ScrapedTextBlock** (interface) (72:1)
  - **Unused** - No references found
- **ScrapedWebCitation** (interface) (82:1)
  - **Unused** - No references found
- **WebSearchResultLike** (interface) (102:1)
  - **Unused** - No references found
- **AnthropicWebChatMessage** (interface) (117:2)
  - Description: Raw Anthropic web chat message structure from exported JSON
  - Used in 1 location(s):
    - **property** (1):
      - src/types/anthropic.ts:232 (AnthropicWebConversation.chat_messages)
- **MaybeWebTimedFields** (interface) (134:1)
  - **Unused** - No references found
- **AnthropicWebAttachment** (interface) (152:2)
  - Description: Raw attachment structure from Anthropic web export
  - Used in 1 location(s):
    - **property** (1):
      - src/types/anthropic.ts:127 (AnthropicWebChatMessage.attachments)
- **AnthropicWebFile** (interface) (163:2)
  - Description: Raw file reference from 'files' array in Anthropic web export
  - Used in 1 location(s):
    - **property** (1):
      - src/types/anthropic.ts:128 (AnthropicWebChatMessage.files)
- **AnthropicWebFileV2** (interface) (176:2)
  - Description: Raw file reference from 'files_v2' array in Anthropic web export
  - Used in 1 location(s):
    - **property** (1):
      - src/types/anthropic.ts:129 (AnthropicWebChatMessage.files_v2)
- **ProcessedFileReference** (interface) (191:2)
  - Description: Processed file reference with deduplication metadata
  - **Unused** - No references found
- **ProcessedAttachment** (interface) (210:2)
  - Description: Processed attachment with validation and safety checks
  - **Unused** - No references found
- **AnthropicWebConversation** (interface) (223:2)
  - Description: Raw Anthropic conversation structure from exported JSON
  - **Unused** - No references found
- **AnthMessage** (type) (14:1)
  - **Unused** - No references found
- **AnthContentBlock** (type) (15:1)
  - **Unused** - No references found
- **AnthContentBlockParam** (type) (18:1)
  - **Unused** - No references found
- **AnthStopReason** (type) (21:1)
  - **Unused** - No references found
- **MaybeStop** (type) (22:1)
  - Union Types: AnthStopReason | null | undefined
  - **Unused** - No references found
- **ReqOrResBlock** (type) (25:1)
  - Union Types: AnthContentBlock | AnthContentBlockParam | ScrapedServerToolUseBlock | ScrapedWebSearchToolResult
  - **Unused** - No references found
- **ResToolResult** (type) (28:1)
  - **Unused** - No references found
- **ReqToolResult** (type) (29:1)
  - **Unused** - No references found
- **AnyToolResult** (type) (30:1)
  - Union Types: ResToolResult | ReqToolResult
  - **Unused** - No references found
- **ResToolUse** (type) (32:1)
  - **Unused** - No references found
- **ReqToolUse** (type) (33:1)
  - **Unused** - No references found
- **AnyToolUse** (type) (34:1)
  - Union Types: ResToolUse | ReqToolUse
  - **Unused** - No references found
- **AnyWebSearchToolUse** (type) (52:1)
  - Union Types: (ResToolUse | ReqToolUse) | { name: "web_search"; input: { query?: string } }
  - Intersection Types: (ResToolUse & ReqToolUse) & { name: "web_search"; input: { query?: string } }
  - **Unused** - No references found
- **WebSearchToolUseAny** (type) (55:1)
  - Union Types: AnyWebSearchToolUse | ScrapedServerToolUseBlock
  - **Unused** - No references found
- **ScrapedCitation** (type) (80:1)
  - Union Types: ScrapedWebCitation
  - Used in 1 location(s):
    - **property** (1):
      - src/types/anthropic.ts:77 (ScrapedTextBlock.citations)
- **AnthropicTextishBlock** (type) (99:1)
  - Union Types: TextBlock | ScrapedTextBlock
  - **Unused** - No references found
- **AnthropicCitationish** (type) (100:1)
  - Union Types: TextCitation | ScrapedWebCitation
  - **Unused** - No references found
- **ScrapedWebSearchToolResultWithArray** (type) (108:1)
  - Intersection Types: ScrapedWebSearchToolResult & { content: WebSearchResultLike[] }
  - **Unused** - No references found
- **ISODateTimeString** (type) (132:1)
  - Used in 2 location(s):
    - **property** (2):
      - src/types/anthropic.ts:135 (MaybeWebTimedFields.start_timestamp)
      - src/types/anthropic.ts:136 (MaybeWebTimedFields.stop_timestamp)
- **AnthropicWebContentBlock** (type) (142:2)
  - Description: Content block structure from Anthropic web exports
Can be either SDK-like or scraped content
  - Union Types: ( | AnthropicTextishBlock | ScrapedServerToolUseBlock | ScrapedWebSearchToolResult | AnthContentBlock | AnthContentBlockParam ) | MaybeWebTimedFields
  - Intersection Types: ( & AnthropicTextishBlock & ScrapedServerToolUseBlock & ScrapedWebSearchToolResult & AnthContentBlock & AnthContentBlockParam ) & MaybeWebTimedFields
  - Used in 1 location(s):
    - **property** (1):
      - src/types/anthropic.ts:120 (AnthropicWebChatMessage.content)

### conversation.ts
- **Message** (interface) (7:1)
  - Used in 7 location(s):
    - **return** (3):
      - src/managers/AnthropicConversationManager.ts:279 (AnthropicConversationManager.getMessages)
      - src/managers/GeminiConversationManager.ts:200 (GeminiConversationManager.getMessages)
      - src/managers/OpenAIConversationManager.ts:209 (OpenAIConversationManager.getMessages)
    - **extends** (3):
      - src/messages/AnthropicMessage.ts:11 (AnthropicMessage)
      - src/messages/GeminiMessage.ts:11 (GeminiMessage)
      - src/messages/OpenAIMessage.ts:11 (OpenAIMessage)
    - **property** (1):
      - src/types/conversation.ts:32 (Conversation.messages)
- **Conversation** (interface) (18:1)
  - Used in 3 location(s):
    - **return** (2):
      - src/repositories/ConversationRepository.ts:123 (ConversationRepository.transformToConversationSync)
      - src/repositories/ConversationRepository.ts:145 (ConversationRepository.create)
    - **property** (1):
      - src/types/conversation.ts:44 (ConversationState.currentConversation)
- **ConversationAggregates** (interface) (35:1)
  - **Unused** - No references found
- **ConversationState** (interface) (43:1)
  - **Unused** - No references found
- **ConversationWithAggregates** (type) (41:1)
  - Intersection Types: Conversation & ConversationAggregates
  - **Unused** - No references found

### electron.ts
- **ConversationAPI** (interface) (8:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/types/electron.ts:52 (ElectronAPI.conversation)
- **ElectronAPI** (interface) (32:1)
  - Used in 1 location(s):
    - **variable** (1):
      - src/preload/preload.ts:9 (electronAPI)

### result
- **Result** (import) (7:1)
  - Used in 3 location(s):
    - **return** (2):
      - src/types/result.ts:8 (success)
      - src/types/result.ts:12 (failure)
    - **parameter** (1):
      - src/types/result.ts:16 (isSuccess(res))
- **isSuccess** (import) (7:1)
  - **Unused** - No references found

### settings
- **ApiKey** (import) (6:1)
  - Used in 2 location(s):
    - **property** (2):
      - src/components/Settings/ApiKeyList.tsx:9 (ApiKeyListProps.apiKeys)
      - src/types/settings.ts:22 (SettingsConfig.apiKeys)
- **LoggingConfig** (import) (5:1)
  - Used in 3 location(s):
    - **parameter** (1):
      - src/SettingsService.ts:106 (SettingsService.setLoggingConfig(loggingConfig))
    - **return** (1):
      - src/SettingsService.ts:131 (SettingsService.getDefaultLoggingConfig)
    - **property** (1):
      - src/types/settings.ts:24 (SettingsConfig.logging)

### conversation
- **Conversation** (import) (6:1)
  - Used in 3 location(s):
    - **return** (2):
      - src/repositories/ConversationRepository.ts:123 (ConversationRepository.transformToConversationSync)
      - src/repositories/ConversationRepository.ts:145 (ConversationRepository.create)
    - **property** (1):
      - src/types/conversation.ts:44 (ConversationState.currentConversation)
- **ConversationWithAggregates** (import) (17:1)
  - **Unused** - No references found

### result.ts
- **Result** (type) (4:1)
  - Generics: <T>
  - Union Types: { success: true; data: T } | { success: false; error: string }
  - Used in 3 location(s):
    - **return** (2):
      - src/types/result.ts:8 (success)
      - src/types/result.ts:12 (failure)
    - **parameter** (1):
      - src/types/result.ts:16 (isSuccess(res))

### settings.ts
- **ApiKey** (interface) (4:1)
  - Used in 2 location(s):
    - **property** (2):
      - src/components/Settings/ApiKeyList.tsx:9 (ApiKeyListProps.apiKeys)
      - src/types/settings.ts:22 (SettingsConfig.apiKeys)
- **LoggingConfig** (interface) (13:1)
  - Used in 3 location(s):
    - **parameter** (1):
      - src/SettingsService.ts:106 (SettingsService.setLoggingConfig(loggingConfig))
    - **return** (1):
      - src/SettingsService.ts:131 (SettingsService.getDefaultLoggingConfig)
    - **property** (1):
      - src/types/settings.ts:24 (SettingsConfig.logging)
- **SettingsConfig** (interface) (21:1)
  - Used in 2 location(s):
    - **parameter** (1):
      - src/SettingsService.ts:41 (SettingsService.saveSettings(config))
    - **return** (1):
      - src/SettingsService.ts:123 (SettingsService.createDefaultSettings)

### utilityTypes.ts
- **MaybeList** (type) (1:1)
  - Generics: <T>
  - Union Types: ReadonlyArray<T> | undefined | null
  - Used in 1 location(s):
    - **parameter** (1):
      - src/types/utilityTypes.ts:3 (asList(xs))

### react-router-dom (imported)
- **HashRouter** (import) (5:1)
  - **Unused** - No references found
- **Routes** (import) (5:1)
  - **Unused** - No references found
- **Route** (import) (5:1)
  - **Unused** - No references found
- **useParams** (import) (6:1)
  - **Unused** - No references found
- **useLocation** (import) (5:1)
  - **Unused** - No references found
- **NavLink** (import) (5:1)
  - **Unused** - No references found
- **useNavigate** (import) (6:1)
  - **Unused** - No references found

### Layout
- **Layout** (import) (6:1)
  - **Unused** - No references found

### Home
- **Home** (import) (7:1)
  - **Unused** - No references found

### Chat
- **Chat** (import) (8:1)
  - Used in 1 location(s):
    - **property** (1):
      - src/managers/GeminiConversationManager.ts:29 (GeminiConversationManager.chat)

### ViewChats
- **ViewChats** (import) (9:1)
  - **Unused** - No references found

### Settings
- **Settings** (import) (10:1)
  - **Unused** - No references found

### LogViewer
- **LogViewer** (import) (11:1)
  - **Unused** - No references found

### ToastContext
- **ToastProvider** (import) (12:1)
  - **Unused** - No references found
- **useToast** (import) (6:1)
  - **Unused** - No references found

### StarredChatsContext
- **StarredChatsProvider** (import) (13:1)
  - **Unused** - No references found
- **useStarredChatsContext** (import) (9:1)
  - **Unused** - No references found

### RecentChatsContext
- **RecentChatsProvider** (import) (14:1)
  - **Unused** - No references found
- **useRecentChatsContext** (import) (10:1)
  - **Unused** - No references found

### ToastContainer
- **ToastContainer** (import) (15:1)
  - **Unused** - No references found

### client (imported)
- **createRoot** (import) (5:1)
  - **Unused** - No references found

### App
- **App** (import) (6:1)
  - **Unused** - No references found

### RecentChatsContext.tsx
- **RecentChatsContextType** (interface) (7:1)
  - **Unused** - No references found
- **RecentChatsProviderProps** (interface) (16:1)
  - **Unused** - No references found

### useRecentChats
- **useRecentChats** (import) (5:1)
  - **Unused** - No references found

### StarredChatsContext.tsx
- **StarredChatsContextType** (interface) (7:1)
  - **Unused** - No references found
- **StarredChatsProviderProps** (interface) (16:1)
  - **Unused** - No references found

### useStarredChats
- **useStarredChats** (import) (5:1)
  - **Unused** - No references found

### ToastContext.tsx
- **ToastContextType** (interface) (7:1)
  - **Unused** - No references found
- **ToastProviderProps** (interface) (19:1)
  - **Unused** - No references found

### Toast
- **ToastData** (import) (5:1)
  - Used in 3 location(s):
    - **property** (3):
      - src/components/ui/Toast.tsx:18 (ToastProps.toast)
      - src/components/ui/ToastContainer.tsx:8 (ToastContainerProps.toasts)
      - src/contexts/ToastContext.tsx:8 (ToastContextType.toasts)
- **Toast** (import) (5:1)
  - **Unused** - No references found

### lucide-react (imported)
- **ChevronDown** (import) (5:1)
  - **Unused** - No references found
- **Check** (import) (5:1)
  - **Unused** - No references found
- **Send** (import) (5:1)
  - **Unused** - No references found
- **Loader2** (import) (5:1)
  - **Unused** - No references found
- **Plus** (import) (6:1)
  - **Unused** - No references found
- **X** (import) (5:1)
  - **Unused** - No references found
- **Home** (import) (6:1)
  - **Unused** - No references found
- **MessageCircle** (import) (6:1)
  - **Unused** - No references found
- **Folder** (import) (6:1)
  - **Unused** - No references found
- **Settings** (import) (6:1)
  - **Unused** - No references found
- **ArrowLeft** (import) (6:1)
  - **Unused** - No references found
- **Clock** (import) (6:1)
  - **Unused** - No references found
- **Eye** (import) (6:1)
  - **Unused** - No references found
- **EyeOff** (import) (6:1)
  - **Unused** - No references found
- **Star** (import) (5:1)
  - **Unused** - No references found
- **Search** (import) (5:1)
  - **Unused** - No references found
- **Edit3** (import) (5:1)
  - **Unused** - No references found
- **Trash2** (import) (5:1)
  - **Unused** - No references found
- **MoreHorizontal** (import) (5:1)
  - **Unused** - No references found
- **Upload** (import) (5:1)
  - **Unused** - No references found
- **Copy** (import) (5:1)
  - **Unused** - No references found
- **AlertCircle** (import) (5:1)
  - **Unused** - No references found
- **CheckCircle** (import) (5:1)
  - **Unused** - No references found
- **Info** (import) (5:1)
  - **Unused** - No references found
- **ChevronRight** (import) (5:1)
  - **Unused** - No references found
- **Globe** (import) (5:1)
  - **Unused** - No references found
- **XIcon** (import) (3:1)
  - **Unused** - No references found
- **CheckIcon** (import) (3:1)
  - **Unused** - No references found
- **ChevronDownIcon** (import) (3:1)
  - **Unused** - No references found
- **ChevronUpIcon** (import) (3:1)
  - **Unused** - No references found

### button
- **Button** (import) (6:1)
  - **Unused** - No references found

### select
- **Select** (import) (15:1)
  - **Unused** - No references found
- **SelectContent** (import) (15:1)
  - **Unused** - No references found
- **SelectItem** (import) (15:1)
  - **Unused** - No references found
- **SelectTrigger** (import) (15:1)
  - **Unused** - No references found
- **SelectValue** (import) (15:1)
  - **Unused** - No references found

### conversation (imported)
- **Conversation** (import) (10:1)
  - Used in 3 location(s):
    - **return** (2):
      - src/repositories/ConversationRepository.ts:123 (ConversationRepository.transformToConversationSync)
      - src/repositories/ConversationRepository.ts:145 (ConversationRepository.create)
    - **property** (1):
      - src/types/conversation.ts:44 (ConversationState.currentConversation)
- **Message** (import) (10:1)
  - Used in 7 location(s):
    - **return** (3):
      - src/managers/AnthropicConversationManager.ts:279 (AnthropicConversationManager.getMessages)
      - src/managers/GeminiConversationManager.ts:200 (GeminiConversationManager.getMessages)
      - src/managers/OpenAIConversationManager.ts:209 (OpenAIConversationManager.getMessages)
    - **extends** (3):
      - src/messages/AnthropicMessage.ts:11 (AnthropicMessage)
      - src/messages/GeminiMessage.ts:11 (GeminiMessage)
      - src/messages/OpenAIMessage.ts:11 (OpenAIMessage)
    - **property** (1):
      - src/types/conversation.ts:32 (Conversation.messages)
- **generateConversationName** (import) (10:1)
  - **Unused** - No references found
- **sanitizeMessageForDisplay** (import) (10:1)
  - **Unused** - No references found
- **sanitizeUserMessageForDisplay** (import) (10:1)
  - **Unused** - No references found

### react-markdown (imported)
- **ReactMarkdown** (import) (5:1)
  - **Unused** - No references found

### TokenDisplay
- **TokenDisplay** (import) (14:1)
  - **Unused** - No references found

### ChatSettings
- **ChatSettings** (import) (15:1)
  - **Unused** - No references found

### FileLozenge
- **FileLozenge** (import) (16:1)
  - **Unused** - No references found

### ContentRenderer
- **ContentRenderer** (import) (17:1)
  - **Unused** - No references found

### index.tsx
- **LayoutProps** (interface) (10:1)
  - **Unused** - No references found

### StarredChats
- **StarredChats** (import) (7:1)
  - **Unused** - No references found

### RecentChats
- **RecentChats** (import) (8:1)
  - **Unused** - No references found

### tabs
- **Tabs** (import) (7:1)
  - **Unused** - No references found
- **TabsContent** (import) (7:1)
  - **Unused** - No references found
- **TabsList** (import) (7:1)
  - **Unused** - No references found
- **TabsTrigger** (import) (7:1)
  - **Unused** - No references found

### ChatActionMenu
- **ChatActionMenu** (import) (8:1)
  - **Unused** - No references found

### vendorFavicons
- **getVendorFavicon** (import) (9:1)
  - **Unused** - No references found
- **getVendorName** (import) (9:1)
  - **Unused** - No references found

### ApiKeyList.tsx
- **ApiKeyListProps** (interface) (8:1)
  - **Unused** - No references found

### ApiKeyModal.tsx
- **ApiKeyModalProps** (interface) (23:1)
  - **Unused** - No references found

### dialog
- **Dialog** (import) (7:1)
  - **Unused** - No references found
- **DialogContent** (import) (7:1)
  - **Unused** - No references found
- **DialogHeader** (import) (7:1)
  - **Unused** - No references found
- **DialogTitle** (import) (7:1)
  - **Unused** - No references found

### input
- **Input** (import) (13:1)
  - **Unused** - No references found

### label
- **Label** (import) (14:1)
  - **Unused** - No references found

### ApiKeyList
- **ApiKeyList** (import) (8:1)
  - **Unused** - No references found

### ApiKeyModal
- **ApiKeyModal** (import) (9:1)
  - **Unused** - No references found

### card
- **Card** (import) (10:1)
  - **Unused** - No references found
- **CardContent** (import) (10:1)
  - **Unused** - No references found
- **CardHeader** (import) (10:1)
  - **Unused** - No references found
- **CardTitle** (import) (10:1)
  - **Unused** - No references found

### time-utils
- **formatRelativeTime** (import) (7:1)
  - **Unused** - No references found

### utils
- **useDebounce** (import) (8:1)
  - **Unused** - No references found
- **cn** (import) (4:1)
  - **Unused** - No references found

### Models
- **Model** (import) (9:1)
  - Used in 5 location(s):
    - **property** (2):
      - src/Models.ts:6 (Vendor.models)
      - src/types/conversation.ts:45 (ConversationState.selectedModel)
    - **return** (3):
      - src/Models.ts:65 (Model.getModelById)
      - src/Models.ts:73 (Model.getModelsByVendor)
      - src/Models.ts:78 (Model.getAllModels)

### RenameChatModal
- **RenameChatModal** (import) (7:1)
  - **Unused** - No references found

### DeleteChatModal
- **DeleteChatModal** (import) (8:1)
  - **Unused** - No references found

### DeleteMultipleChatsModal
- **DeleteMultipleChatsModal** (import) (12:1)
  - **Unused** - No references found

### ImportWebChatModal
- **ImportWebChatModal** (import) (13:1)
  - **Unused** - No references found

### ConversationTooltip
- **ConversationTooltip** (import) (14:1)
  - **Unused** - No references found

### ChatActionMenu.tsx
- **ChatActionMenuProps** (interface) (11:1)
  - **Unused** - No references found

### ChatSettings.tsx
- **ChatSettingsProps** (interface) (13:1)
  - **Unused** - No references found

### CitationLozenge.tsx
- **CitationLozengeProps** (interface) (6:1)
  - **Unused** - No references found

### ContentRenderer.tsx
- **ContentRendererProps** (interface) (12:1)
  - **Unused** - No references found
- **WebSearchData** (interface) (17:1)
  - **Unused** - No references found

### WebSearchDisplay
- **WebSearchDisplay** (import) (9:1)
  - **Unused** - No references found

### CitationLozenge
- **CitationLozenge** (import) (10:1)
  - **Unused** - No references found

### ConversationTooltip.tsx
- **ConversationTooltipProps** (interface) (6:1)
  - **Unused** - No references found

### DeleteChatModal.tsx
- **DeleteChatModalProps** (interface) (6:1)
  - **Unused** - No references found

### DeleteMultipleChatsModal.tsx
- **DeleteMultipleChatsModalProps** (interface) (7:1)
  - **Unused** - No references found

### FileLozenge.tsx
- **FileLozengeProps** (interface) (8:1)
  - **Unused** - No references found

### ImportWebChatModal.tsx
- **ImportWebChatModalProps** (interface) (8:1)
  - **Unused** - No references found

### RenameChatModal.tsx
- **RenameChatModalProps** (interface) (6:1)
  - **Unused** - No references found

### Toast.tsx
- **ToastData** (interface) (7:1)
  - Used in 3 location(s):
    - **property** (3):
      - src/components/ui/Toast.tsx:18 (ToastProps.toast)
      - src/components/ui/ToastContainer.tsx:8 (ToastContainerProps.toasts)
      - src/contexts/ToastContext.tsx:8 (ToastContextType.toasts)
- **ToastProps** (interface) (17:1)
  - **Unused** - No references found

### ToastContainer.tsx
- **ToastContainerProps** (interface) (7:1)
  - **Unused** - No references found

### TokenDisplay.tsx
- **TokenDisplayProps** (interface) (6:1)
  - **Unused** - No references found

### WebSearchDisplay.tsx
- **WebSearchResult** (interface) (7:1)
  - Used in 5 location(s):
    - **property** (1):
      - src/components/ui/WebSearchDisplay.tsx:17 (WebSearchDisplayProps.results)
    - **return** (2):
      - src/services/UrlEnrichmentService.ts:211 (UrlEnrichmentService.createFallbackResult)
      - src/utils/OpenAIContentProcessor.ts:362 (OpenAIContentProcessor.transformWebSearchSources)
    - **parameter** (2):
      - src/utils/GeminiContentProcessor.ts:150 (GeminiContentProcessor.addInlineCitations(enrichedResults))
      - src/utils/GeminiContentProcessor.ts:284 (GeminiContentProcessor.generateWebSearchHTML(results))
- **WebSearchDisplayProps** (interface) (15:1)
  - **Unused** - No references found

### react-slot (imported)
- **Slot** (import) (2:1)
  - **Unused** - No references found

### class-variance-authority (imported)
- **cva** (import) (3:1)
  - **Unused** - No references found
- **VariantProps** (import) (3:1)
  - **Unused** - No references found

## Classes

### src/AnthropicProject.ts
- **AnthropicProject** (7:1)
  - Constructors: 1
  - Methods:
    - **addDocument**(document: ImageBlockParam): void
    - **addDocuments**(documents: ImageBlockParam[]): void
    - **removeDocument**(index: number): void
    - **clearDocuments**(): void
    - **getDocuments**(): ImageBlockParam>
    - **getDocumentCount**(): number
    - **addTextDocument**(content: string): void
    - **addTextDocumentFromFile**(filePath: string): void
    - **addPDFDocument**(url: string): void
    - **addPDFDocumentFromFile**(filePath: string): void
    - **addImageDocument**(url: string): void
    - **addImageDocumentFromFile**(filePath: string, mediaType: webp"): void
  - Properties: _systemPrompt: string (private), _documents: ImageBlockParam> (private), _projectName: string (private), _createdAt: Date (private)

### src/Models.ts
- **Model** (9:1)
  - Constructors: 1
  - Methods:
    - **getVendorByName** (static)(name: string): Vendor | undefined
    - **getAllVendorNames** (static)(): string[]
    - **getModelById** (static)(id: string): Model | undefined
    - **getModelsByVendor** (static)(vendorName: string): Model[]
    - **getAllModels** (static)(): Model[]
    - **getVendorForModel** (static)(modelId: string): string
  - Properties: id: string, friendlyName: string, description: string, tier: string, SUPPORTED_VENDORS: Vendor[] (static) (private)

### src/SettingsService.ts
- **SettingsService** (11:1)
  - Constructors: 1
  - Methods:
    - **loadSettings**(): Promise<SettingsConfig>
    - **saveSettings**(config: SettingsConfig): Promise<void>
    - **addApiKey**(apiKey: __type): Promise<ApiKey>
    - **removeApiKey**(id: string): Promise<void>
    - **getApiKeys**(): Promise<ApiKey[]>
    - **getApiKeyById**(id: string): Promise<ApiKey | undefined>
    - **getShowTurnCounter**(): Promise<boolean>
    - **setShowTurnCounter**(show: false | true): Promise<void>
    - **getLoggingConfig**(): Promise<LoggingConfig>
    - **setLoggingConfig**(loggingConfig: LoggingConfig): Promise<void>
    - **getApiLoggingEnabled**(): Promise<boolean>
    - **setApiLoggingEnabled**(enabled: false | true): Promise<void>
    - **createDefaultSettings** (private)(): SettingsConfig
    - **getDefaultLoggingConfig** (private)(): LoggingConfig
    - **generateKeyPreview** (private)(key: string): string
  - Properties: settingsPath: string (private)

### src/database/DatabaseService.ts
- **DatabaseService** (14:1)
  - Constructors: 1
  - Methods:
    - **getInstance** (static)(type: string, name: string): DatabaseService
    - **initialize**(): void
    - **closeInstance** (static)(type: string, name: string): void
    - **closeAllInstances** (static)(): void
    - **initializeDatabase** (private)(): void
    - **addMissingColumns** (private)(): void
    - **seedReferenceData** (private)(): void
    - **getDb**()
    - **getSqlite**(): Database
    - **close**(): void
  - Properties: instances: Map<string, DatabaseService> (static) (private), db: ReturnType<typeof drizzle> (private), sqlite: Database (private), initialized: boolean (private), type: string (private), name: string (private)

### src/managers/AnthropicConversationManager.ts
- **AnthropicConversationManager** (21:1)
  - Implements: ConversationManager
  - Constructors: 1
  - Methods:
    - **sendMessage**(message: AnthropicMessage): Promise<string>
    - **getConversationHistory**(): MessageParam[]
    - **getMessages**(): Message[]
    - **clearConversation**(): void
    - **getTokenUsage**(): { inputTokens: number; outputTokens: number; totalTokens: number }
    - **getLastMessageTokens**(): { inputTokens: number; outputTokens: number; totalTokens: number }
    - **getMaxTokens**(): number
    - **setMaxTokens**(maxTokens: number): void
    - **getVendorData**(): Record<string, any>
    - **setVendorData**(data: __type): void
    - **restoreMessage**(message: AnthropicMessage): Promise<void>
    - **restoreFromDatabase**(messagesWithAttachments: { id: string; conversation_id: string; created_at: string; updated_at: string; vendor_data: Record<string, any>; vendor_message_id: string; vendor_parent_uuid: string; role: string; content: string; sequence: number; input_tokens: number; output_tokens: number; total_tokens: number; } & { fileAttachments: { id: string; created_at: string; updated_at: string; message_id: string; file_name: string; file_path: string; file_size: number; line_count: number; page_count: number; file_extension: string; }[]; }[]): Promise<void>
    - **createTextBlock** (static)(text: string): TextBlockParam
    - **createImageBlockFromUrl** (static)(url: string): ImageBlockParam
    - **createImageBlockFromFile** (static)(filePath: string, mediaType: webp"): ImageBlockParam
    - **createPlainTextSource** (static)(text: string): PlainTextSource
    - **createPlainTextSourceFromFile** (static)(filePath: string): PlainTextSource
    - **createURLPDFSource** (static)(url: string): URLPDFSource
    - **createBase64PDFSourceFromFile** (static)(filePath: string): Base64PDFSource
    - **createDocumentBlock** (static)(source: ContentBlockSource): DocumentBlockParam
    - **createUserMessage** (static)(content: ContentBlockParam[]): MessageParam
    - **renderMessageForConsole** (static)(message: MessageParam): string
    - **getUserConstant**(): string
    - **getUserRole**(): USER
    - **getAssistantRole**(): ASSISTANT
    - **sendMessageWithAttachments**(messageText: string, attachments: StoredFileWithMetadata[]): Promise<string>
  - Properties: MODELS (static), DEFAULT_MODEL (static), ROLES (static), WEB_SEARCH_TOOL_VERSION (static), WEB_SEARCH_MAX_USES (static), client: Anthropic (private), messages: MessageParam[] (private), model: string (private), maxTokens: number (private), project: AnthropicProject (private), logger: ReturnType<typeof createConversationLogger> (private), tokenUsage (private), lastMessageTokens (private)

### src/managers/AnthropicFileManager.ts
- **AnthropicFileManager** (7:1)
  - Constructors: 1
  - Methods:
    - **upload**(filePath: string): Promise<any>
    - **listFiles**(): Promise<any>
    - **getFileMetadata**(fileId: string): Promise<any>
    - **downloadFile**(fileId: string): Promise<any>
  - Properties: client: Anthropic (private)

### src/managers/AnthropicWebImportManager.ts
- **AnthropicWebImportManager** (29:1)
  - Implements: WebImportManager
  - Methods:
    - **validateFile**(filePath: string): Promise<WebImportValidationResult>
    - **getConversationData**(filePath: string): Promise<WebImportConversationData>
    - **getMessages**(filePath: string): Promise<WebImportMessage[]>
    - **processFiles** (private)(files: AnthropicWebFile[], filesV2: AnthropicWebFileV2[]): ProcessedFileReference[]
    - **processMessage**(messageJson: AnthropicWebChatMessage): WebImportMessage
    - **constructClaudeAIUrl** (private)(fileUrl: string): string
    - **downloadFileFromClaudeAI** (private)(fileUrl: string, fileName: string): Promise<string | null>
    - **processAttachments** (private)(attachments: AnthropicWebAttachment[]): ProcessedAttachment[]
    - **storeMessageFileReferences** (private)(messageId: string, files: ProcessedFileReference[], messageCreatedAt: string, dbService: DatabaseService): Promise<void>
    - **storeMessageAttachments** (private)(messageId: string, attachments: ProcessedAttachment[], messageCreatedAt: string, dbService: DatabaseService): Promise<void>
    - **writeContentToTempFile** (private)(content: string, fileName: string): Promise<string>
    - **processImport**(filePath: string): Promise<WebImportProcessResult>
    - **getVendorName**(): string
    - **getDefaultModelName**(): string
  - Properties: DEFAULT_MODEL_NAME (static) (private), CLAUDE_AI_BASE_URL (static) (private)

### src/managers/GeminiConversationManager.ts
- **GeminiConversationManager** (16:1)
  - Implements: ConversationManager
  - Constructors: 1
  - Methods:
    - **sendMessage**(message: GeminiMessage): Promise<string>
    - **getConversationHistory**(): Content[]
    - **getMessages**(): Message[]
    - **getVendorData**(): Record<string, any>
    - **setVendorData**(data: __type): void
    - **clearConversation**(): void
    - **getTokenUsage**(): { inputTokens: number; outputTokens: number; totalTokens: number }
    - **getLastMessageTokens**(): { inputTokens: number; outputTokens: number; totalTokens: number }
    - **getModel**(): string
    - **getMaxTokens**(): number
    - **setMaxTokens**(maxTokens: number): void
    - **getUserConstant**(): string
    - **getUserRole**(): USER
    - **getAssistantRole**(): ASSISTANT
    - **sendMessageWithAttachments**(messageText: string, attachments: StoredFileWithMetadata[]): Promise<string>
  - Properties: MODELS (static), DEFAULT_MODEL (static), ROLES (static), client: GoogleGenAI (private), chat: Chat (private), modelId: string (private), maxTokens: number (private), history: Content[] (private), logger: ReturnType<typeof createConversationLogger> (private), tokenUsage (private), lastMessageTokens (private)

### src/managers/OpenAIConversationManager.ts
- **OpenAIConversationManager** (16:1)
  - Implements: ConversationManager
  - Constructors: 1
  - Methods:
    - **sendMessage**(message: OpenAIMessage): Promise<string>
    - **getConversationHistory**(): ResponseInputItem[]
    - **getMessages**(): Message[]
    - **getVendorData**(): Record<string, any>
    - **setVendorData**(data: __type): void
    - **clearConversation**(): void
    - **getTokenUsage**(): { inputTokens: number; outputTokens: number; totalTokens: number }
    - **getLastMessageTokens**(): { inputTokens: number; outputTokens: number; totalTokens: number }
    - **setMaxTokens**(maxTokens: number): void
    - **getMaxTokens**(): number
    - **getModel**(): string
    - **getUserConstant**(): string
    - **getUserRole**(): USER
    - **getAssistantRole**(): ASSISTANT
    - **getSystemRole**(): SYSTEM
    - **sendMessageWithAttachments**(messageText: string, attachments: StoredFileWithMetadata[]): Promise<string>
  - Properties: MODELS (static), DEFAULT_MODEL (static), ROLES (static), client: OpenAI (private), messages: ResponseInputItem[] (private), model: string (private), maxTokens: number (private), logger: ReturnType<typeof createConversationLogger> (private), tokenUsage (private), lastMessageTokens (private)

### src/messages/AnthropicMessage.ts
- **AnthropicMessage** (11:1)
  - Extends: Message<Anthropic.Messages.MessageParam>
  - Constructors: 1
  - Methods:
    - **fromMessageParam** (static)(messageParam: MessageParam): AnthropicMessage
    - **ensureContentArray** (private)(): void
    - **addContentBlock** (private)(block: WebSearchToolResultBlockParam): this
    - **addTextContent**(text: string): this
    - **addImageFromURL**(url: string): this
    - **addImageFromBase64**(filePath: string, mediaType: webp"): this
    - **addImageFromFilePath**(filePath: string): Promise<this>
    - **addPDFFromFilePath**(filePath: string): Promise<this>
    - **addDocumentFromText**(text: string, options: __type?): this
    - **addDocumentFromFilePath**(filePath: string, options: __type?): Promise<this>
    - **addDocumentFromPDFURL**(url: string, options: __type?): this
    - **addDocumentFromPDFFile**(filePath: string, options: __type?): this
    - **addDocumentFromContent**(content: ImageBlockParam)[], options: __type?): this
    - **addFileAttachmentFromPath**(filePath: string): Promise<this>
    - **getRole**(): string
    - **getVendorData**(): MessageParam
    - **getAsHTML**(): string
    - **serialize**(): string
  - Properties: messageParam: MessageParam (private)

### src/messages/GeminiMessage.ts
- **GeminiMessage** (11:1)
  - Extends: Message<Content>
  - Constructors: 1
  - Methods:
    - **fromContent** (static)(content: Content): GeminiMessage
    - **addPart** (private)(part: Part): this
    - **addTextContent**(text: string): this
    - **addImageFromBase64**(filePath: string, mediaType: webp"): this
    - **addImageFromBase64Data**(base64Data: string, mediaType: string): this
    - **addImageFromFilePath**(filePath: string): Promise<this>
    - **addPDFFromFilePath**(filePath: string): Promise<this>
    - **addDocumentFromFilePath**(filePath: string): Promise<this>
    - **getRole**(): string
    - **getVendorData**(): Content
    - **getAsHTML**(): string
    - **createTextMessage** (static)(text: string): GeminiMessage
    - **createImageMessage** (static)(text: string, imageData: string, mimeType: string): GeminiMessage
    - **serialize**(): string
  - Properties: content: Content (private)

### src/messages/Message.ts
- **Message** (4:1)
  - Generics: <T = any>
  - Methods:
    - **getId**(): string
    - **getTimestamp**(): Date
    - **addTextContent** (abstract)(text: string): this
    - **getRole** (abstract)(): string
    - **getVendorData** (abstract)(): T
    - **getAsHTML** (abstract)(): string
    - **serialize** (abstract)(): string
  - Properties: id: string (protected), timestamp: Date (protected)

### src/messages/OpenAIMessage.ts
- **OpenAIMessage** (11:1)
  - Extends: Message<OpenAI.Responses.EasyInputMessage>
  - Constructors: 1
  - Methods:
    - **fromMessageParam** (static)(messageParam: EasyInputMessage): OpenAIMessage
    - **ensureContentArray** (private)(): void
    - **addContentPart** (private)(part: ResponseInputAudio): this
    - **addTextContent**(text: string): this
    - **addImageFromURL**(url: string): this
    - **addImageFromBase64**(filePath: string, mediaType: webp"): this
    - **addImageFromFilePath**(filePath: string): Promise<this>
    - **addPDFFromFilePath**(filePath: string): Promise<this>
    - **addPDFFromURL**(url: string): this
    - **addDocumentFromFilePath**(filePath: string): Promise<this>
    - **getRole**(): string
    - **getVendorData**(): EasyInputMessage
    - **serialize**(): string
  - Properties: messageParam: EasyInputMessage (private)

### src/ipc/pdfUtils.ts
- **PDFUtils** (15:1)
  - Methods:
    - **extractMetadata** (static)(filePath: string): Promise<PDFMetadata>
    - **isPDFFile** (static)(filePath: string): boolean
    - **formatFileSize** (static)(bytes: number): string
    - **generateThumbnail** (static)(filePath: string): Promise<string>

### src/services/ConversationService.ts
- **ConversationService** (33:1)
  - Constructors: 1
  - Methods:
    - **createManager** (private)(vendor: string, modelId: string): Promise<ConversationManager>
    - **getVendorAndModelIds** (private)(modelName: string): Promise<{ vendorId: string; modelId: string }>
    - **createConversation**(modelName: string, conversationName: string?): Promise<Conversation>
    - **sendMessage**(conversationId: string, messageText: string, filePaths: string[]?): Promise<{
    success: boolean;
    response?: string;
    error?: string;
    fileResults?: {
      validFiles: string[];
      invalidFiles: Array<{ path: string; name: string; error: string }>;
    };
  }>
    - **validateAndStoreFiles** (private)(filePaths: string[], conversationId: string, vendorName: string): Promise<{
    validFiles: string[];
    invalidFiles: Array<{ path: string; name: string; error: string }>;
    storedFiles: StoredFileWithMetadata[];
  }>
    - **getOrLoadConversationData** (private)(conversationId: string): Promise<{
    success: boolean;
    conversationData?: ConversationData;
    error?: string
  }>
    - **loadConversationFromDatabase** (private)(conversationId: string): Promise<{ success: boolean; error?: string }>
    - **getHistory**(conversationId: string): Promise<{ success: boolean; history?: any[]; error?: string }>
    - **clearConversation**(conversationId: string): Promise<{ success: boolean; error?: string }>
    - **deleteConversation**(conversationId: string): Promise<{ success: boolean; error?: string }>
    - **deleteMultipleConversations**(conversationIds: string[]): Promise<{ success: boolean; error?: string; deletedCount?: number }>
    - **updateConversationName**(conversationId: string, name: string): Promise<{ success: boolean; error?: string }>
    - **getConversations**(limit: number?, offset: number?): Promise<{ success: boolean; conversations?: any[]; total?: number; error?: string }>
    - **toggleStarConversation**(conversationId: string): Promise<{ success: boolean; isStarred?: boolean; error?: string }>
    - **getConversationTokens**(conversationId: string): Promise<{ success: boolean; tokens?: { inputTokens: number; outputTokens: number; totalTokens: number }; error?: string }>
    - **getConversationById**(conversationId: string): Promise<Conversation>
    - **getStarredConversations**(limit: number?): Promise<{ success: boolean; conversations?: any[]; error?: string }>
    - **getRecentConversations**(limit: number?): Promise<{ success: boolean; conversations?: any[]; error?: string }>
  - Properties: conversations (private), db: ReturnType<typeof drizzle> (private), conversationRepository: ConversationRepository (private), messageRepository: MessageRepository (private), fileAttachmentRepository: FileAttachmentRepository (private), modelRepository: ModelRepository (private), fileStorageService: FileStorageService (private), settingsService: SettingsService (private)

### src/services/DatabaseBackupService.ts
- **DatabaseBackupService** (17:1)
  - Constructors: 1
  - Methods:
    - **createBackup**(dbType: string, dbName: string): Promise<BackupInfo>
    - **listBackups**(dbType: string?, dbName: string?): BackupInfo[]
    - **restoreBackup**(backupFilename: string, dbType: string, dbName: string): Promise<boolean>
    - **deleteOldBackups**(keepCount: number, dbType: string?, dbName: string?): Promise<number>
    - **getBackupsDirectory**(): string
  - Properties: backupsDir: string (private)

### src/services/FileMigrationService.ts
- **FileMigrationService** (23:1)
  - Constructors: 1
  - Methods:
    - **scanUnmigratedFiles**()
    - **migrateFile**(attachmentRecord: any): Promise<boolean>
    - **runMigration**(): Promise<MigrationStats>
    - **getMigrationStats**(): MigrationStats
    - **resetStats**(): void
  - Properties: fileStorageService: FileStorageService (private), fileAttachmentRepository: FileAttachmentRepository (private), messageRepository: MessageRepository (private), db: ReturnType<typeof drizzle> (private), stats: MigrationStats (private)

### src/services/FileStorageService.ts
- **FileStorageService** (28:1)
  - Constructors: 1
  - Methods:
    - **getDestinationPath**(messageId: string, messageCreatedAt: string | Date, fileName: string): string
    - **storeFile**(sourceFilePath: string, messageId: string, messageCreatedAt: string | Date): Promise<StoredFileResult>
    - **findUniqueFileName** (private)(targetDir: string, fileName: string): string
    - **deleteFile**(filePath: string): Promise<boolean>
    - **deleteMessageFiles**(messageId: string): Promise<FileStorageStats>
    - **deleteConversationFiles**(conversationId: string): Promise<FileStorageStats>
    - **isManagedPath**(filePath: string): boolean
    - **cleanupOrphanedFiles**(): Promise<FileStorageStats>
    - **scanForOrphanedFiles** (private)(dirPath: string, dbFilePaths: Set<string>): string[]
  - Properties: fileAttachmentRepository: FileAttachmentRepository (private), attachmentsRoot: string (private)

### src/services/LoggingService.ts
- **LoggingService** (23:1)
  - Methods:
    - **logApiRequest** (static)(vendor: string, model: string, request: any, conversationId: string?): void
    - **logApiResponse** (static)(vendor: string, model: string, response: any, conversationId: string?, tokens: __type?, duration: number?): void
    - **getLogFilePath** (static)(logKey: string): string
    - **getLogContent** (static)(logKey: string): Promise<string>
    - **getLogStats** (static)(logKey: string): Promise<{ entryCount: number; fileSize: number }>
    - **isBase64** (static)(str: string): boolean
    - **abbreviateBase64Fields** (static)(obj: any): any
    - **getAvailableLogKeys** (static)(): string[]
  - Properties: LOG_FILE_MAP: Record<string, string> (static) (private)

### src/services/UrlEnrichmentService.ts
- **UrlEnrichmentService** (20:1)
  - Description: URL enrichment service that converts bare URLs to WebSearchResult format
with page titles and favicons extracted from the actual web pages
  - Methods:
    - **enrichUrl** (static)(url: string, options: UrlEnrichmentOptions): Promise<WebSearchResult>
    - **enrichUrls** (static)(urls: string[], options: UrlEnrichmentOptions): Promise<WebSearchResult[]>
    - **extractTitle** (static) (private)($: CheerioAPI, domain: string): string
    - **extractFaviconUrl** (static) (private)($: CheerioAPI, urlObj: URL): string
    - **createFallbackResult** (static) (private)(url: string, domain: string): WebSearchResult
    - **extractDomainSafely** (static) (private)(url: string): string
  - Properties: DEFAULT_TIMEOUT (static) (private), DEFAULT_USER_AGENT (static) (private)

### src/repositories/ConversationRepository.ts
- **ConversationRepository** (12:1)
  - Constructors: 1
  - Methods:
    - **getDb** (private)()
    - **preloadVendorCache** (private)(): void
    - **preloadModelCache** (private)(): void
    - **getVendorNameByIdSync** (private)(vendorId: string): string
    - **getModelNameByIdSync** (private)(modelId: string): string
    - **getVendorNameById** (private)(vendorId: string): Promise<string>
    - **getModelNameById** (private)(modelId: string): Promise<string>
    - **transformToConversation** (private)(record: __type): Promise<Conversation>
    - **transformToConversationSync** (private)(record: __type): Conversation
    - **create**(conversation: __type): Conversation
    - **findById**(id: string): Promise<Conversation | null>
    - **findAll**(limit: number?, offset: number?): Promise<Conversation[]>
    - **findByVendorAndModel**(vendorId: string, modelId: string): Promise<Conversation[]>
    - **findByVendorConversationId**(vendorId: string, vendorConversationId: string): Promise<Conversation | null>
    - **conversationToDbUpdates** (private)(updates: __type): Partial<ConversationRecord>
    - **update**(id: string, updates: __type): Promise<Conversation | null>
    - **delete**(id: string): Promise<boolean>
    - **getCount**(): Promise<number>
    - **findStarred**(limit: number): Promise<Conversation[]>
    - **findRecent**(limit: number): Promise<Conversation[]>
  - Properties: dbService: DatabaseService (private), vendorCache (private), modelCache (private)

### src/repositories/FileAttachmentRepository.ts
- **FileAttachmentRepository** (10:1)
  - Constructors: 1
  - Methods:
    - **getDb** (private)()
    - **create**(attachment: __type): Promise<FileAttachmentRecord>
    - **findById**(id: string): Promise<FileAttachmentRecord | null>
    - **findByMessageId**(messageId: string): Promise<FileAttachmentRecord[]>
    - **deleteById**(id: string): Promise<void>
    - **deleteByMessageId**(messageId: string): Promise<void>
    - **deleteByConversationId**(conversationId: string): Promise<number>
    - **findAll**(): Promise<FileAttachmentRecord[]>
    - **findByConversationId**(conversationId: string): Promise<FileAttachmentRecord[]>
    - **count**(): Promise<number>
  - Properties: dbService: DatabaseService (private)

### src/repositories/MessageRepository.ts
- **MessageRepository** (10:1)
  - Constructors: 1
  - Methods:
    - **getDb** (private)()
    - **create**(message: __type): MessageRecord
    - **findById**(id: string): Promise<MessageRecord | null>
    - **findByConversationId**(conversationId: string): Promise<MessageRecord[]>
    - **getNextSequenceNumber**(conversationId: string): Promise<number>
    - **update**(id: string, updates: __type): Promise<MessageRecord | null>
    - **delete**(id: string): Promise<boolean>
    - **deleteByConversationId**(conversationId: string): Promise<number>
    - **getLatestMessage**(conversationId: string): Promise<MessageRecord | null>
    - **getMessageCount**(conversationId: string): Promise<number>
    - **findByConversationIdWithAttachments**(conversationId: string): Promise<Array<MessageRecord & { fileAttachments: FileAttachmentRecord[] }>>
  - Properties: dbService: DatabaseService (private)

### src/repositories/ModelRepository.ts
- **ModelRepository** (18:1)
  - Constructors: 1
  - Methods:
    - **getDb** (private)()
    - **getMaxTokensForModel**(modelName: string): Promise<ModelMaxTokensInfo>
    - **getAllModelsWithMaxTokens**(): Promise<ModelMaxTokensInfo[]>
    - **clearCache**(): void
    - **getCacheStats**(): { size: number; keys: string[] }
  - Properties: dbService: DatabaseService (private), maxTokensCache (private)

### src/utils/AnthropicContentBlockProcessor.ts
- **AnthropicContentBlockProcessor** (14:1)
  - Description: Processor for handling different types of Anthropic content blocks
during the import process. Extracts meaningful content from each
block type and provides descriptive placeholders for non-text blocks.
  - Methods:
    - **processResponseBlocks** (static)(blocks: AnthContentBlock[], stopReason: MaybeStop?): string
    - **processRequestBlocks** (static)(blocks: AnthContentBlockParam[], stopReason: MaybeStop?): string
    - **isValidWebSearchResult** (static)(result: WebSearchResultLike): boolean
    - **processTextBlock** (static)(block: AnthropicTextishBlock): string
    - **processToolUseBlock** (static)(block: AnyToolUse): string
    - **processUnknownBlock** (static)(block: ReqOrResBlock): string
    - **processContentBlock** (static)(block: ScrapedTextBlock): string
    - **processWebSearchBlock** (static)(toolUseBlock: ScrapedServerToolUseBlock, contentBlocks: ReqOrResBlock[], startIndex: number): { html: string; nextIndex: number }
    - **generateWebSearchHtml** (static)(query: string, results: any[], resultCount: number): string
    - **processTextWithCitations** (static)(text: string, citations: AnthropicCitationish[]): string
    - **generateCitationLozenge** (static)(citation: any, index: number): string
    - **_processAllContentBlocks** (static)(contentBlocks: ReqOrResBlock[], stopReason: MaybeStop?): string

### src/utils/AnthropicStopReason.ts
- **AnthropicStopReason** (9:1)
  - Description: Represents an Anthropic API response stop reason with associated warning information
  - Constructors: 1
  - Methods:
    - **fromApiResponse** (static)(response: Message): AnthropicStopReason
    - **isNormalCompletion**(): boolean
    - **getFormattedWarning**(): string
  - Properties: stopReasonText: StopReason, warningMessage: string, isAbnormalHalt: boolean

### src/utils/GeminiContentProcessor.ts
- **GeminiContentProcessor** (15:1)
  - Description: Processor for handling Gemini grounding metadata and converting
it into web search displays and inline citations
  - Methods:
    - **convertGroundingChunksToWebSearchResults** (static)(chunks: GroundingChunk[]): Promise<WebSearchResult[]>
    - **addInlineCitations** (static)(text: string, supports: GroundingSupport[], chunks: GroundingChunk[], enrichedResults: WebSearchResult[]?): string
    - **generateWebSearchHTML** (static)(queries: string[], results: WebSearchResult[], resultCount: number): string
    - **processGroundingResponse** (static)(text: string, groundingMetadata: GroundingMetadata?): Promise<string>

### src/utils/OpenAIContentProcessor.ts
- **OpenAIContentProcessor** (23:1)
  - Methods:
    - **parseMarkdownLinks** (static) (private)(text: string): MarkdownLink[]
    - **findLinksToRemove** (static) (private)(markdownLinks: MarkdownLink[], urlCitations: URLCitation[]): MarkdownLink[]
    - **removeMatchedLinksAndAdjustCitations** (static) (private)(originalText: string, linksToRemove: MarkdownLink[], urlCitations: URLCitation[]): URLCitation[] }
    - **extractSiteName** (static) (private)(domain: string): string
    - **processTextWithCitations** (static)(textBlock: ResponseOutputText): string
    - **generateCitationLozenge** (static)(citation: ResponseOutputText.URLCitation, index: number): string
    - **extractWebSearchData** (static)(outputItems: any[]): Array<{
    id: string;
    query: string;
    sources: { type: string; url: string }[];
  }>
    - **transformWebSearchSources** (static)(sources: { type: string; url: string; }[]): WebSearchResult[]
    - **enrichWebSearchSources** (static)(sources: { type: string; url: string; }[]): Promise<WebSearchResult[]>
    - **generateWebSearchHTML** (static)(searchData: __type): string
    - **generateEnrichedWebSearchHTML** (static)(searchData: __type): Promise<string>
    - **processContentBlocksWithWebSearch** (static)(contentBlocks: ResponseOutputText[], outputItems: any[]): string
    - **processContentBlocksWithEnrichedWebSearch** (static)(contentBlocks: ResponseOutputText[], outputItems: any[]): Promise<string>
    - **processContentBlocks** (static)(contentBlocks: ResponseOutputText[]): string

### src/utils/WebChatJSONValidator.ts
- **WebChatJSONValidator** (15:1)
  - Methods:
    - **validateAndDetectVendor** (static)(filePath: string): Promise<VendorDetectionResult>
    - **parseJSON** (static) (private)(filePath: string): Promise<{ success: boolean; data?: any; error?: string }>
    - **detectAnthropicV1** (static) (private)(json: any): boolean
    - **detectOpenAIV1** (static) (private)(json: any): boolean
    - **detectGoogleV1** (static) (private)(json: any): boolean

### src/utils/fileTypeDetector.ts
- **FileTypeDetector** (24:1)
  - Methods:
    - **getCodeMimeType** (private)(extension: string): string
    - **detectFileType**(filePath: string): Promise<FileDetectionResult>
    - **detectCodeType** (private)(filePath: string, baseResult: __type): Promise<Pick<FileDetectionResult, 'isCode' | 'languageHint' | 'codeConfidence' | 'codeDetectionMethod'>>
    - **detectByExtension** (private)(filePath: string): FileDetectionResult
    - **detectByContent** (private)(filePath: string): Promise<FileDetectionResult>
    - **detectByFallback** (private)(filePath: string): Promise<FileDetectionResult>
    - **detectCodeByMime** (private)(mimeType: string, filePath: string): Pick<FileDetectionResult, 'isCode' | 'languageHint' | 'codeConfidence' | 'codeDetectionMethod'>
    - **detectCodeByContent** (private)(filePath: string): Promise<Pick<FileDetectionResult, 'isCode' | 'languageHint' | 'codeConfidence' | 'codeDetectionMethod'>>
    - **detectCodeByExtension** (private)(filePath: string): Pick<FileDetectionResult, 'isCode' | 'languageHint' | 'codeConfidence' | 'codeDetectionMethod'>
    - **detectCodeByStructure** (private)(filePath: string): Promise<Pick<FileDetectionResult, 'isCode' | 'languageHint' | 'codeConfidence' | 'codeDetectionMethod'>>
    - **detectShebang** (private)(firstLine: string): Pick<FileDetectionResult, 'isCode' | 'languageHint' | 'codeConfidence' | 'codeDetectionMethod'>
    - **detectModeline** (private)(lines: string[]): Pick<FileDetectionResult, 'isCode' | 'languageHint' | 'codeConfidence' | 'codeDetectionMethod'>
    - **mimeToLanguage** (private)(mimeType: string): string
    - **detectExecutable** (private)(filePath: string, baseResult: __type): Promise<Pick<FileDetectionResult, 'isExecutable' | 'executableConfidence' | 'executableReason'>>
    - **detectFileTypeOptimized**(filePath: string, maxSampleSize: number): Promise<FileDetectionResult>
  - Properties: CODE_MIME_TYPES (static) (private), EXTENSION_LANGUAGE_MAP: Record<string, string> (static) (private), EXECUTABLE_EXTENSIONS (static) (private), EXECUTABLE_BASENAMES (static) (private), EXECUTABLE_DIRECTORIES (static) (private)

### src/utils/fileValidation.ts
- **FileValidationService** (84:1)
  - Constructors: 1
  - Methods:
    - **isFileValidForUpload**(filePath: string, vendor: string?): Promise<FileValidationResult>
    - **isMimeTypeSupported** (private)(mimeType: string, supportedTypes: string[]): boolean
    - **formatFileSize** (private)(bytes: number): string
    - **getVendorLimits**(vendor: string?): VendorLimits
    - **getSupportedVendors**(): string[]
  - Properties: fileTypeDetector: FileTypeDetector (private)

### src/types/Message.ts
- **Message** (4:1)
  - Generics: <T = any>
  - Methods:
    - **getId**(): string
    - **getTimestamp**(): Date
    - **addTextContent** (abstract)(text: string): this
    - **getRole** (abstract)(): string
    - **getVendorData** (abstract)(): T
    - **serialize** (abstract)(): string
  - Properties: id: string (protected), timestamp: Date (protected)

## Functions

### debug-specific-positions.ts
- **debugSpecificPositions** (6:1)

### main.ts
- **createWindow** (20:7)
  - Returns: void

### test-citation-fix-verification.ts
- **testCitationFixVerification** (7:1)

### test-citation-positioning.ts
- **createTestGroundingMetadata** (8:1)
  - Returns: GroundingMetadata
- **testCitationPositioning** (93:1)

### test-gemini-citations.ts
- **testGeminiCitations** (12:1)

### test-real-gemini-citations.ts
- **testRealGeminiCitations** (8:1)

### scripts/anthropic-files-poc.ts
- **listAndAnalyzeFiles** (12:1)
  - Parameters: fileManager: AnthropicFileManager, listDescription: string
- **uploadAndAnalyzeFile** (50:1)
  - Parameters: fileManager: AnthropicFileManager, filePath: string, fileDescription: string
- **runAnthropicFilesPOC** (79:1)

### scripts/backup-db.ts
- **formatBytes** (20:1)
  - Parameters: bytes: number
  - Returns: string
- **formatDate** (24:1)
  - Parameters: date: Date
  - Returns: string
- **createBackup** (28:1)
- **listBackups** (43:1)
- **restoreBackup** (66:1)
  - Parameters: filename: string?
- **cleanupBackups** (109:1)
  - Parameters: keepCountStr: string?
- **askConfirmation** (146:1)
  - Parameters: question: string
  - Returns: Promise<boolean>
- **main** (161:1)

### scripts/migrate-files.ts
- **askConfirmation** (21:1)
  - Parameters: question: string
  - Returns: Promise<boolean>
- **runMigration** (35:1)

### scripts/test-file-downloads.ts
- **testFileDownload** (7:1)
  - Parameters: url: string, description: string
  - Returns: Promise<void>
- **testAllUrls** (39:1)

### scripts/test-real-import.ts
- **testRealImport** (10:1)

### src/constants.ts
- **getVendorByName** (44:14)
  - Parameters: name: string
  - Returns: Vendor | undefined
- **getAllVendorNames** (48:14)
  - Returns: string[]

### src/logger.ts
- **createConversationLogger** (42:1)
  - Parameters: conversationId: string

### src/ui-utils.ts
- **populateSelect** (10:1)
  - Parameters: selectElement: HTMLSelectElement, options: string[], placeholderText: string
  - Returns: void
  - Description: Populates a select element with options from a string array

### src/utils.ts
- **validateUrl** (13:1)
  - Parameters: url: string
  - Returns: void
  - Description: Validates whether a given string is a properly formatted HTTP/HTTPS URL
- **getProjectRoot** (29:1)
  - Returns: string
  - Description: Gets the project root directory path by searching upward for package.json
Starting from process.cwd() works in both ES module and bundled CommonJS contexts
- **resolveFromProjectRoot** (54:1)
  - Parameters: relativePath: string
  - Returns: string
  - Description: Resolves a path relative to the project root

### tests/conversation-flow-test.ts
- **assert** (30:1)
  - Parameters: condition: false | true, message: string
- **assertEqual** (36:1)
  - Parameters: actual: any, expected: any, message: string
- **assertDefined** (42:1)
  - Parameters: value: any, message: string
- **assertGreaterThan** (48:1)
  - Parameters: actual: number, expected: number, message: string
- **extractMessageContent** (55:1)
  - Parameters: message: any, vendor: string
  - Returns: string
- **runTest** (75:1)
  - Parameters: name: string, testFn: __type
  - Returns: Promise<void>
- **setup** (91:1)
  - Returns: Promise<void>
- **testConversationCreation** (112:1)
  - Returns: Promise<void>
- **testEmptyHistory** (128:1)
  - Returns: Promise<void>
- **testCompleteFlow** (140:1)
  - Returns: Promise<void>
- **testOpenAIFlow** (222:1)
  - Returns: Promise<void>
- **testOpenAIMultiTurnFlow** (269:1)
  - Returns: Promise<void>
- **testGeminiFlow** (311:1)
  - Returns: Promise<void>
- **testFollowUpFlow** (419:1)
  - Returns: Promise<void>
- **testErrorHandling** (468:1)
  - Returns: Promise<void>
- **main** (489:1)
  - Returns: Promise<void>

### src/data/mockLogs.ts
- **getLogsByType** (422:14)
  - Parameters: type: "request" | "response" | "error"
  - Returns: ApiLogEntry[]
- **getLogsByVendor** (426:14)
  - Parameters: vendor: "Anthropic" | "OpenAI" | "Gemini"
  - Returns: ApiLogEntry[]
- **getLogsByTimeRange** (430:14)
  - Parameters: startTime: string, endTime: string
  - Returns: ApiLogEntry[]
- **getErrorLogs** (439:14)
  - Returns: ApiLogEntry[]
- **getRequestLogs** (443:14)
  - Returns: ApiLogEntry[]
- **getResponseLogs** (447:14)
  - Returns: ApiLogEntry[]

### src/lib/time-utils.ts
- **formatRelativeTime** (9:1)
  - Parameters: date: string | Date
  - Returns: string
  - Description: Converts a date to a human-readable relative time format

### src/lib/utils.ts
- **cn** (5:1)
  - Parameters: ...inputs: ClassValue[]
- **useDebounce** (15:1)
  - Parameters: value: T, delay: number
  - Returns: T
  - Description: Hook that debounces a value with a specified delay
  - Generics: <T>

### src/hooks/useRecentChats.ts
- **useRecentChats** (25:14)
  - Returns: UseRecentChatsResult

### src/hooks/useStarredChats.ts
- **useStarredChats** (24:14)
  - Returns: UseStarredChatsResult

### src/ipc/conversation-handlers.ts
- **setupConversationHandlers** (8:1)

### src/ipc/dialog-handlers.ts
- **setupDialogHandlers** (10:1)
  - Returns: void

### src/ipc/import-handlers.ts
- **registerImportHandlers** (13:1)
  - Returns: void

### src/ipc/logging-handlers.ts
- **registerLoggingHandlers** (9:1)
  - Returns: void

### src/ipc/settings-handlers.ts
- **registerSettingsHandlers** (14:1)
  - Returns: void

### src/schemas/AnthropicV1Schema.ts
- **validateAnthropicV1** (94:1)
  - Parameters: data: any
  - Returns: { success: boolean; error?: string; data?: AnthropicV1Export }
  - Description: Validate JSON data against Anthropic v1 schema

### src/utils/anthropicGuards.ts
- **isToolResult** (3:1)
  - Parameters: b: ReqOrResBlock
  - Returns: AnyToolResult
- **isToolUse** (7:1)
  - Parameters: b: ReqOrResBlock
  - Returns: AnyToolUse
- **isWebSearchToolUse** (12:1)
  - Parameters: b: ReqOrResBlock
  - Returns: WebSearchToolUseAny
- **isSdkWebSearchToolUse** (20:1)
  - Parameters: b: ReqOrResBlock
  - Returns: AnyWebSearchToolUse
- **isScrapedWebSearchToolUse** (26:1)
  - Parameters: b: ReqOrResBlock
  - Returns: AnyWebSearchToolUse
- **isTextBlock** (32:1)
  - Parameters: b: ReqOrResBlock
  - Returns: AnthropicTextishBlock
- **isScrapedWebCitation** (36:1)
  - Parameters: c: AnthropicCitationish
  - Returns: ScrapedWebCitation
- **isScrapedWebSearchToolResultWithArray** (48:1)
  - Parameters: b: ReqOrResBlock
  - Returns: ScrapedWebSearchToolResultWithArray
- **isSdkWebSearchToolResultWithArray** (59:1)
  - Parameters: b: ReqOrResBlock, id: string?
  - Returns: WebSearchResultLike[] }
- **normalizeWebToStrictContentBlocks** (71:1)
  - Parameters: blocks: AnthropicWebContentBlock[]
  - Returns: AnthContentBlock>
- **isStrictContentBlocks** (85:1)
  - Parameters: blocks: AnthropicWebContentBlock[]
  - Returns: AnthContentBlock>

### src/utils/fileValidation.ts
- **isFileValidForUpload** (218:1)
  - Parameters: filePath: string, vendor: string?
  - Returns: Promise<FileValidationResult>
  - Description: Main validation function - validates file for upload

### src/utils/vendorFavicons.ts
- **getVendorFavicon** (18:1)
  - Parameters: modelId: string
  - Returns: string | null
  - Description: Get vendor favicon path from model ID
- **getVendorName** (33:1)
  - Parameters: modelId: string
  - Returns: string
  - Description: Get vendor name from model ID for alt text

### tests/poc/unified-poc-2.ts
- **unifyProcess** (16:1)
  - Parameters: markdown: string
  - Returns: Promise<string>
  - Description: Convert Markdown (possibly with inline HTML) to sanitized HTML string.
- **main** (37:1)

### tests/poc/unified-poc.ts
- **markdownToHtml** (16:1)
  - Parameters: markdown: string
  - Returns: Promise<string>
  - Description: Convert Markdown (possibly with inline HTML) to sanitized HTML string.
- **repairJsonAttrs** (75:1)
  - Parameters: html: string, attrNames = ["data-results"]
  - Returns: string
  - Description: Repair broken JSON-in-HTML attributes that were emitted like:
  data-results="[{\"title\":\"ok\"}]"
HTML doesn't treat backslashes as escapes, so we:
 - capture the whole value using a "backslash-aware" scanner,
 - switch the outer quotes to single quotes,
 - unescape the \" -> " we see in the raw text,
 - entity-encode & and ' for single-quoted attribute safety.
- **extractAttr** (128:1)
  - Parameters: html: string, attrName: string
  - Returns: string | null
- **main** (140:1)

### src/types/conversation.ts
- **generateConversationName** (49:14)
  - Returns: string
- **createMessage** (54:14)
  - Parameters: role: "user" | "assistant", content: string
  - Returns: Message
- **sanitizeMessageForDisplay** (68:14)
  - Parameters: content: string
  - Returns: string
- **sanitizeUserMessageForDisplay** (79:14)
  - Parameters: content: string
  - Returns: string

### src/types/result.ts
- **success** (8:1)
  - Parameters: data: T
  - Returns: Result<T>
  - Generics: <T>
- **failure** (12:1)
  - Parameters: error: string
  - Returns: Result<T>
  - Generics: <T = never>
- **isSuccess** (16:1)
  - Parameters: res: { success: false; error: string; } | { success: true; data: T; }
  - Returns: res is { success: true; data: T }
  - Generics: <T>

### src/types/utilityTypes.ts
- **asList** (3:1)
  - Parameters: xs: T[]
  - Returns: ReadonlyArray<T>
  - Generics: <T>

### data/attachments/2025/09/22/0a11df2f-edd9-4023-a12b-66b2fa73dfca/main.ts
- **createWindow** (14:7)
  - Returns: void

### data/attachments/2025/09/22/e0f73b37-6b4d-4cbd-929a-13906fe206c6/main.ts
- **createWindow** (14:7)
  - Returns: void

### src/App.tsx
- **AppContent** (18:7)
- **App** (43:7)

### src/contexts/RecentChatsContext.tsx
- **RecentChatsProvider** (20:14)
  - Parameters: { children }
- **useRecentChatsContext** (41:14)
  - Returns: RecentChatsContextType

### src/contexts/StarredChatsContext.tsx
- **StarredChatsProvider** (20:14)
  - Parameters: { children }
- **useStarredChatsContext** (41:14)
  - Returns: StarredChatsContextType

### src/contexts/ToastContext.tsx
- **ToastProvider** (23:14)
  - Parameters: { children }
- **useToast** (96:14)
  - Returns: ToastContextType

### tests/utils/render.tsx
- **Providers** (5:1)
  - Parameters: { children }: __type
- **renderWithProviders** (9:14)
  - Parameters: ui: ReactElement, options: __type?

### src/components/Chat/index.tsx
- **Chat** (19:7)

### src/components/Home/index.tsx
- **Home** (6:7)

### src/components/Layout/index.tsx
- **Layout** (14:7)
  - Parameters: { children }

### src/components/LogViewer/index.tsx
- **LogViewer** (10:7)

### src/components/RecentChats/index.tsx
- **RecentChats** (11:7)

### src/components/Settings/ApiKeyList.tsx
- **ApiKeyList** (14:7)
  - Parameters: { apiKeys, onRemoveKey, onAddKey }

### src/components/Settings/ApiKeyModal.tsx
- **ApiKeyModal** (30:7)
  - Parameters: { vendors, onSubmit, open, onOpenChange }

### src/components/Settings/index.tsx
- **Settings** (15:7)

### src/components/StarredChats/index.tsx
- **StarredChats** (11:7)

### src/components/ViewChats/index.tsx
- **formatChatStats** (21:7)
  - Parameters: messageCount: number, fileCount: number, totalTokens: number, maxTokens: number?
  - Returns: string
- **ViewChats** (58:7)

### src/components/ui/ChatActionMenu.tsx
- **ChatActionMenu** (20:7)
  - Parameters: {
  conversationId,
  conversationName,
  isStarred,
  onConversationUpdate,
  className = '',
  menuPosition = 'right'
}

### src/components/ui/ChatSettings.tsx
- **ChatSettings** (22:7)
  - Parameters: {
  showTokens,
  onToggle,
  conversationId,
  conversationName,
  isStarred,
  onConversationUpdate
}

### src/components/ui/CitationLozenge.tsx
- **CitationLozenge** (16:7)
  - Parameters: {
  fullTitle,
  truncatedTitle,
  citationUrl,
  faviconUrl,
  siteName,
  citationIndex,
  className = ''
}

### src/components/ui/ContentRenderer.tsx
- **ContentRenderer** (29:7)
  - Parameters: { content, className = '' }
- **renderMarkdownWithCitations** (107:7)
  - Parameters: markdownContent: string, keyPrefix: string
  - Returns: ReactNode

### src/components/ui/ConversationTooltip.tsx
- **ConversationTooltip** (12:7)
  - Parameters: {
  conversationId,
  children,
  className = ''
}

### src/components/ui/DeleteChatModal.tsx
- **DeleteChatModal** (13:14)
  - Parameters: {
  isOpen,
  chatName,
  onDelete,
  onCancel
}

### src/components/ui/DeleteMultipleChatsModal.tsx
- **DeleteMultipleChatsModal** (15:14)
  - Parameters: {
  isOpen,
  chatCount,
  onDelete,
  onCancel,
  isDeleting = false
}

### src/components/ui/FileLozenge.tsx
- **getFileExtension** (19:7)
  - Parameters: fileName: string
  - Returns: string
- **formatFileSize** (25:7)
  - Parameters: bytes: number
  - Returns: string
- **FileLozenge** (38:7)
  - Parameters: { fileName, lineCount, filePath, onRemove, isImage = false, isPDF = false, pageCount, fileSize }

### src/components/ui/ImportWebChatModal.tsx
- **ImportWebChatModal** (15:14)
  - Parameters: {
  isOpen,
  onClose,
  onImportSuccess,
  onBatchImportComplete,
}

### src/components/ui/RenameChatModal.tsx
- **RenameChatModal** (13:14)
  - Parameters: {
  isOpen,
  currentName,
  onSave,
  onCancel
}

### src/components/ui/Toast.tsx
- **Toast** (22:14)
  - Parameters: { toast, onDismiss }

### src/components/ui/ToastContainer.tsx
- **ToastContainer** (12:14)
  - Parameters: { toasts, onDismiss }

### src/components/ui/TokenDisplay.tsx
- **TokenDisplay** (14:7)
  - Parameters: {
  inputTokens,
  outputTokens,
  totalTokens,
  maxTokens,
  className = ''
}

### src/components/ui/WebSearchDisplay.tsx
- **WebSearchDisplay** (22:7)
  - Parameters: {
  query,
  results,
  resultCount,
  className = ''
}

### src/components/ui/button.tsx
- **Button** (38:1)
  - Parameters: {
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ClassProp) => string> & { asChild?: boolean; }

### src/components/ui/card.tsx
- **Card** (5:1)
  - Parameters: { className, ...props }: HTMLAttributes<HTMLDivElement>
- **CardHeader** (18:1)
  - Parameters: { className, ...props }: HTMLAttributes<HTMLDivElement>
- **CardTitle** (31:1)
  - Parameters: { className, ...props }: HTMLAttributes<HTMLDivElement>
- **CardDescription** (41:1)
  - Parameters: { className, ...props }: HTMLAttributes<HTMLDivElement>
- **CardAction** (51:1)
  - Parameters: { className, ...props }: HTMLAttributes<HTMLDivElement>
- **CardContent** (64:1)
  - Parameters: { className, ...props }: HTMLAttributes<HTMLDivElement>
- **CardFooter** (74:1)
  - Parameters: { className, ...props }: HTMLAttributes<HTMLDivElement>

### src/components/ui/dialog.tsx
- **Dialog** (7:1)
  - Parameters: {
  ...props
}: DialogProps
- **DialogTrigger** (13:1)
  - Parameters: {
  ...props
}: RefAttributes<HTMLButtonElement>
- **DialogPortal** (19:1)
  - Parameters: {
  ...props
}: DialogPortalProps
- **DialogClose** (25:1)
  - Parameters: {
  ...props
}: RefAttributes<HTMLButtonElement>
- **DialogOverlay** (31:1)
  - Parameters: {
  className,
  ...props
}: RefAttributes<HTMLDivElement>
- **DialogContent** (47:1)
  - Parameters: {
  className,
  children,
  showCloseButton = true,
  ...props
}: RefAttributes<HTMLDivElement> & { showCloseButton?: boolean; }
- **DialogHeader** (81:1)
  - Parameters: { className, ...props }: HTMLAttributes<HTMLDivElement>
- **DialogFooter** (91:1)
  - Parameters: { className, ...props }: HTMLAttributes<HTMLDivElement>
- **DialogTitle** (104:1)
  - Parameters: {
  className,
  ...props
}: RefAttributes<HTMLHeadingElement>
- **DialogDescription** (117:1)
  - Parameters: {
  className,
  ...props
}: RefAttributes<HTMLParagraphElement>

### src/components/ui/input.tsx
- **Input** (5:1)
  - Parameters: { className, type, ...props }: InputHTMLAttributes<HTMLInputElement>

### src/components/ui/label.tsx
- **Label** (8:1)
  - Parameters: {
  className,
  ...props
}: RefAttributes<HTMLLabelElement>

### src/components/ui/select.tsx
- **Select** (7:1)
  - Parameters: {
  ...props
}: SelectSharedProps & { value?: string; defaultValue?: string; onValueChange?(value: string): void; }
- **SelectGroup** (13:1)
  - Parameters: {
  ...props
}: RefAttributes<HTMLDivElement>
- **SelectValue** (19:1)
  - Parameters: {
  ...props
}: RefAttributes<HTMLSpanElement>
- **SelectTrigger** (25:1)
  - Parameters: {
  className,
  size = "default",
  children,
  ...props
}: RefAttributes<HTMLButtonElement> & { size?: "sm" | "default"; }
- **SelectContent** (51:1)
  - Parameters: {
  className,
  children,
  position = "popper",
  ...props
}: RefAttributes<HTMLDivElement>
- **SelectLabel** (86:1)
  - Parameters: {
  className,
  ...props
}: RefAttributes<HTMLDivElement>
- **SelectItem** (99:1)
  - Parameters: {
  className,
  children,
  ...props
}: RefAttributes<HTMLDivElement>
- **SelectSeparator** (123:1)
  - Parameters: {
  className,
  ...props
}: RefAttributes<HTMLDivElement>
- **SelectScrollUpButton** (136:1)
  - Parameters: {
  className,
  ...props
}: RefAttributes<HTMLDivElement>
- **SelectScrollDownButton** (154:1)
  - Parameters: {
  className,
  ...props
}: RefAttributes<HTMLDivElement>

### test-gemini-citations.js
- **testGeminiCitations** (13:1)

### scripts/zod-anthropic-validator-poc.js
- **detectAnthropicV1Current** (89:1)
  - Parameters: json
- **detectAnthropicV1Zod** (169:1)
  - Parameters: json
- **validateFile** (186:1)
  - Parameters: filePath, compareMode = false
- **validateAllSamples** (249:1)
  - Parameters: compareMode = false
- **main** (270:1)

### data/attachments/2025/10/01/acb95065-a0bf-4658-ad96-18e998efdd4f/debug-citations.js
- **processTextWithCitations** (4:1)
  - Parameters: text, citations
- **generateCitationLozenge** (12:1)
  - Parameters: citation, index

### data/attachments/2025/10/07/df495f34-5cbf-4f80-9fb4-bb8960fcbc04/debug-citations.js
- **processTextWithCitations** (4:1)
  - Parameters: text, citations
- **generateCitationLozenge** (12:1)
  - Parameters: citation, index

## React Components

### src/App.tsx
- **AppContent** (function) (18:7)
- **App** (function) (43:7)

### src/contexts/RecentChatsContext.tsx
- **RecentChatsProvider** (function) (20:14)

### src/contexts/StarredChatsContext.tsx
- **StarredChatsProvider** (function) (20:14)

### src/contexts/ToastContext.tsx
- **ToastProvider** (function) (23:14)

### tests/utils/render.tsx
- **Providers** (function) (5:1)

### src/components/Chat/index.tsx
- **Chat** (function) (19:7)

### src/components/Home/index.tsx
- **Home** (function) (6:7)

### src/components/Layout/index.tsx
- **Layout** (function) (14:7)

### src/components/LogViewer/index.tsx
- **LogViewer** (function) (10:7)

### src/components/RecentChats/index.tsx
- **RecentChats** (function) (11:7)

### src/components/Settings/ApiKeyList.tsx
- **ApiKeyList** (function) (14:7)

### src/components/Settings/ApiKeyModal.tsx
- **ApiKeyModal** (function) (30:7)

### src/components/Settings/index.tsx
- **Settings** (function) (15:7)

### src/components/StarredChats/index.tsx
- **StarredChats** (function) (11:7)

### src/components/ViewChats/index.tsx
- **ViewChats** (function) (58:7)

### src/components/ui/ChatActionMenu.tsx
- **ChatActionMenu** (function) (20:7)

### src/components/ui/ChatSettings.tsx
- **ChatSettings** (function) (22:7)

### src/components/ui/CitationLozenge.tsx
- **CitationLozenge** (function) (16:7)

### src/components/ui/ContentRenderer.tsx
- **ContentRenderer** (function) (29:7)
- **renderMarkdownWithCitations** (function) (107:7)

### src/components/ui/ConversationTooltip.tsx
- **ConversationTooltip** (function) (12:7)

### src/components/ui/DeleteChatModal.tsx
- **DeleteChatModal** (function) (13:14)

### src/components/ui/DeleteMultipleChatsModal.tsx
- **DeleteMultipleChatsModal** (function) (15:14)

### src/components/ui/FileLozenge.tsx
- **FileLozenge** (function) (38:7)

### src/components/ui/ImportWebChatModal.tsx
- **ImportWebChatModal** (function) (15:14)

### src/components/ui/RenameChatModal.tsx
- **RenameChatModal** (function) (13:14)

### src/components/ui/Toast.tsx
- **Toast** (function) (22:14)

### src/components/ui/ToastContainer.tsx
- **ToastContainer** (function) (12:14)

### src/components/ui/TokenDisplay.tsx
- **TokenDisplay** (function) (14:7)

### src/components/ui/WebSearchDisplay.tsx
- **WebSearchDisplay** (function) (22:7)

### src/components/ui/button.tsx
- **Button** (function) (38:1)

### src/components/ui/card.tsx
- **Card** (function) (5:1)
- **CardHeader** (function) (18:1)
- **CardTitle** (function) (31:1)
- **CardDescription** (function) (41:1)
- **CardAction** (function) (51:1)
- **CardContent** (function) (64:1)
- **CardFooter** (function) (74:1)

### src/components/ui/dialog.tsx
- **Dialog** (function) (7:1)
- **DialogTrigger** (function) (13:1)
- **DialogPortal** (function) (19:1)
- **DialogClose** (function) (25:1)
- **DialogOverlay** (function) (31:1)
- **DialogContent** (function) (47:1)
- **DialogHeader** (function) (81:1)
- **DialogFooter** (function) (91:1)
- **DialogTitle** (function) (104:1)
- **DialogDescription** (function) (117:1)

### src/components/ui/input.tsx
- **Input** (function) (5:1)

### src/components/ui/label.tsx
- **Label** (function) (8:1)

### src/components/ui/select.tsx
- **Select** (function) (7:1)
- **SelectGroup** (function) (13:1)
- **SelectValue** (function) (19:1)
- **SelectTrigger** (function) (25:1)
- **SelectContent** (function) (51:1)
- **SelectLabel** (function) (86:1)
- **SelectItem** (function) (99:1)
- **SelectSeparator** (function) (123:1)
- **SelectScrollUpButton** (function) (136:1)
- **SelectScrollDownButton** (function) (154:1)

## IPC Usage

### src/ipc/conversation-handlers.ts
**Handlers:**
- handle: `conversation:create` (14:3)
- handle: `conversation:sendMessage` (18:3)
- handle: `conversation:getHistory` (22:3)
- handle: `conversation:clear` (26:3)
- handle: `conversation:delete` (30:3)
- handle: `conversation:deleteMultiple` (34:3)
- handle: `conversation:updateName` (38:3)
- handle: `conversation:getAll` (42:3)
- handle: `conversation:getById` (46:3)
- handle: `conversation:getTokens` (50:3)
- handle: `conversation:toggleStar` (54:3)
- handle: `conversation:getStarred` (58:3)
- handle: `conversation:getRecent` (62:3)

### src/ipc/dialog-handlers.ts
**Handlers:**
- handle: `dialog:showOpenDialog` (12:3)
- handle: `dialog:getFileStats` (41:3)

### src/ipc/import-handlers.ts
**Handlers:**
- handle: `import:webChat` (15:3)

### src/ipc/logging-handlers.ts
**Handlers:**
- handle: `logging:getLogContent` (11:5)
- handle: `logging:getLogStats` (25:5)
- handle: `logging:getAvailableLogKeys` (39:5)

### src/ipc/settings-handlers.ts
**Handlers:**
- handle: `settings:getSupportedVendors` (16:5)
- handle: `settings:addApiKey` (21:5)
- handle: `settings:getApiKeys` (35:5)
- handle: `settings:removeApiKey` (46:5)
- handle: `settings:getApiKeyById` (60:5)
- handle: `settings:getShowTurnCounter` (74:5)
- handle: `settings:setShowTurnCounter` (85:5)
- handle: `settings:getLoggingConfig` (99:5)
- handle: `settings:setLoggingConfig` (110:5)
- handle: `settings:getApiLoggingEnabled` (124:5)
- handle: `settings:setApiLoggingEnabled` (135:5)

### src/preload/preload.ts
**Invocations:**
- invoke: `settings:getSupportedVendors` (12:9)
- invoke: `settings:addApiKey` (15:9)
- invoke: `settings:getApiKeys` (18:9)
- invoke: `settings:removeApiKey` (21:9)
- invoke: `settings:getApiKeyById` (24:9)
- invoke: `settings:getShowTurnCounter` (27:9)
- invoke: `settings:setShowTurnCounter` (30:9)
- invoke: `settings:getLoggingConfig` (33:9)
- invoke: `settings:setLoggingConfig` (36:9)
- invoke: `settings:getApiLoggingEnabled` (39:9)
- invoke: `settings:setApiLoggingEnabled` (42:9)
- invoke: `logging:getLogContent` (46:9)
- invoke: `logging:getLogStats` (49:9)
- invoke: `logging:getAvailableLogKeys` (52:9)
- invoke: `conversation:create` (57:13)
- invoke: `conversation:sendMessage` (60:13)
- invoke: `conversation:getHistory` (63:13)
- invoke: `conversation:clear` (66:13)
- invoke: `conversation:delete` (69:13)
- invoke: `conversation:deleteMultiple` (72:13)
- invoke: `conversation:updateName` (75:13)
- invoke: `conversation:getAll` (78:13)
- invoke: `conversation:getById` (81:13)
- invoke: `conversation:getTokens` (84:13)
- invoke: `conversation:toggleStar` (87:13)
- invoke: `conversation:getStarred` (90:13)
- invoke: `conversation:getRecent` (93:13)
- invoke: `dialog:showOpenDialog` (98:9)
- invoke: `dialog:getFileStats` (101:9)
- invoke: `import:webChat` (109:13)


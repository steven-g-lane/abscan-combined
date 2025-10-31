import { AnthropicConversationManager } from "../impl/AnthropicConversationManager";

const mgr = new AnthropicConversationManager();
mgr.sendMessageWithAttachments("hi", ["c.txt"]); // concrete-typed call

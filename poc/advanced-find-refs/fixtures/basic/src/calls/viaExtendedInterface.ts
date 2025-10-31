import { AdvancedConversationManager } from "../contracts/AdvancedConversationManager";
import { AnthropicConversationManager } from "../impl/AnthropicConversationManager";

const mgr: AdvancedConversationManager = new AnthropicConversationManager();
mgr.sendMessageWithAttachments("hi", ["a2.txt"]); // via extended interface

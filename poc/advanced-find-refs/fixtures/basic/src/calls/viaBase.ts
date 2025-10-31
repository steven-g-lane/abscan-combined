import { BaseConversationManager } from "../base/BaseConversationManager";
import { AnthropicConversationManager } from "../impl/AnthropicConversationManager";

const mgr: BaseConversationManager = new AnthropicConversationManager();
mgr.sendMessageWithAttachments("hi", ["b.txt"]); // base-typed call

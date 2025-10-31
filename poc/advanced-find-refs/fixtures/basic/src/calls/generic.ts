import { ConversationManager } from "../contracts/ConversationManager";
import { AnthropicConversationManager } from "../impl/AnthropicConversationManager";

function sendAll<T extends ConversationManager>(cm: T) {
  return cm.sendMessageWithAttachments("hi", []);
}

sendAll(new AnthropicConversationManager()); // generic, interface-typed call inside

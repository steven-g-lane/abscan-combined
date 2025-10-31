import { ConversationManager } from "../contracts/ConversationManager";
import { AnthropicConversationManager } from "../impl/AnthropicConversationManager";

let maybe: ConversationManager | undefined = new AnthropicConversationManager();
maybe?.sendMessageWithAttachments("hi", ["d.txt"]); // optional-chaining call

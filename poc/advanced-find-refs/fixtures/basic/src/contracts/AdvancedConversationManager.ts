import { ConversationManager } from "./ConversationManager";

export interface AdvancedConversationManager extends ConversationManager {
  sendMessage(msg: string): Promise<void>;
}

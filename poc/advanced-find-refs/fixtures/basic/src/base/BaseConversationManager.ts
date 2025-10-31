import { ConversationManager } from "../contracts/ConversationManager";

export abstract class BaseConversationManager implements ConversationManager {
  async sendMessageWithAttachments(msg: string, files: string[]): Promise<number> {
    // base behavior
    return files.length;
  }
}

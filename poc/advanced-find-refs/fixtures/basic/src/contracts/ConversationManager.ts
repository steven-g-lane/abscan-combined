export interface ConversationManager {
  sendMessageWithAttachments(msg: string, files: string[]): Promise<number>;
}

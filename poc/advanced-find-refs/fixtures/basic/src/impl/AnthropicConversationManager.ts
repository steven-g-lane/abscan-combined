import { AdvancedConversationManager } from "../contracts/AdvancedConversationManager";
import { BaseConversationManager } from "../base/BaseConversationManager";

export class AnthropicConversationManager
  extends BaseConversationManager
  implements AdvancedConversationManager
{
  async sendMessage(msg: string): Promise<void> {
    // no-op
  }

  override async sendMessageWithAttachments(msg: string, files: string[]): Promise<number> {
    // pretend we enhance base behavior
    const n = await super.sendMessageWithAttachments(msg, files);
    return n + 1;
  }
}

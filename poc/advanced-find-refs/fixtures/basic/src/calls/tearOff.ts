// src/calls/tearOff.ts
import { ConversationManager } from "../contracts/ConversationManager";
import { AnthropicConversationManager } from "../impl/AnthropicConversationManager";

const mgr: ConversationManager = new AnthropicConversationManager();

// tear-off (property read)
const fn = (mgr as any).sendMessageWithAttachments as (m: string, f: string[]) => number;

// invoke via .call(...) so the finder can associate it with the original method ref
fn.call(mgr, "hi", ["e.txt"]);

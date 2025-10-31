// src/cli/TSAnalyzerCLI.ts
import { TSAnalyzer } from "../core/TSAnalyzer";
import { AnalyzerConfig } from "../core/AnalyzerConfig";

export class TSAnalyzerCLI {
  static DEFAULT_CLASS = "AnthropicConversationManager";
  static DEFAULT_METHOD = "sendMessageWithAttachments";

  private static parseArgs(argv: string[]) {
    const args: Record<string, string> = {};
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (a.startsWith("--")) {
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith("--")) { args[key] = next; i++; }
        else { args[key] = "true"; }
      }
    }
    return args;
  }

  static readConfigFromProcess(): AnalyzerConfig {
    const ARGS = this.parseArgs(process.argv.slice(2));
    const concreteClass = ARGS.class || process.env.P_CLASS || this.DEFAULT_CLASS;
    const methodName    = ARGS.method || process.env.P_METHOD || this.DEFAULT_METHOD;
    const projectPath   = ARGS.project || process.env.P_PROJECT || process.cwd();
    const fileHint      = ARGS.file || process.env.P_FILE || undefined;
    const debug         = Boolean(ARGS.debug || process.env.P_DEBUG);
    return { concreteClass, methodName, projectPath, fileHint, debug };
  }

  static createAnalyzer(): TSAnalyzer {
    return new TSAnalyzer(TSAnalyzerCLI.readConfigFromProcess());
  }
}

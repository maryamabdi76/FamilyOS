import "server-only";
import type { AIService } from "./types";
import { createOpenAIService } from "./openai-ai-service";
import { unconfiguredAIService } from "./unconfigured-ai-service";

let cached: AIService | null = null;

/**
 * Resolve the configured AI provider. Domain code should call getAIService().
 */
export function getAIService(): AIService {
  if (cached) return cached;

  const provider = (process.env.AI_PROVIDER ?? "openai").trim().toLowerCase();
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());

  if (provider === "openai" && hasOpenAI) {
    cached = createOpenAIService();
    return cached;
  }

  cached = unconfiguredAIService;
  return cached;
}

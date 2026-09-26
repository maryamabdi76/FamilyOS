import "server-only";
import type { AIService } from "./types";

/**
 * Placeholder AIService used when no provider API key is configured.
 * Throws instead of returning fabricated data (Rule 12).
 */
function notConfigured(): never {
  throw new Error(
    "No AI provider is configured. Set OPENAI_API_KEY in .env.local for Phase 3 processing.",
  );
}

export const unconfiguredAIService: AIService = {
  extractTextFromDocument: async () => notConfigured(),
  classifyDocument: async () => notConfigured(),
  extractDocument: async () => notConfigured(),
  answerQuestion: async () => notConfigured(),
  generateEmbedding: async () => notConfigured(),
};

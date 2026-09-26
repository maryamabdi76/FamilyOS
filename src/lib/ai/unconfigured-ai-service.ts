import "server-only";
import type { AIService } from "./types";

/**
 * Placeholder AIService. No LLM/OCR provider has been chosen yet (see
 * Phase 0 open decisions). This throws instead of returning fabricated
 * data, per Rule 12 (no mock data in production paths) — swap this
 * export for a real provider implementation in Phase 3.
 */
function notConfigured(): never {
  throw new Error(
    "No AI provider is configured yet. Implement AIService against a chosen provider before Phase 3.",
  );
}

export const unconfiguredAIService: AIService = {
  classifyDocument: async () => notConfigured(),
  extractDocument: async () => notConfigured(),
  answerQuestion: async () => notConfigured(),
  generateEmbedding: async () => notConfigured(),
};

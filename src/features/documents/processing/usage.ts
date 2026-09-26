import "server-only";
import { db } from "@/lib/db/client";
import { aiUsageEvents } from "@/lib/db/schema";
import type { TokenUsage } from "@/lib/ai/types";

type UsageOperation = "ocr" | "classify" | "extract";

export async function recordAiUsage(input: {
  householdId: string;
  documentId: string;
  operation: UsageOperation;
  usage?: TokenUsage;
}): Promise<void> {
  if (!input.usage) return;

  await db.insert(aiUsageEvents).values({
    householdId: input.householdId,
    documentId: input.documentId,
    operation: input.operation,
    model: input.usage.model,
    inputTokens: input.usage.inputTokens ?? null,
    outputTokens: input.usage.outputTokens ?? null,
  });
}

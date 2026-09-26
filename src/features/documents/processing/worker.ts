import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  aiProcessingJobs,
  documents,
  products,
  purchases,
  warranties,
} from "@/lib/db/schema";
import { getAIService } from "@/lib/ai";
import type { DocumentType } from "@/lib/ai/types";
import { supabaseStorageService } from "@/lib/storage/supabase-storage";
import {
  parseAndNormalizeExtraction,
  shouldCreateAuthoritativeEntities,
} from "@/features/documents/extraction-schema";
import { normalizeProductName } from "./entity-resolution";
import { recordAiUsage } from "./usage";

function userSafeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("OPENAI_API_KEY") || error.message.includes("No AI provider")) {
      return "سرویس هوش مصنوعی پیکربندی نشده است.";
    }
    if (error.message.includes("OCR") || error.message.includes("PDF")) {
      return "نتونستیم متن این فایل رو بخونیم.";
    }
    return "نتونستیم این فایل رو کامل بررسی کنیم.";
  }
  return "نتونستیم این فایل رو کامل بررسی کنیم.";
}

async function claimJob(documentId: string) {
  const [job] = await db
    .select()
    .from(aiProcessingJobs)
    .where(
      and(eq(aiProcessingJobs.documentId, documentId), eq(aiProcessingJobs.status, "PENDING")),
    )
    .orderBy(desc(aiProcessingJobs.createdAt))
    .limit(1);

  if (!job) return null;

  const [claimed] = await db
    .update(aiProcessingJobs)
    .set({
      status: "RUNNING",
      attempts: job.attempts + 1,
      startedAt: new Date(),
      updatedAt: new Date(),
      lastError: null,
    })
    .where(and(eq(aiProcessingJobs.id, job.id), eq(aiProcessingJobs.status, "PENDING")))
    .returning();

  return claimed ?? null;
}

async function markJobFailed(jobId: string, documentId: string, error: unknown) {
  const message = userSafeError(error);
  const detail = error instanceof Error ? error.message : "unknown error";

  await db
    .update(aiProcessingJobs)
    .set({
      status: "FAILED",
      lastError: detail.slice(0, 2000),
      finishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(aiProcessingJobs.id, jobId));

  await db
    .update(documents)
    .set({
      status: "FAILED",
      processingError: message,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId));
}

async function upsertProduct(householdId: string, name: string) {
  const normalizedName = normalizeProductName(name);
  const [existing] = await db
    .select()
    .from(products)
    .where(and(eq(products.householdId, householdId), eq(products.normalizedName, normalizedName)))
    .limit(1);

  if (existing) {
    if (existing.name !== name) {
      const [updated] = await db
        .update(products)
        .set({ name, updatedAt: new Date() })
        .where(eq(products.id, existing.id))
        .returning();
      return updated ?? existing;
    }
    return existing;
  }

  const [created] = await db
    .insert(products)
    .values({
      householdId,
      name,
      normalizedName,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create product.");
  }
  return created;
}

async function upsertPurchase(input: {
  householdId: string;
  productId: string;
  sourceDocumentId: string;
  purchasedAt: string | null;
  amount: number | null;
  currency: "IRR" | "IRT" | null;
  seller: string | null;
  confidence: number;
}) {
  const values = {
    householdId: input.householdId,
    productId: input.productId,
    sourceDocumentId: input.sourceDocumentId,
    purchasedAt: input.purchasedAt,
    amount: input.amount,
    currency: input.currency,
    seller: input.seller,
    confidence: input.confidence,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ id: purchases.id })
    .from(purchases)
    .where(eq(purchases.sourceDocumentId, input.sourceDocumentId))
    .limit(1);

  if (existing) {
    await db.update(purchases).set(values).where(eq(purchases.id, existing.id));
    return;
  }

  await db.insert(purchases).values(values);
}

async function upsertWarranty(input: {
  householdId: string;
  productId: string;
  sourceDocumentId: string;
  durationMonths: number | null;
  expiresAt: string | null;
  confidence: number;
}) {
  const values = {
    householdId: input.householdId,
    productId: input.productId,
    sourceDocumentId: input.sourceDocumentId,
    durationMonths: input.durationMonths,
    expiresAt: input.expiresAt,
    confidence: input.confidence,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ id: warranties.id })
    .from(warranties)
    .where(eq(warranties.sourceDocumentId, input.sourceDocumentId))
    .limit(1);

  if (existing) {
    await db.update(warranties).set(values).where(eq(warranties.id, existing.id));
    return;
  }

  await db.insert(warranties).values(values);
}

/**
 * Claim the latest PENDING job for a document and run the AI pipeline.
 * Safe to call concurrently — only one claim succeeds.
 */
export async function processDocumentJob(documentId: string): Promise<void> {
  const job = await claimJob(documentId);
  if (!job) return;

  const [document] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
  if (!document) {
    await markJobFailed(job.id, documentId, new Error("Document not found."));
    return;
  }

  try {
    await db
      .update(documents)
      .set({
        status: "PROCESSING",
        processingError: null,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    const ai = getAIService();
    let extractedText = document.extractedText?.trim() ?? "";

    if (!extractedText) {
      const data = await supabaseStorageService.download(document.storageKey);
      const ocr = await ai.extractTextFromDocument({
        mimeType: document.mimeType,
        data,
      });
      extractedText = ocr.text.trim();
      await recordAiUsage({
        householdId: document.householdId,
        documentId,
        operation: "ocr",
        usage: ocr.usage,
      });
    }

    if (!extractedText) {
      throw new Error("OCR returned empty text.");
    }

    const classification = await ai.classifyDocument({ extractedText });
    await recordAiUsage({
      householdId: document.householdId,
      documentId,
      operation: "classify",
      usage: classification.usage,
    });

    const documentType: DocumentType =
      classification.confidence < 0.5 ? "OTHER" : classification.documentType;

    const extraction = await ai.extractDocument({
      extractedText,
      documentType,
    });
    await recordAiUsage({
      householdId: document.householdId,
      documentId,
      operation: "extract",
      usage: extraction.usage,
    });

    const normalized = parseAndNormalizeExtraction(extraction.raw, documentType);
    if (!normalized) {
      throw new Error("AI extraction failed Zod validation.");
    }

    const metadataJson = JSON.stringify(normalized);

    let createdEntities = false;
    if (shouldCreateAuthoritativeEntities(normalized.confidence) && normalized.entities.product) {
      const product = await upsertProduct(document.householdId, normalized.entities.product.name);
      createdEntities = true;

      const purchase = normalized.entities.purchase;
      if (purchase && (purchase.date || purchase.price != null || purchase.seller)) {
        await upsertPurchase({
          householdId: document.householdId,
          productId: product.id,
          sourceDocumentId: documentId,
          purchasedAt: purchase.date,
          amount: purchase.price,
          currency: purchase.currency,
          seller: purchase.seller,
          confidence: normalized.confidence,
        });
      }

      const warranty = normalized.entities.warranty;
      if (warranty && (warranty.durationMonths != null || warranty.expiresAt)) {
        await upsertWarranty({
          householdId: document.householdId,
          productId: product.id,
          sourceDocumentId: documentId,
          durationMonths: warranty.durationMonths,
          expiresAt: warranty.expiresAt,
          confidence: normalized.confidence,
        });
      }
    }

    void createdEntities;

    await db
      .update(documents)
      .set({
        status: "READY",
        documentType: normalized.documentType,
        extractedText,
        extractedMetadata: metadataJson,
        processingError: null,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    await db
      .update(aiProcessingJobs)
      .set({
        status: "SUCCEEDED",
        finishedAt: new Date(),
        updatedAt: new Date(),
        lastError: null,
      })
      .where(eq(aiProcessingJobs.id, job.id));
  } catch (error) {
    console.error(
      "Document processing failed",
      documentId,
      error instanceof Error ? error.message : "unknown error",
    );
    await markJobFailed(job.id, documentId, error);
  }
}

/** Process any PENDING job for the document (used after upload / retry). */
export async function processPendingJobForDocument(documentId: string): Promise<void> {
  await processDocumentJob(documentId);
}

export async function getLatestJobForDocument(documentId: string) {
  const [job] = await db
    .select()
    .from(aiProcessingJobs)
    .where(eq(aiProcessingJobs.documentId, documentId))
    .orderBy(desc(aiProcessingJobs.createdAt))
    .limit(1);
  return job ?? null;
}

export async function hasActiveJob(documentId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: aiProcessingJobs.id })
    .from(aiProcessingJobs)
    .where(
      and(
        eq(aiProcessingJobs.documentId, documentId),
        inArray(aiProcessingJobs.status, ["PENDING", "RUNNING"]),
      ),
    )
    .limit(1);
  return Boolean(row);
}

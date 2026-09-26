import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { aiProcessingJobs, documents } from "@/lib/db/schema";

const DEFAULT_MAX_ATTEMPTS = 3;

/**
 * Create a PENDING processing job for a freshly uploaded document.
 * Does not process — call processDocumentJob afterward (e.g. via after()).
 */
export async function enqueueDocumentProcessing(input: {
  documentId: string;
  householdId: string;
}): Promise<{ jobId: string }> {
  const [job] = await db
    .insert(aiProcessingJobs)
    .values({
      documentId: input.documentId,
      householdId: input.householdId,
      status: "PENDING",
      attempts: 0,
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
    })
    .returning({ id: aiProcessingJobs.id });

  if (!job) {
    throw new Error("Failed to enqueue document processing job.");
  }

  return { jobId: job.id };
}

/**
 * Enqueue a retry when the document failed (or was never processed).
 * Reuses the latest FAILED job when attempts remain; otherwise creates a new PENDING job.
 */
export async function enqueueRetryIfAllowed(input: {
  documentId: string;
  householdId: string;
}): Promise<{ jobId: string } | { error: string }> {
  const [active] = await db
    .select({ id: aiProcessingJobs.id })
    .from(aiProcessingJobs)
    .where(
      and(
        eq(aiProcessingJobs.documentId, input.documentId),
        inArray(aiProcessingJobs.status, ["PENDING", "RUNNING"]),
      ),
    )
    .limit(1);

  if (active) {
    return { jobId: active.id };
  }

  const [last] = await db
    .select()
    .from(aiProcessingJobs)
    .where(eq(aiProcessingJobs.documentId, input.documentId))
    .orderBy(desc(aiProcessingJobs.createdAt))
    .limit(1);

  if (last?.status === "FAILED") {
    if (last.attempts >= last.maxAttempts) {
      return { error: "حداکثر تعداد تلاش برای پردازش این سند انجام شده است." };
    }

    const [requeued] = await db
      .update(aiProcessingJobs)
      .set({
        status: "PENDING",
        lastError: null,
        finishedAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(aiProcessingJobs.id, last.id), eq(aiProcessingJobs.status, "FAILED")))
      .returning({ id: aiProcessingJobs.id });

    if (requeued) {
      await db
        .update(documents)
        .set({
          status: "UPLOADED",
          processingError: null,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, input.documentId));
      return { jobId: requeued.id };
    }
  }

  return enqueueDocumentProcessing(input);
}

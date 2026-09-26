import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { documents, householdMembers } from "@/lib/db/schema";
import type { DocumentDetail, DocumentListItem } from "./types";

function toListItem(row: typeof documents.$inferSelect): DocumentListItem {
  return {
    id: row.id,
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    fileSizeBytes: row.fileSizeBytes,
    status: row.status,
    documentType: row.documentType,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listDocuments(householdId: string): Promise<DocumentListItem[]> {
  const rows = await db.select().from(documents).where(eq(documents.householdId, householdId)).orderBy(desc(documents.createdAt));
  return rows.map(toListItem);
}

export async function getDocumentForHousehold(documentId: string, householdId: string): Promise<DocumentDetail | null> {
  const [row] = await db.select().from(documents).where(and(eq(documents.id, documentId), eq(documents.householdId, householdId))).limit(1);
  if (!row) return null;
  return {
    ...toListItem(row),
    householdId: row.householdId,
    storageKey: row.storageKey,
    extractedText: row.extractedText,
    extractedMetadata: row.extractedMetadata,
    processingError: row.processingError,
  };
}

export async function userCanAccessHousehold(userId: string, householdId: string): Promise<boolean> {
  const [membership] = await db.select({ id: householdMembers.id }).from(householdMembers).where(and(eq(householdMembers.userId, userId), eq(householdMembers.householdId, householdId))).limit(1);
  return Boolean(membership);
}

import { z } from "zod";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_BYTES } from "./types";

export const documentUploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  mimeType: z.enum(ALLOWED_DOCUMENT_TYPES),
  size: z.number().int().positive().max(MAX_DOCUMENT_SIZE_BYTES),
});

export const textDocumentSchema = z.object({
  title: z.string().trim().min(1).max(255),
  content: z.string().trim().min(1).max(200_000),
});

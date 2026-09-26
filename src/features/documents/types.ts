export const MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024;
export const ALLOWED_DOCUMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"] as const;

export type DocumentStatus = "UPLOADED" | "PROCESSING" | "READY" | "FAILED";

export interface DocumentListItem {
  id: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  status: DocumentStatus;
  createdAt: string;
}

export interface DocumentDetail extends DocumentListItem {
  householdId: string;
  storageKey: string;
  extractedText: string | null;
  processingError: string | null;
}

export function isAllowedDocumentType(value: string): value is (typeof ALLOWED_DOCUMENT_TYPES)[number] {
  return (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(value);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
}

export function statusLabel(status: DocumentStatus): string {
  return {
    UPLOADED: "ذخیره شد",
    PROCESSING: "در حال بررسی",
    READY: "آماده",
    FAILED: "بررسی ناموفق",
  }[status];
}

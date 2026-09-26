export const MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024;
export const ALLOWED_DOCUMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"] as const;

export type DocumentStatus = "UPLOADED" | "PROCESSING" | "READY" | "FAILED";

export type DocumentType =
  | "RECEIPT"
  | "WARRANTY"
  | "CONTRACT"
  | "INSURANCE"
  | "REPAIR"
  | "PURCHASE"
  | "UTILITY"
  | "VEHICLE"
  | "HOME"
  | "OTHER";

export interface DocumentListItem {
  id: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  status: DocumentStatus;
  documentType: DocumentType | null;
  createdAt: string;
}

export interface DocumentDetail extends DocumentListItem {
  householdId: string;
  storageKey: string;
  extractedText: string | null;
  extractedMetadata: string | null;
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
    PROCESSING: "در حال بررسی...",
    READY: "آماده شد ✓",
    FAILED: "بررسی ناموفق",
  }[status];
}

export function documentTypeLabel(type: DocumentType): string {
  return {
    RECEIPT: "رسید / فاکتور",
    WARRANTY: "گارانتی",
    CONTRACT: "قرارداد",
    INSURANCE: "بیمه",
    REPAIR: "تعمیر",
    PURCHASE: "خرید",
    UTILITY: "قبوض",
    VEHICLE: "خودرو",
    HOME: "خانه",
    OTHER: "سایر",
  }[type];
}

export function formatAmount(amount: number, currency: "IRR" | "IRT" | null): string {
  const formatted = new Intl.NumberFormat("fa-IR").format(amount);
  if (currency === "IRT") return `${formatted} تومان`;
  if (currency === "IRR") return `${formatted} ریال`;
  return formatted;
}

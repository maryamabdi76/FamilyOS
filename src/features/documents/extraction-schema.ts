import { z } from "zod";
import type { DocumentType } from "@/lib/ai/types";

const DOCUMENT_TYPES = [
  "RECEIPT",
  "WARRANTY",
  "CONTRACT",
  "INSURANCE",
  "REPAIR",
  "PURCHASE",
  "UTILITY",
  "VEHICLE",
  "HOME",
  "OTHER",
] as const satisfies readonly DocumentType[];

/** Convert Persian/Arabic-Indic digits to ASCII. */
export function toAsciiDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - "۰".charCodeAt(0)))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - "٠".charCodeAt(0)));
}

/**
 * Normalize a date string to ISO YYYY-MM-DD (Gregorian) when possible.
 * Accepts Gregorian ISO and simple Jalali YYYY-MM-DD (converted approximately
 * only when clearly Gregorian-looking year >= 1700; Jalali years are kept as
 * null rather than incorrectly stored — prefer model-provided Gregorian).
 */
export function normalizeDateToIso(value: unknown): string | null {
  if (value == null) return null;
  const raw = toAsciiDigits(String(value)).trim();
  if (!raw) return null;

  const match = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Jalali years are typically 1300–1500; do not store them as Gregorian.
  if (year < 1700) return null;

  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const date = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return iso;
}

function normalizeCurrency(value: unknown): "IRR" | "IRT" | null {
  if (value == null) return null;
  const raw = String(value).trim().toUpperCase();
  if (raw === "IRR" || raw === "RIAL" || raw === "ریال") return "IRR";
  if (raw === "IRT" || raw === "TOMAN" || raw === "تومان") return "IRT";
  return null;
}

function normalizePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }
  if (typeof value === "string") {
    const cleaned = toAsciiDigits(value).replace(/[^\d.]/g, "");
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return Math.round(parsed);
  }
  return null;
}

const productSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
  })
  .passthrough();

const purchaseSchema = z
  .object({
    date: z.unknown().optional(),
    price: z.unknown().optional(),
    currency: z.unknown().optional(),
    seller: z.string().trim().max(255).optional().nullable(),
  })
  .passthrough();

const warrantySchema = z
  .object({
    durationMonths: z.unknown().optional(),
    expiresAt: z.unknown().optional(),
  })
  .passthrough();

export const extractionRawSchema = z
  .object({
    documentType: z.enum(DOCUMENT_TYPES).optional(),
    confidence: z.number().min(0).max(1).optional(),
    entities: z
      .object({
        product: productSchema.optional().nullable(),
        purchase: purchaseSchema.optional().nullable(),
        warranty: warrantySchema.optional().nullable(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type NormalizedExtraction = {
  documentType: DocumentType;
  confidence: number;
  entities: {
    product: { name: string } | null;
    purchase: {
      date: string | null;
      price: number | null;
      currency: "IRR" | "IRT" | null;
      seller: string | null;
    } | null;
    warranty: {
      durationMonths: number | null;
      expiresAt: string | null;
    } | null;
  };
};

export const ENTITY_CONFIDENCE_THRESHOLD = 0.5;

export function parseAndNormalizeExtraction(
  raw: unknown,
  fallbackDocumentType: DocumentType,
): NormalizedExtraction | null {
  const parsed = extractionRawSchema.safeParse(raw);
  if (!parsed.success) return null;

  const data = parsed.data;
  const confidence = typeof data.confidence === "number" ? data.confidence : 0;
  const documentType = data.documentType ?? fallbackDocumentType;

  const productName = data.entities?.product?.name?.trim();
  const purchaseRaw = data.entities?.purchase;
  const warrantyRaw = data.entities?.warranty;

  let durationMonths: number | null = null;
  if (warrantyRaw?.durationMonths != null) {
    const n = Number(warrantyRaw.durationMonths);
    if (Number.isFinite(n) && n > 0 && n < 1200) durationMonths = Math.round(n);
  }

  return {
    documentType,
    confidence,
    entities: {
      product: productName ? { name: productName } : null,
      purchase: purchaseRaw
        ? {
            date: normalizeDateToIso(purchaseRaw.date),
            price: normalizePrice(purchaseRaw.price),
            currency: normalizeCurrency(purchaseRaw.currency),
            seller: purchaseRaw.seller?.trim() || null,
          }
        : null,
      warranty: warrantyRaw
        ? {
            durationMonths,
            expiresAt: normalizeDateToIso(warrantyRaw.expiresAt),
          }
        : null,
    },
  };
}

export function shouldCreateAuthoritativeEntities(confidence: number): boolean {
  return confidence >= ENTITY_CONFIDENCE_THRESHOLD;
}

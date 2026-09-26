/** Normalize product names for household-scoped entity matching (spec §40). */
export function normalizeProductName(name: string): string {
  return name
    .trim()
    .replace(/\u200c/g, "") // ZWNJ
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { products, purchases, warranties } from "@/lib/db/schema";

export type LinkedEntities = {
  product: { id: string; name: string } | null;
  purchase: {
    id: string;
    purchasedAt: string | null;
    amount: number | null;
    currency: "IRR" | "IRT" | null;
    seller: string | null;
    confidence: number | null;
  } | null;
  warranty: {
    id: string;
    durationMonths: number | null;
    expiresAt: string | null;
    confidence: number | null;
  } | null;
};

export async function getLinkedEntitiesForDocument(
  documentId: string,
  householdId: string,
): Promise<LinkedEntities> {
  const [purchase] = await db
    .select({
      id: purchases.id,
      productId: purchases.productId,
      purchasedAt: purchases.purchasedAt,
      amount: purchases.amount,
      currency: purchases.currency,
      seller: purchases.seller,
      confidence: purchases.confidence,
    })
    .from(purchases)
    .where(and(eq(purchases.sourceDocumentId, documentId), eq(purchases.householdId, householdId)))
    .limit(1);

  const [warranty] = await db
    .select({
      id: warranties.id,
      productId: warranties.productId,
      durationMonths: warranties.durationMonths,
      expiresAt: warranties.expiresAt,
      confidence: warranties.confidence,
    })
    .from(warranties)
    .where(and(eq(warranties.sourceDocumentId, documentId), eq(warranties.householdId, householdId)))
    .limit(1);

  const productId = purchase?.productId ?? warranty?.productId;
  let product: LinkedEntities["product"] = null;
  if (productId) {
    const [row] = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.householdId, householdId)))
      .limit(1);
    product = row ?? null;
  }

  return {
    product,
    purchase: purchase
      ? {
          id: purchase.id,
          purchasedAt: purchase.purchasedAt,
          amount: purchase.amount,
          currency: purchase.currency,
          seller: purchase.seller,
          confidence: purchase.confidence,
        }
      : null,
    warranty: warranty
      ? {
          id: warranty.id,
          durationMonths: warranty.durationMonths,
          expiresAt: warranty.expiresAt,
          confidence: warranty.confidence,
        }
      : null,
  };
}

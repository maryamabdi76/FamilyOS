import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { households, householdMembers } from "@/lib/db/schema";
import type { Household, HouseholdRole } from "@/types";

export interface HouseholdWithRole extends Household {
  role: HouseholdRole;
}

/**
 * Resolves the household the given (server-verified) user belongs to.
 * MVP assumption: a user belongs to at most one household (spec §4 keeps
 * membership simple — OWNER/MEMBER only, no multi-household switching yet).
 */
export async function getHouseholdForUser(userId: string): Promise<HouseholdWithRole | null> {
  const [row] = await db
    .select({
      id: households.id,
      name: households.name,
      createdAt: households.createdAt,
      updatedAt: households.updatedAt,
      role: householdMembers.role,
    })
    .from(householdMembers)
    .innerJoin(households, eq(householdMembers.householdId, households.id))
    .where(eq(householdMembers.userId, userId))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    role: row.role,
  };
}

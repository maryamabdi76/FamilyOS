import "server-only";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { people } from "@/lib/db/schema";
import type { Person } from "@/types";

export async function listPeople(householdId: string): Promise<Person[]> {
  const rows = await db
    .select()
    .from(people)
    .where(eq(people.householdId, householdId))
    .orderBy(desc(people.createdAt));

  return rows.map((row) => ({
    id: row.id,
    householdId: row.householdId,
    name: row.name,
    relationship: row.relationship,
    avatarUrl: row.avatarUrl,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

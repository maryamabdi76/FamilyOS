import "server-only";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

/**
 * Our `users` table mirrors Supabase Auth users by id, so that
 * household_members/people can have plain Postgres foreign keys without
 * depending on Supabase internals at the schema level (spec §10/§11:
 * keep vendors replaceable). Call this once per authenticated request
 * before writing anything that references users.id.
 */
export async function ensureUserRecord(user: { id: string; email: string }): Promise<void> {
  await db
    .insert(users)
    .values({ id: user.id, email: user.email })
    .onConflictDoNothing({ target: users.id });
}

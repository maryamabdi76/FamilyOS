"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { people } from "@/lib/db/schema";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getHouseholdForUser } from "@/features/household/queries";
import { addPersonSchema } from "./schemas";

export interface AddPersonState {
  error?: string;
}

export async function addPerson(
  _prevState: AddPersonState,
  formData: FormData,
): Promise<AddPersonState> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { error: "لطفاً دوباره وارد شوید" };
  }

  // Household is resolved server-side from the session — never trust a
  // client-supplied household id (spec §26).
  const household = await getHouseholdForUser(user.id);
  if (!household) {
    return { error: "ابتدا باید یک خانواده بسازید" };
  }

  const parsed = addPersonSchema.safeParse({
    name: formData.get("name"),
    relationship: formData.get("relationship") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است" };
  }

  await db.insert(people).values({
    householdId: household.id,
    name: parsed.data.name,
    relationship: parsed.data.relationship ?? null,
  });

  revalidatePath("/dashboard");
  return {};
}

export async function deletePerson(personId: string): Promise<void> {
  const user = await getAuthenticatedUser();
  if (!user) return;

  const household = await getHouseholdForUser(user.id);
  if (!household) return;

  // Scope the delete to the caller's own household so one household can
  // never delete another's person by guessing an id.
  await db
    .delete(people)
    .where(and(eq(people.id, personId), eq(people.householdId, household.id)));

  revalidatePath("/dashboard");
}

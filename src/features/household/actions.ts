"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { households, householdMembers } from "@/lib/db/schema";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/features/auth/queries";
import { createHouseholdSchema } from "./schemas";
import { getHouseholdForUser } from "./queries";

export interface CreateHouseholdState {
  error?: string;
}

export async function createHousehold(
  _prevState: CreateHouseholdState,
  formData: FormData,
): Promise<CreateHouseholdState> {
  const user = await getAuthenticatedUser();
  if (!user?.email) {
    redirect("/login");
  }

  const parsed = createHouseholdSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر است" };
  }

  // A user can only belong to one household in MVP — don't silently create a second.
  const existing = await getHouseholdForUser(user.id);
  if (existing) {
    redirect("/dashboard");
  }

  await ensureUserRecord({ id: user.id, email: user.email });

  await db.transaction(async (tx) => {
    const [household] = await tx
      .insert(households)
      .values({ name: parsed.data.name })
      .returning({ id: households.id });

    if (!household) {
      throw new Error("Household creation failed");
    }

    await tx.insert(householdMembers).values({
      householdId: household.id,
      userId: user.id,
      role: "OWNER",
    });
  });

  redirect("/dashboard");
}

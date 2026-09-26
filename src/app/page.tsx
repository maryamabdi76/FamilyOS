import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getHouseholdForUser } from "@/features/household/queries";

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const household = await getHouseholdForUser(user.id);
  redirect(household ? "/dashboard" : "/onboarding");
}

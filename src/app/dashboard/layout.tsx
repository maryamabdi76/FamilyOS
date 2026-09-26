import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getHouseholdForUser } from "@/features/household/queries";
import { signOut } from "@/features/auth/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const household = await getHouseholdForUser(user.id);
  if (!household) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="font-medium">{household.name}</span>
        <form action={signOut}>
          <button type="submit" className="text-sm text-muted hover:text-foreground">
            خروج
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}

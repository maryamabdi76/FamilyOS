import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getHouseholdForUser } from "@/features/household/queries";
import { listPeople } from "@/features/people/queries";
import { AddPersonForm } from "@/features/people/add-person-form";
import { DeletePersonButton } from "@/features/people/delete-person-button";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const household = await getHouseholdForUser(user.id);
  if (!household) {
    redirect("/onboarding");
  }

  const people = await listPeople(household.id);

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-8 px-6 py-10">
      <h1 className="text-xl font-semibold">سلام 👋</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-muted">اعضای خانواده</h2>
        {people.length === 0 ? (
          <p className="text-sm text-muted">هنوز عضوی اضافه نشده است.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {people.map((person) => (
              <li key={person.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p>{person.name}</p>
                  {person.relationship && (
                    <p className="text-sm text-muted">{person.relationship}</p>
                  )}
                </div>
                <DeletePersonButton personId={person.id} />
              </li>
            ))}
          </ul>
        )}
        <AddPersonForm />
      </section>
    </main>
  );
}

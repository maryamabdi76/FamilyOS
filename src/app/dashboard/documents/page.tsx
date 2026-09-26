import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getHouseholdForUser } from "@/features/household/queries";
import { listDocuments } from "@/features/documents/queries";
import { DocumentUploader } from "@/features/documents/document-uploader";
import { DocumentList } from "@/features/documents/document-list";

export default async function DocumentsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  const household = await getHouseholdForUser(user.id);
  if (!household) redirect("/onboarding");
  const documents = await listDocuments(household.id);
  return <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
    <div><Link href="/dashboard" className="text-sm text-muted hover:text-foreground">بازگشت به داشبورد</Link><h1 className="mt-3 text-2xl font-semibold">اسناد خانواده</h1><p className="mt-1 text-sm text-muted">فاکتورها، ضمانت‌نامه‌ها و یادداشت‌های مهم را یک‌جا نگه دارید.</p></div>
    <DocumentUploader />
    <section className="flex flex-col gap-3"><h2 className="text-sm font-medium">آخرین موارد</h2><DocumentList documents={documents} /></section>
  </main>;
}

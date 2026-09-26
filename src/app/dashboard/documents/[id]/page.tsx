import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getHouseholdForUser } from "@/features/household/queries";
import { getDocumentForHousehold } from "@/features/documents/queries";
import { formatFileSize, statusLabel } from "@/features/documents/types";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  const household = await getHouseholdForUser(user.id);
  if (!household) redirect("/onboarding");
  const { id } = await params;
  const document = await getDocumentForHousehold(id, household.id);
  if (!document) notFound();
  return <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
    <div><Link href="/dashboard/documents" className="text-sm text-muted hover:text-foreground">بازگشت به اسناد</Link><h1 className="mt-3 break-words text-2xl font-semibold">{document.originalFilename}</h1></div>
    <div className="flex flex-wrap gap-2 text-sm text-muted"><span className="rounded-full bg-background px-3 py-1">{statusLabel(document.status)}</span><span className="rounded-full bg-background px-3 py-1">{formatFileSize(document.fileSizeBytes)}</span></div>
    <div className="rounded-xl border border-border bg-white/60 p-5">
      <p className="text-sm leading-7 text-muted">این فایل با دسترسی محدود خانوار شما ذخیره شده است.</p>
      {document.extractedText && <div className="mt-5 border-t border-border pt-5"><h2 className="text-sm font-medium">متن ذخیره‌شده</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{document.extractedText}</p></div>}
      <a href={`/api/documents/${document.id}/file`} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background">باز کردن فایل</a>
    </div>
  </main>;
}

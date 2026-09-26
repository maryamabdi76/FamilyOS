import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getHouseholdForUser } from "@/features/household/queries";
import { getDocumentForHousehold } from "@/features/documents/queries";
import {
  documentTypeLabel,
  formatAmount,
  formatFileSize,
  statusLabel,
  type DocumentType,
} from "@/features/documents/types";
import { DocumentProcessingStatus } from "@/features/documents/document-processing-status";
import { getLinkedEntitiesForDocument } from "@/features/documents/processing/queries";
import { getLatestJobForDocument } from "@/features/documents/processing/worker";
import {
  parseAndNormalizeExtraction,
  type NormalizedExtraction,
} from "@/features/documents/extraction-schema";

function parseMetadata(raw: string | null, fallbackType: DocumentType | null): NormalizedExtraction | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parseAndNormalizeExtraction(parsed, fallbackType ?? "OTHER");
  } catch {
    return null;
  }
}

function formatDisplayDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date);
}

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  const household = await getHouseholdForUser(user.id);
  if (!household) redirect("/onboarding");
  const { id } = await params;
  const document = await getDocumentForHousehold(id, household.id);
  if (!document) notFound();

  const [linked, latestJob] = await Promise.all([
    getLinkedEntitiesForDocument(document.id, household.id),
    getLatestJobForDocument(document.id),
  ]);

  const extraction = parseMetadata(document.extractedMetadata, document.documentType);
  const canRetry =
    document.status === "FAILED" &&
    (!latestJob || latestJob.attempts < latestJob.maxAttempts);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/dashboard/documents" className="text-sm text-muted hover:text-foreground">
          بازگشت به اسناد
        </Link>
        <h1 className="mt-3 break-words text-2xl font-semibold">{document.originalFilename}</h1>
      </div>

      <div className="flex flex-wrap gap-2 text-sm text-muted">
        <span className="rounded-full bg-background px-3 py-1">{statusLabel(document.status)}</span>
        <span className="rounded-full bg-background px-3 py-1">{formatFileSize(document.fileSizeBytes)}</span>
        {document.documentType && (
          <span className="rounded-full bg-background px-3 py-1">{documentTypeLabel(document.documentType)}</span>
        )}
      </div>

      <DocumentProcessingStatus
        documentId={document.id}
        status={document.status}
        processingError={document.processingError}
        canRetry={canRetry}
      />

      {(extraction || linked.product) && (
        <section className="rounded-xl border border-border bg-white/60 p-5">
          <h2 className="text-sm font-medium">اطلاعات استخراج‌شده</h2>
          <p className="mt-1 text-xs text-muted">
            این مقادیر توسط سیستم پیشنهاد شده‌اند و ممکن است نیاز به بررسی شما داشته باشند.
          </p>

          {extraction && (
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">نوع سند</dt>
                <dd>{documentTypeLabel(extraction.documentType)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">اطمینان</dt>
                <dd>{Math.round(extraction.confidence * 100)}٪</dd>
              </div>
              {extraction.entities.product && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">محصول</dt>
                  <dd>{extraction.entities.product.name}</dd>
                </div>
              )}
              {extraction.entities.purchase?.price != null && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">مبلغ</dt>
                  <dd>
                    {formatAmount(
                      extraction.entities.purchase.price,
                      extraction.entities.purchase.currency,
                    )}
                  </dd>
                </div>
              )}
              {extraction.entities.purchase?.date && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">تاریخ خرید</dt>
                  <dd>{formatDisplayDate(extraction.entities.purchase.date) ?? extraction.entities.purchase.date}</dd>
                </div>
              )}
              {extraction.entities.purchase?.seller && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">فروشنده</dt>
                  <dd>{extraction.entities.purchase.seller}</dd>
                </div>
              )}
              {extraction.entities.warranty?.durationMonths != null && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">مدت گارانتی</dt>
                  <dd>{extraction.entities.warranty.durationMonths} ماه</dd>
                </div>
              )}
              {extraction.entities.warranty?.expiresAt && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">پایان گارانتی</dt>
                  <dd>
                    {formatDisplayDate(extraction.entities.warranty.expiresAt) ??
                      extraction.entities.warranty.expiresAt}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {linked.product && (
            <div className="mt-5 border-t border-border pt-4 text-sm">
              <p className="font-medium">رکوردهای ذخیره‌شده</p>
              <ul className="mt-2 list-inside list-disc text-muted">
                <li>محصول: {linked.product.name}</li>
                {linked.purchase && (
                  <li>
                    خرید
                    {linked.purchase.amount != null
                      ? ` — ${formatAmount(linked.purchase.amount, linked.purchase.currency)}`
                      : ""}
                    {linked.purchase.purchasedAt
                      ? ` — ${formatDisplayDate(linked.purchase.purchasedAt)}`
                      : ""}
                  </li>
                )}
                {linked.warranty && (
                  <li>
                    گارانتی
                    {linked.warranty.durationMonths != null
                      ? ` — ${linked.warranty.durationMonths} ماه`
                      : ""}
                    {linked.warranty.expiresAt
                      ? ` — تا ${formatDisplayDate(linked.warranty.expiresAt)}`
                      : ""}
                  </li>
                )}
              </ul>
            </div>
          )}
        </section>
      )}

      <div className="rounded-xl border border-border bg-white/60 p-5">
        <p className="text-sm leading-7 text-muted">این فایل با دسترسی محدود خانوار شما ذخیره شده است.</p>
        {document.extractedText && (
          <div className="mt-5 border-t border-border pt-5">
            <h2 className="text-sm font-medium">متن استخراج‌شده</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{document.extractedText}</p>
          </div>
        )}
        <a
          href={`/api/documents/${document.id}/file`}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background"
        >
          باز کردن فایل اصلی
        </a>
      </div>
    </main>
  );
}

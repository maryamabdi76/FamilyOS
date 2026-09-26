"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function DocumentProcessingStatus({
  documentId,
  status,
  processingError,
  canRetry,
}: {
  documentId: string;
  status: "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
  processingError: string | null;
  canRetry: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (status !== "UPLOADED" && status !== "PROCESSING") return;
    const timer = setInterval(() => {
      router.refresh();
    }, 2500);
    return () => clearInterval(timer);
  }, [status, router]);

  function retry() {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/process`, { method: "POST" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "تلاش دوباره انجام نشد");
        router.refresh();
      } catch (retryError) {
        setError(retryError instanceof Error ? retryError.message : "تلاش دوباره انجام نشد");
      }
    });
  }

  if (status === "READY") {
    return (
      <p className="rounded-lg bg-background px-4 py-3 text-sm text-muted">
        آماده شد ✓ — اطلاعات استخراج‌شده را بررسی کنید؛ ممکن است نیاز به اصلاح داشته باشند.
      </p>
    );
  }

  if (status === "PROCESSING" || status === "UPLOADED") {
    return (
      <p className="rounded-lg bg-background px-4 py-3 text-sm text-muted" aria-live="polite">
        {status === "UPLOADED" ? "در صف بررسی..." : "در حال تشخیص اطلاعات..."}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm">
      <p className="font-medium text-red-900">نتونستیم این فایل رو کامل بررسی کنیم.</p>
      <p className="mt-1 text-red-800">فایل شما همچنان ذخیره شده است.</p>
      {processingError && <p className="mt-2 text-red-700">{processingError}</p>}
      {canRetry && (
        <button
          type="button"
          onClick={retry}
          disabled={pending}
          className="mt-3 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {pending ? "در حال تلاش..." : "تلاش دوباره"}
        </button>
      )}
      {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
    </div>
  );
}

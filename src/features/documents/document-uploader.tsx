"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_BYTES } from "./types";

export function DocumentUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"file" | "text">("file");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (mode === "file" && !file) return setError("یک فایل انتخاب کنید.");
    if (mode === "text" && (!title.trim() || !content.trim())) return setError("عنوان و متن را کامل کنید.");
    setSubmitting(true);
    setProgress(20);
    const data = new FormData();
    if (mode === "file" && file) data.append("file", file);
    if (mode === "text") {
      data.append("title", title);
      data.append("text", content);
    }
    try {
      const response = await fetch("/api/documents", { method: "POST", body: data });
      setProgress(90);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "ذخیره انجام نشد");
      setProgress(100);
      setFile(null); setTitle(""); setContent("");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "ذخیره انجام نشد");
    } finally {
      setSubmitting(false);
      setTimeout(() => setProgress(0), 500);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-border bg-white/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <div><h2 className="font-semibold">افزودن به خانواده</h2><p className="mt-1 text-sm text-muted">فقط اضافه کنید؛ دسته‌بندی را بعداً انجام می‌دهیم.</p></div>
        <div className="flex rounded-lg border border-border p-1 text-sm" role="tablist" aria-label="نوع ورودی">
          <button type="button" onClick={() => setMode("file")} className={`rounded-md px-3 py-1.5 ${mode === "file" ? "bg-foreground text-background" : "text-muted"}`}>فایل</button>
          <button type="button" onClick={() => setMode("text")} className={`rounded-md px-3 py-1.5 ${mode === "text" ? "bg-foreground text-background" : "text-muted"}`}>متن</button>
        </div>
      </div>
      {mode === "file" ? (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border px-5 py-8 text-center hover:bg-background">
          <span className="text-sm font-medium">عکس یا PDF را انتخاب کنید</span>
          <span className="text-xs text-muted">JPG، PNG، WEBP یا PDF تا ۲۵ مگابایت</span>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          {file && <span className="text-sm text-accent">{file.name}</span>}
        </label>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm"><span>عنوان</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30" placeholder="مثلاً یادداشت تعمیر ماشین" /></label>
          <label className="flex flex-col gap-1 text-sm"><span>متن</span><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} className="rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30" placeholder="هر چیزی که می‌خواهید یادتان بماند..." /></label>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {progress > 0 && <div className="h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} /></div>}
      <button type="submit" disabled={submitting} className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-50">{submitting ? "در حال ذخیره..." : "ذخیره کردن"}</button>
    </form>
  );
}

import Link from "next/link";
import { formatFileSize, statusLabel, type DocumentListItem } from "./types";

export function DocumentList({ documents }: { documents: DocumentListItem[] }) {
  if (documents.length === 0) return <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted">هنوز سندی اضافه نشده است.</div>;
  return <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-white/50">
    {documents.map((document) => <li key={document.id}>
      <Link href={`/dashboard/documents/${document.id}`} className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-background">
        <div className="min-w-0"><p className="truncate font-medium">{document.originalFilename}</p><p className="mt-1 text-xs text-muted">{formatFileSize(document.fileSizeBytes)} · {new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(document.createdAt))}</p></div>
        <span className="shrink-0 rounded-full bg-background px-2.5 py-1 text-xs text-muted">{statusLabel(document.status)}</span>
      </Link>
    </li>)}
  </ul>;
}

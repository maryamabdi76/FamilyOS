import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";
import { getHouseholdForUser } from "@/features/household/queries";
import { listDocuments } from "@/features/documents/queries";
import { documentUploadSchema, textDocumentSchema } from "@/features/documents/schemas";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_BYTES, isAllowedDocumentType } from "@/features/documents/types";
import { supabaseStorageService } from "@/lib/storage/supabase-storage";

export const runtime = "nodejs";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });
  const household = await getHouseholdForUser(user.id);
  if (!household) return NextResponse.json({ error: "خانواری پیدا نشد" }, { status: 404 });
  return NextResponse.json({ documents: await listDocuments(household.id) });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });
  const household = await getHouseholdForUser(user.id);
  if (!household) return NextResponse.json({ error: "خانواری پیدا نشد" }, { status: 404 });

  const formData = await request.formData();
  const text = formData.get("text");
  const file = formData.get("file");
  let data: Buffer;
  let filename: string;
  let mimeType: string;

  if (typeof text === "string") {
    const parsed = textDocumentSchema.safeParse({ title: formData.get("title"), content: text });
    if (!parsed.success) return NextResponse.json({ error: "عنوان و متن را کامل وارد کنید" }, { status: 400 });
    data = Buffer.from(parsed.data.content, "utf8");
    filename = `${parsed.data.title}.txt`;
    mimeType = "text/plain";
  } else if (file instanceof File) {
    const parsed = documentUploadSchema.safeParse({ filename: file.name, mimeType: file.type, size: file.size });
    if (!parsed.success || !isAllowedDocumentType(file.type)) {
      return NextResponse.json({ error: `فقط فایل‌های ${ALLOWED_DOCUMENT_TYPES.join("، ")} تا حجم ${MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024)} مگابایت پذیرفته می‌شوند` }, { status: 400 });
    }
    data = Buffer.from(await file.arrayBuffer());
    filename = file.name;
    mimeType = file.type;
  } else {
    return NextResponse.json({ error: "فایلی برای بارگذاری انتخاب نشده است" }, { status: 400 });
  }

  const documentId = randomUUID();
  const storageKey = `${household.id}/${documentId}/${filename.replace(/[^\p{L}\p{N}._-]+/gu, "-")}`;
  try {
    await supabaseStorageService.upload({ data, key: storageKey, contentType: mimeType });
    const [document] = await db.insert(documents).values({
      id: documentId,
      ownerId: user.id,
      householdId: household.id,
      originalFilename: filename,
      mimeType,
      storageKey,
      fileSizeBytes: data.byteLength,
      status: "UPLOADED",
      extractedText: mimeType === "text/plain" ? data.toString("utf8") : null,
    }).returning({ id: documents.id });
    if (!document) return NextResponse.json({ error: "سند ذخیره نشد" }, { status: 500 });
    return NextResponse.json({ id: document.id }, { status: 201 });
  } catch (error) {
    try { await supabaseStorageService.delete(storageKey); } catch { /* preserve the original failure */ }
    console.error("Document upload failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "ذخیره فایل انجام نشد. دوباره تلاش کنید." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });
  const household = await getHouseholdForUser(user.id);
  const documentId = request.nextUrl.searchParams.get("id");
  if (!household || !documentId) return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 400 });
  const [document] = await db.select().from(documents).where(and(eq(documents.id, documentId), eq(documents.householdId, household.id))).limit(1);
  if (!document) return NextResponse.json({ error: "سند پیدا نشد" }, { status: 404 });
  await supabaseStorageService.delete(document.storageKey);
  await db.delete(documents).where(eq(documents.id, document.id));
  return NextResponse.json({ success: true });
}

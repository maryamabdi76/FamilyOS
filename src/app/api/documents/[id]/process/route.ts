import { after, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getHouseholdForUser } from "@/features/household/queries";
import { getDocumentForHousehold } from "@/features/documents/queries";
import { enqueueRetryIfAllowed } from "@/features/documents/processing/enqueue";
import { processPendingJobForDocument } from "@/features/documents/processing/worker";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const household = await getHouseholdForUser(user.id);
  if (!household) return NextResponse.json({ error: "خانواری پیدا نشد" }, { status: 404 });

  const { id } = await context.params;
  const document = await getDocumentForHousehold(id, household.id);
  if (!document) return NextResponse.json({ error: "سند پیدا نشد" }, { status: 404 });

  if (document.status === "PROCESSING") {
    return NextResponse.json({ error: "این سند در حال پردازش است." }, { status: 409 });
  }

  if (document.status === "READY") {
    return NextResponse.json({ error: "این سند قبلاً پردازش شده است." }, { status: 409 });
  }

  const result = await enqueueRetryIfAllowed({
    documentId: document.id,
    householdId: household.id,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 429 });
  }

  after(() => {
    void processPendingJobForDocument(document.id);
  });

  return NextResponse.json({ jobId: result.jobId, status: "PROCESSING" });
}

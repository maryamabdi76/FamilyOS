import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getHouseholdForUser } from "@/features/household/queries";
import { getDocumentForHousehold } from "@/features/documents/queries";
import { supabaseStorageService } from "@/lib/storage/supabase-storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });
  const household = await getHouseholdForUser(user.id);
  if (!household) return NextResponse.json({ error: "خانواری پیدا نشد" }, { status: 404 });
  const { id } = await params;
  const document = await getDocumentForHousehold(id, household.id);
  if (!document) return NextResponse.json({ error: "سند پیدا نشد" }, { status: 404 });
  const signedUrl = await supabaseStorageService.getSignedUrl(document.storageKey, { expiresInSeconds: 300 });
  return NextResponse.redirect(signedUrl);
}

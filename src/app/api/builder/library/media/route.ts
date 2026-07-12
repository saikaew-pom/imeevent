import { NextRequest, NextResponse } from "next/server";
import { getProjectLibraryAccess } from "@/lib/builder/libraryAccess";
import { canWrite } from "@/lib/builder/access";
import { listLibraryMedia } from "@/lib/builder/companyLibrary";

// Company library browsing is gated the same as copying (canWrite), not just
// "is a project member" — project membership includes anonymous guest-passcode
// viewers (always role "viewer"), who should see only this project's own Media
// Library, never the company's cross-project shared library.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectLibraryAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't browse the company library." }, { status: 403 });
  }

  const items = await listLibraryMedia(access.companyId);
  return NextResponse.json({ items });
}

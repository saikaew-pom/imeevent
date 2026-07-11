import { NextRequest, NextResponse } from "next/server";
import { getLibraryAccess } from "@/lib/builder/libraryAccess";
import { listLibraryMedia } from "@/lib/builder/companyLibrary";

export async function GET(_req: NextRequest) {
  const access = await getLibraryAccess();
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const media = await listLibraryMedia(access.companyId);
  return NextResponse.json({ isAdmin: access.isAdmin, media });
}

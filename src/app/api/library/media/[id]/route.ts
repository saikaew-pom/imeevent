import { NextRequest, NextResponse } from "next/server";
import { getLibraryAccess } from "@/lib/builder/libraryAccess";
import { deleteLibraryMedia } from "@/lib/builder/companyLibrary";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await getLibraryAccess();
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Only a company admin can remove library items." }, { status: 403 });
  }

  const { id } = await params;
  await deleteLibraryMedia(access.companyId, id);
  return NextResponse.json({ ok: true });
}

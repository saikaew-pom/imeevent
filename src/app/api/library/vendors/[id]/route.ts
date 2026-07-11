import { NextRequest, NextResponse } from "next/server";
import { NewLibraryVendorInput } from "@/data/companyLibrary";
import { getLibraryAccess } from "@/lib/builder/libraryAccess";
import { updateLibraryVendor, deleteLibraryVendor } from "@/lib/builder/companyLibrary";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await getLibraryAccess();
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Only a company admin can edit library items." }, { status: 403 });
  }

  const { id } = await params;
  const { input } = (await req.json()) as { input: NewLibraryVendorInput };
  if (!input?.name || !input.category) {
    return NextResponse.json({ error: "Missing input." }, { status: 400 });
  }

  await updateLibraryVendor(access.companyId, id, input);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await getLibraryAccess();
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Only a company admin can remove library items." }, { status: 403 });
  }

  const { id } = await params;
  await deleteLibraryVendor(access.companyId, id);
  return NextResponse.json({ ok: true });
}

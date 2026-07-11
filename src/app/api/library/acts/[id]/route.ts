import { NextRequest, NextResponse } from "next/server";
import { NewActInput } from "@/data/acts";
import { getLibraryAccess } from "@/lib/builder/libraryAccess";
import { updateLibraryAct, deleteLibraryAct } from "@/lib/builder/companyLibrary";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await getLibraryAccess();
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Only a company admin can edit library items." }, { status: 403 });
  }

  const { id } = await params;
  const { input } = (await req.json()) as { input: NewActInput };
  if (!input?.name) return NextResponse.json({ error: "Missing input." }, { status: 400 });

  await updateLibraryAct(access.companyId, id, input);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await getLibraryAccess();
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Only a company admin can remove library items." }, { status: 403 });
  }

  const { id } = await params;
  await deleteLibraryAct(access.companyId, id);
  return NextResponse.json({ ok: true });
}

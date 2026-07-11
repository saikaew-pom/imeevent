import { NextRequest, NextResponse } from "next/server";
import { NewActInput } from "@/data/acts";
import { getLibraryAccess } from "@/lib/builder/libraryAccess";
import { listLibraryActs, createLibraryAct } from "@/lib/builder/companyLibrary";

export async function GET(_req: NextRequest) {
  const access = await getLibraryAccess();
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const acts = await listLibraryActs(access.companyId);
  return NextResponse.json({ isAdmin: access.isAdmin, acts });
}

export async function POST(req: NextRequest) {
  const access = await getLibraryAccess();
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Only a company admin can add to the library." }, { status: 403 });
  }

  const { input } = (await req.json()) as { input: NewActInput };
  if (!input?.name) return NextResponse.json({ error: "Missing input." }, { status: 400 });

  const act = await createLibraryAct(access.companyId, access.user.id, input);
  return NextResponse.json({ act });
}

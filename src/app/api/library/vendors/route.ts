import { NextRequest, NextResponse } from "next/server";
import { NewLibraryVendorInput } from "@/data/companyLibrary";
import { getLibraryAccess } from "@/lib/builder/libraryAccess";
import { listLibraryVendors, createLibraryVendor } from "@/lib/builder/companyLibrary";

export async function GET(_req: NextRequest) {
  const access = await getLibraryAccess();
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const vendors = await listLibraryVendors(access.companyId);
  return NextResponse.json({ isAdmin: access.isAdmin, vendors });
}

export async function POST(req: NextRequest) {
  const access = await getLibraryAccess();
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Only a company admin can add to the library." }, { status: 403 });
  }

  const { input } = (await req.json()) as { input: NewLibraryVendorInput };
  if (!input?.name || !input.category) {
    return NextResponse.json({ error: "Missing input." }, { status: 400 });
  }

  const vendor = await createLibraryVendor(access.companyId, access.user.id, input);
  return NextResponse.json({ vendor });
}

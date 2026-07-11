import { NextRequest, NextResponse } from "next/server";
import { getLibraryAccess, assertCanCopyToProject } from "@/lib/builder/libraryAccess";
import { copyLibraryMediaToProject } from "@/lib/builder/companyLibrary";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await getLibraryAccess();
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { id } = await params;
  const { projectId } = (await req.json()) as { projectId: string };
  if (!projectId) return NextResponse.json({ error: "Missing target project." }, { status: 400 });

  try {
    await assertCanCopyToProject(access, projectId);
    const asset = await copyLibraryMediaToProject(access.companyId, id, projectId, access.user.id);
    return NextResponse.json({ asset });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Copy failed." },
      { status: 400 }
    );
  }
}

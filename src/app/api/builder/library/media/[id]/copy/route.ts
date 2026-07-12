import { NextRequest, NextResponse } from "next/server";
import { getProjectLibraryAccess } from "@/lib/builder/libraryAccess";
import { canWrite } from "@/lib/builder/access";
import { copyLibraryMediaToProject } from "@/lib/builder/companyLibrary";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { slug } = (await req.json()) as { slug: string };
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectLibraryAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't add items." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const asset = await copyLibraryMediaToProject(access.companyId, id, access.projectId, access.userId);
    return NextResponse.json({ asset });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Copy failed." },
      { status: 400 }
    );
  }
}

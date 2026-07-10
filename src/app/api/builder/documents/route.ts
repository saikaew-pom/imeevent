import { NextRequest, NextResponse } from "next/server";
import { NewDocumentInput } from "@/data/documents";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { listDocuments, createDocument } from "@/lib/builder/documents";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const documents = await listDocuments(access.project.id);
  return NextResponse.json({ role: access.role, documents });
}

export async function POST(req: NextRequest) {
  const { slug, input } = (await req.json()) as { slug: string; input: NewDocumentInput };
  if (!slug || !input?.name || !input?.kind) {
    return NextResponse.json({ error: "Missing slug or document fields." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't add documents." }, { status: 403 });
  }

  const document = await createDocument(access.project.id, access.user.id, input);
  return NextResponse.json({ document });
}

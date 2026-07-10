import { NextRequest, NextResponse } from "next/server";
import { NewTalentInput } from "@/data/talent";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { listTalent, createTalent } from "@/lib/builder/talent";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const talent = await listTalent(access.project.id);
  return NextResponse.json({ role: access.role, talent });
}

export async function POST(req: NextRequest) {
  const { slug, input } = (await req.json()) as { slug: string; input: NewTalentInput };
  if (!slug || !input?.name) {
    return NextResponse.json({ error: "Missing slug or name." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't add talent." }, { status: 403 });
  }

  const talent = await createTalent(access.project.id, access.user.id, input);
  return NextResponse.json({ talent });
}

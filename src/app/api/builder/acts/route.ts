import { NextRequest, NextResponse } from "next/server";
import { NewActInput } from "@/data/acts";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { listCustomActs, createCustomAct } from "@/lib/builder/customActs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const acts = await listCustomActs(access.project.id);
  return NextResponse.json({ role: access.role, acts });
}

export async function POST(req: NextRequest) {
  const { slug, input, baseActId } = (await req.json()) as {
    slug: string;
    input: NewActInput;
    baseActId?: string;
  };
  if (!slug || !input) {
    return NextResponse.json({ error: "Missing slug or input." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't add items." }, { status: 403 });
  }

  const act = await createCustomAct(access.project.id, access.user.id, input, baseActId);
  return NextResponse.json({ act });
}

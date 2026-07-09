import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { getProjectState, setProjectState, STATE_KEYS, StateKey } from "@/lib/builder/projectState";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const state = await getProjectState(access.project.id);
  return NextResponse.json({ role: access.role, ...state });
}

export async function PUT(req: NextRequest) {
  const { slug, key, data } = (await req.json()) as {
    slug: string;
    key: StateKey;
    data: unknown;
  };
  if (!slug || !key || !STATE_KEYS.includes(key)) {
    return NextResponse.json({ error: "Missing or invalid slug/key." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't make changes." }, { status: 403 });
  }

  await setProjectState(access.project.id, key, data, access.user.id);
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { getProjectState, setProjectState } from "@/lib/builder/projectState";
import { generateEventTheme } from "@/lib/builder/theme";
import { EventMeta, EMPTY_EVENT_META } from "@/data/runOfShow";

export async function POST(req: NextRequest) {
  const { slug } = (await req.json()) as { slug: string };
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't generate a theme." }, { status: 403 });
  }

  const state = await getProjectState(access.project.id);
  const meta = (state.meta as EventMeta | null) ?? EMPTY_EVENT_META;

  let theme;
  try {
    theme = await generateEventTheme(meta);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Theme generation failed." },
      { status: 502 }
    );
  }

  await setProjectState(access.project.id, "aiTheme", theme, access.user.id);
  return NextResponse.json({ theme });
}

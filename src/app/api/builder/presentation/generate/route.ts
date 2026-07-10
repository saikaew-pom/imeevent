import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { getProjectState, setProjectState } from "@/lib/builder/projectState";
import { listCustomActs } from "@/lib/builder/customActs";
import { generateSlideForBeat } from "@/lib/builder/presentation";
import { Beat, runOfShow } from "@/data/runOfShow";
import { Slide } from "@/data/slides";

export async function POST(req: NextRequest) {
  const { slug, beatId } = (await req.json()) as { slug: string; beatId: string };
  if (!slug || !beatId) {
    return NextResponse.json({ error: "Missing slug or beatId." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't generate slides." }, { status: 403 });
  }

  const state = await getProjectState(access.project.id);
  const program = (state.program as Beat[] | null) ?? runOfShow;
  const beat = program.find((b) => b.id === beatId);
  if (!beat) return NextResponse.json({ error: "Beat not found." }, { status: 404 });

  const customActs = await listCustomActs(access.project.id);

  let slide: Slide;
  try {
    slide = await generateSlideForBeat(access.project.id, beat, customActs);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Slide generation failed." },
      { status: 502 }
    );
  }

  const existing = ((state.presentation as Slide[] | null) ?? []).filter(
    (s) => s.beatId !== beatId
  );
  const slides = [...existing, slide];
  await setProjectState(access.project.id, "presentation", slides, access.user.id);

  return NextResponse.json({ slide, slides });
}

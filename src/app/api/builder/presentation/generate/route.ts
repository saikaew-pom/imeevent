import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { getProjectState, setProjectState } from "@/lib/builder/projectState";
import { listCustomActs } from "@/lib/builder/customActs";
import {
  generateSlideForBeat,
  generateSlideForStatic,
  STATIC_SLIDE_KEYS,
  StaticSlideKey,
  LineupItemLike,
} from "@/lib/builder/presentation";
import { Beat, runOfShow } from "@/data/runOfShow";
import { Slide } from "@/data/slides";
import { defaultFinancials, FinancialAssumptions } from "@/data/financials";

export async function POST(req: NextRequest) {
  const { slug, beatId, staticKey } = (await req.json()) as {
    slug: string;
    beatId?: string;
    staticKey?: string;
  };
  if (!slug || (!beatId && !staticKey)) {
    return NextResponse.json({ error: "Missing slug or target." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't generate slides." }, { status: 403 });
  }

  const state = await getProjectState(access.project.id);
  const customActs = await listCustomActs(access.project.id);

  let slide: Slide;
  let slideId: string;

  if (staticKey) {
    if (!STATIC_SLIDE_KEYS.includes(staticKey as StaticSlideKey)) {
      return NextResponse.json({ error: "Unknown slide." }, { status: 400 });
    }
    const program = (state.program as Beat[] | null) ?? runOfShow;
    const lineup = (state.lineup as LineupItemLike[] | null) ?? [];
    const financials = (state.financials as FinancialAssumptions | null) ?? defaultFinancials;
    try {
      slide = await generateSlideForStatic(staticKey as StaticSlideKey, {
        program,
        lineup,
        customActs,
        financials,
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Slide generation failed." },
        { status: 502 }
      );
    }
    slideId = staticKey;
  } else {
    const program = (state.program as Beat[] | null) ?? runOfShow;
    const beat = program.find((b) => b.id === beatId);
    if (!beat) return NextResponse.json({ error: "Beat not found." }, { status: 404 });
    try {
      slide = await generateSlideForBeat(access.project.id, beat, customActs);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Slide generation failed." },
        { status: 502 }
      );
    }
    slideId = `beat-${beatId}`;
  }

  const existing = ((state.presentation as Slide[] | null) ?? []).filter(
    (s) => s.id !== slideId
  );
  const slides = [...existing, slide];
  await setProjectState(access.project.id, "presentation", slides, access.user.id);

  return NextResponse.json({ slide, slides });
}

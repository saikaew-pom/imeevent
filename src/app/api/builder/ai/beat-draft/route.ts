import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { getProjectState } from "@/lib/builder/projectState";
import { listCustomActs } from "@/lib/builder/customActs";
import { listTalent } from "@/lib/builder/talent";
import { findAct } from "@/data/acts";
import { Beat, runOfShow } from "@/data/runOfShow";
import { chatMultimodal } from "@/lib/ai/minimax";

function absolute(origin: string, path: string): string {
  return path.startsWith("http") ? path : `${origin}${path}`;
}

export async function POST(req: NextRequest) {
  const { slug, beatId } = (await req.json()) as { slug: string; beatId: string };
  if (!slug || !beatId) {
    return NextResponse.json({ error: "Missing slug or beatId." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't use AI drafting." }, { status: 403 });
  }

  const state = await getProjectState(access.project.id);
  const program = (state.program as Beat[] | null) ?? runOfShow;
  const beat = program.find((b) => b.id === beatId);
  if (!beat) return NextResponse.json({ error: "Beat not found." }, { status: 404 });

  const [customActs, talent] = await Promise.all([
    listCustomActs(access.project.id),
    listTalent(access.project.id),
  ]);

  const linkedActs = (beat.linkedActs ?? [])
    .map((id) => findAct(id, customActs))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const linkedTalent = (beat.linkedTalent ?? [])
    .map((id) => talent.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const origin = req.nextUrl.origin;
  const imageUrls: string[] = [];
  if (beat.media?.photo) imageUrls.push(absolute(origin, beat.media.photo));
  for (const item of beat.gallery ?? []) {
    if (item.type === "image" && imageUrls.length < 4) imageUrls.push(absolute(origin, item.src));
  }

  const actLines = linkedActs.length
    ? linkedActs
        .map((a) => `- ${a.name} (${a.kind}): ${a.description || a.type || "no description"}`)
        .join("\n")
    : "- (none linked yet)";
  const talentLines = linkedTalent.length
    ? linkedTalent
        .map((t) => `- ${t.name}${t.role ? ` (${t.role})` : ""}: ${t.description || "no description"}`)
        .join("\n")
    : "- (none linked yet)";

  const prompt = `You are an event producer's assistant writing the run-of-show notes for one segment ("beat") of a live gala event timeline. Draft a vivid but concise "what happens" description for this beat, matching the tense and style of this real example from the same document: "Doors open. Champagne Ladies (floral champagne-skirt hostesses) serve welcome bubbles; roaming living-statue garden performers; signature photo moment under the JW Garden arch."

Beat: ${beat.segment}
Time: ${beat.time} (${beat.durationMin} min)
Location: ${beat.location}
Lead/cue: ${beat.lead || "(unassigned)"}
Existing draft (may be empty — refine or rewrite it, don't just repeat it verbatim): ${beat.what || "(empty)"}

Linked shows/decor:
${actLines}

Linked talent:
${talentLines}
${imageUrls.length ? "\n(Reference photos are attached — use them for concrete visual detail.)" : ""}

Return ONLY the drafted description text (2-4 sentences, no headings, no quotes, no markdown).`;

  let draft: string;
  try {
    draft = await chatMultimodal(prompt, imageUrls, 400);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed." },
      { status: 502 }
    );
  }

  return NextResponse.json({ draft: draft.replace(/^["']|["']$/g, "").trim() });
}

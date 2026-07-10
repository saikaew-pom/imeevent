import "server-only";
import { Beat, eventMeta } from "@/data/runOfShow";
import { Act, findAct, Placement, PLACEHOLDER_PHOTO } from "@/data/acts";
import { Slide } from "@/data/slides";
import { generateSlideCopy, generateSlideImage } from "@/lib/ai/minimax";
import { getPhotosBucket } from "@/lib/cf";
import { FinancialAssumptions } from "@/data/financials";
import { computePnL } from "@/lib/pnl";
import { finaleConcepts, goldenBloom } from "@/data/finale";
import { thb, pct } from "@/lib/format";

interface SlideCopy {
  title: string;
  subtitle: string;
  body: string;
}

function parseSlideCopy(raw: string, fallbackTitle: string): SlideCopy {
  // Models sometimes wrap JSON in markdown fences despite instructions not to.
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed.title === "string" && typeof parsed.body === "string") {
      return {
        title: parsed.title,
        subtitle: typeof parsed.subtitle === "string" ? parsed.subtitle : "",
        body: parsed.body,
      };
    }
  } catch {
    // fall through to plain-text handling below
  }
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);
  return {
    title: lines[0] || fallbackTitle,
    subtitle: "",
    body: lines.slice(1).join(" ") || cleaned,
  };
}

function buildTextPrompt(beat: Beat, linkedActs: Act[]): string {
  const actLines = linkedActs.length
    ? linkedActs.map((a) => `- ${a.name} (${a.type}, energy ${a.energy ?? "n/a"}/10)`).join("\n")
    : "- (no specific act linked yet)";

  return `You are writing one slide of a client-facing run-of-show presentation for a New Year's Eve gala. Write compelling, concise slide copy for this program segment:

Segment: ${beat.segment}
Time: ${beat.time} (${beat.durationMin} min)
Location: ${beat.location}
Baseline energy: ${beat.energy}/10
Notes: ${beat.what || "(none)"}
Linked shows/elements:
${actLines}

Respond with ONLY a JSON object, no markdown fences, in exactly this shape:
{"title": "short punchy slide title (max 6 words)", "subtitle": "one-line descriptor (max 12 words)", "body": "2-3 sentences of client-facing narrative describing the moment, max 60 words"}`;
}

function buildImagePrompt(beat: Beat, linkedActs: Act[]): string {
  const actDesc = linkedActs.map((a) => a.name).join(", ");
  return `Elegant New Year's Eve gala photography, ${beat.segment}${
    actDesc ? ` featuring ${actDesc}` : ""
  }, ${beat.location}, emerald and gold color palette, warm ambient lighting, luxury resort event, photorealistic, wide shot`;
}

function hasRealPhoto(a: Act): boolean {
  return Boolean(a.photo) && a.photo !== PLACEHOLDER_PHOTO;
}

// Generates (or regenerates) a single slide for one program beat: drafts
// title/subtitle/body via MiniMax text, and — only if the beat has no real
// photo to fall back on — generates + re-hosts an image via MiniMax image gen.
export async function generateSlideForBeat(
  projectId: string,
  beat: Beat,
  customActs: Act[]
): Promise<Slide> {
  const linkedActs = (beat.linkedActs ?? [])
    .map((id) => findAct(id, customActs))
    .filter((a): a is Act => Boolean(a));

  const copyRaw = await generateSlideCopy(buildTextPrompt(beat, linkedActs));
  const copy = parseSlideCopy(copyRaw, beat.segment);

  let imageUrl: string | undefined =
    beat.media?.photo ?? linkedActs.find(hasRealPhoto)?.photo;

  if (!imageUrl) {
    const bytes = await generateSlideImage(buildImagePrompt(beat, linkedActs));
    const bucket = await getPhotosBucket();
    const key = `slides/${projectId}/${beat.id}-${crypto.randomUUID()}.jpg`;
    await bucket.put(key, bytes, { httpMetadata: { contentType: "image/jpeg" } });
    imageUrl = `/api/builder/photo/${key}`;
  }

  return {
    id: `beat-${beat.id}`,
    beatId: beat.id,
    title: copy.title,
    subtitle: copy.subtitle,
    body: copy.body,
    imageUrl,
    aiGenerated: true,
  };
}

// ---- Static (non-beat) slides: Title, Concept/Flow, Lineup, Finale, Numbers ----

export const STATIC_SLIDE_KEYS = ["title", "flow", "lineup", "finale", "numbers"] as const;
export type StaticSlideKey = (typeof STATIC_SLIDE_KEYS)[number];

// Mirrors the {uid, slot, actId} shape of the client's LineupItem, kept as a
// local structural type so this server module never has to import the
// "use client" store just for a type.
export interface LineupItemLike {
  uid: string;
  slot: Placement;
  actId: string;
}

const SLOT_ORDER: Placement[] = ["welcome", "opening", "mid", "finale"];

function orderActs(lineup: LineupItemLike[], custom: Act[]): Act[] {
  const bySlot = (slot: Placement) => lineup.filter((i) => i.slot === slot);
  return SLOT_ORDER.flatMap(bySlot)
    .map((i) => findAct(i.actId, custom))
    .filter((a): a is Act => Boolean(a));
}

export interface StaticSlideContext {
  program: Beat[];
  lineup: LineupItemLike[];
  customActs: Act[];
  financials: FinancialAssumptions;
}

function buildStaticPrompt(key: StaticSlideKey, ctx: StaticSlideContext): string {
  const intro = `You are writing one slide of a client-facing run-of-show presentation for "${eventMeta.title}" at ${eventMeta.venue}, ${eventMeta.date}.`;
  const responseSpec = `Respond with ONLY a JSON object, no markdown fences, in exactly this shape:
{"title": "short punchy slide title (max 8 words)", "subtitle": "one-line descriptor (max 14 words, or empty string if not needed)", "body": "1-3 sentences of client-facing narrative, max 60 words"}`;

  switch (key) {
    case "title": {
      return `${intro}\n\nThis is the OPENING title slide. Event: ${eventMeta.date} · ${eventMeta.timing}. Guests: ${eventMeta.guests}. Theme: ${eventMeta.theme}.\n\nWrite an evocative event title (replacing "JW Gala Garden Night" if you can do better) and a short elegant tagline as the subtitle. Body should be a one-sentence flourish setting the mood, or empty.\n\n${responseSpec}`;
    }
    case "flow": {
      const segments = ctx.program.map((b) => `${b.time} ${b.segment}`).join(", ");
      return `${intro}\n\nThis is the CONCEPT/FLOW slide explaining the shape of the night. Existing concept notes: "${eventMeta.concept}"\nProgram beats in order: ${segments}\n\nWrite a title capturing the night's arc, and body copy (can rework the concept notes) explaining how energy builds across the night.\n\n${responseSpec}`;
    }
    case "lineup": {
      const acts = orderActs(ctx.lineup, ctx.customActs);
      const actLines = acts.length
        ? acts.map((a) => `- ${a.name} (${a.type}, energy ${a.energy ?? "n/a"}/10)`).join("\n")
        : "- (lineup not built yet)";
      const totalDuration = acts.reduce((s, a) => s + a.durationMin, 0);
      return `${intro}\n\nThis is the LINEUP slide. Booked acts, in running order:\n${actLines}\nTotal stage time: ${totalDuration} min across ${acts.length} acts.\n\nWrite a title and short body copy introducing the show lineup as a client would see it (do not restate every act name in the body — the chips do that already).\n\n${responseSpec}`;
    }
    case "finale": {
      return `${intro}\n\nThis is the FINALE slide, spotlighting the closing production number "${goldenBloom.title}". Existing creative brief: "${goldenBloom.concept}"\n\nWrite a punchy title (can rework "${goldenBloom.title}"), a subtitle, and body copy pitching the finale to the client (can rework the creative brief).\n\n${responseSpec}`;
    }
    case "numbers": {
      const pnl = computePnL(ctx.financials, orderActs(ctx.lineup, ctx.customActs).reduce((s, a) => s + a.costTHB, 0));
      return `${intro}\n\nThis is the NUMBERS/P&L slide. Revenue ${thb(pnl.totalRevenue)}, total cost ${thb(pnl.totalCost)}, gross profit ${thb(pnl.grossProfit)}, margin ${pct(pnl.marginPct)}, ${pnl.pax} guests, break-even at ${Math.ceil(pnl.breakEvenQty)} ${pnl.primaryTierName.toLowerCase()}.\n\nWrite a confident title and short body framing the revenue model for the client (the numbers themselves are shown separately as stat cards — do not restate every figure, just the story).\n\n${responseSpec}`;
    }
  }
}

const STATIC_SLIDE_FALLBACK_TITLE: Record<StaticSlideKey, string> = {
  title: eventMeta.title,
  flow: "One rising curve, four peaks",
  lineup: "The lineup",
  finale: goldenBloom.title,
  numbers: "Revenue model at a glance",
};

// Generates (or regenerates) one of the 5 static (non-beat) slides.
export async function generateSlideForStatic(
  key: StaticSlideKey,
  ctx: StaticSlideContext
): Promise<Slide> {
  const prompt = buildStaticPrompt(key, ctx);
  const copyRaw = await generateSlideCopy(prompt);
  const copy = parseSlideCopy(copyRaw, STATIC_SLIDE_FALLBACK_TITLE[key]);

  const imageUrl = key === "finale" ? finaleConcepts[1].image : undefined;

  return {
    id: key,
    title: copy.title,
    subtitle: copy.subtitle,
    body: copy.body,
    imageUrl,
    aiGenerated: true,
  };
}

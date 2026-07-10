import "server-only";
import { Beat } from "@/data/runOfShow";
import { Act, findAct, PLACEHOLDER_PHOTO } from "@/data/acts";
import { Slide } from "@/data/slides";
import { generateSlideCopy, generateSlideImage } from "@/lib/ai/minimax";
import { getPhotosBucket } from "@/lib/cf";

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

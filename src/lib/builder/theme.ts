import "server-only";
import { EventMeta } from "@/data/runOfShow";
import { EventTheme, ThemeColor } from "@/data/theme";
import { generateSlideCopy } from "@/lib/ai/minimax";
import { getProjectTemplate } from "@/data/projectTemplates";

const HEX_RE = /^#[0-9a-f]{6}$/i;
const GENERATION_TIMEOUT_MS = 45_000;

function buildPrompt(meta: EventMeta): string {
  const archetype = meta.eventType ? getProjectTemplate(meta.eventType) : undefined;
  const facts = [
    archetype ? `Event type: ${archetype.name}` : "",
    meta.venue ? `Venue: ${meta.venue}` : "",
    meta.concept ? `Concept: ${meta.concept}` : "",
    meta.theme ? `Existing theme notes: ${meta.theme}` : "",
    meta.guests ? `Guests: ${meta.guests}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a visual designer proposing a cohesive color theme for a live event, based on this brief:

${facts || "(no further details supplied — invent something tasteful and generic for a celebration event)"}

Respond with ONLY a JSON object, no markdown fences, in exactly this shape:
{"name": "a short evocative theme name, max 5 words", "description": "one paragraph (max 50 words) describing the mood, materials and styling this theme evokes", "palette": [{"label": "short color name", "hex": "#RRGGBB"}, ...]}

The palette must have exactly 5 colors, ordered from most to least dominant, each a valid 6-digit hex code.`;
}

function parseTheme(raw: string): EventTheme {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned a theme in an unparseable format.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI returned an invalid theme.");
  }
  const obj = parsed as Record<string, unknown>;
  const name = typeof obj.name === "string" ? obj.name.trim().slice(0, 80) : "";
  const description =
    typeof obj.description === "string" ? obj.description.trim().slice(0, 400) : "";
  const rawPalette = Array.isArray(obj.palette) ? obj.palette : [];
  const palette: ThemeColor[] = rawPalette
    .filter(
      (c): c is { label: unknown; hex: unknown } => Boolean(c) && typeof c === "object"
    )
    .map((c) => ({
      label: typeof c.label === "string" ? c.label.trim().slice(0, 40) : "",
      hex: typeof c.hex === "string" ? c.hex.trim() : "",
    }))
    .filter((c) => HEX_RE.test(c.hex))
    .map((c) => ({ label: c.label || c.hex.toUpperCase(), hex: c.hex.toUpperCase() }))
    .slice(0, 6);

  if (!name || !description || palette.length < 3) {
    throw new Error("AI returned an incomplete theme — try regenerating.");
  }

  return { name, description, palette, generatedAt: new Date().toISOString() };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Theme generation timed out.")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

export async function generateEventTheme(meta: EventMeta): Promise<EventTheme> {
  const raw = await withTimeout(generateSlideCopy(buildPrompt(meta), 500), GENERATION_TIMEOUT_MS);
  return parseTheme(raw);
}

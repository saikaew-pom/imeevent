import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/builder/access";
import { listMediaAssets } from "@/lib/builder/media";
import { generateSlideCopy } from "@/lib/ai/minimax";

function buildPrompt(query: string, items: { id: string; name: string; kind: string }[]): string {
  const list = items.map((i) => `${i.id}: "${i.name}" [${i.kind}]`).join("\n");
  return `You are search-assisting a user in a media library of event-planning photos, videos, songs and reference links. They typed a search query that may not literally appear in any item's name — use synonyms, related concepts, and reasonable guesses about what they mean.

Search query: "${query}"

Library items (id: "name" [kind]):
${list}

Respond with ONLY a JSON array of the ids that are genuinely relevant matches, ordered most relevant first, max 20 ids. Return [] if nothing is a reasonable match. No markdown fences, no explanation — just the JSON array.`;
}

export async function POST(req: NextRequest) {
  const { slug, query } = (await req.json()) as { slug: string; query: string };
  if (!slug || !query?.trim()) {
    return NextResponse.json({ error: "Missing slug or query." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const assets = await listMediaAssets(access.project.id);
  if (assets.length === 0) return NextResponse.json({ ids: [] });

  let raw: string;
  try {
    raw = await generateSlideCopy(
      buildPrompt(
        query.trim(),
        assets.map((a) => ({ id: a.id, name: a.name, kind: a.kind }))
      )
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI search failed." },
      { status: 502 }
    );
  }

  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  let ids: string[] = [];
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) ids = parsed.filter((x): x is string => typeof x === "string");
  } catch {
    ids = [];
  }

  const validIds = new Set(assets.map((a) => a.id));
  return NextResponse.json({ ids: ids.filter((id) => validIds.has(id)) });
}

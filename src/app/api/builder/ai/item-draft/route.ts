import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { chatMultimodal } from "@/lib/ai/minimax";

type ItemDraftKind = "show" | "decor" | "talent";

function absolute(origin: string, path: string): string {
  return path.startsWith("http") ? path : `${origin}${path}`;
}

export async function POST(req: NextRequest) {
  const { slug, kind, name, subtitle, photoUrl } = (await req.json()) as {
    slug: string;
    kind: ItemDraftKind;
    name: string;
    subtitle?: string;
    photoUrl?: string;
  };
  if (!slug || !kind || !name?.trim()) {
    return NextResponse.json({ error: "Missing slug, kind, or name." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't use AI drafting." }, { status: 403 });
  }

  const imageUrls = photoUrl ? [absolute(req.nextUrl.origin, photoUrl)] : [];

  const prompt =
    kind === "talent"
      ? `Write a short, professional 1-2 sentence bio for this event talent/vendor, for use in an event planner's builder library. Name: "${name}". Role: "${subtitle || "unspecified"}".${imageUrls.length ? " A reference photo is attached — use it for concrete detail." : ""} Return ONLY the bio text, no quotes, no markdown.`
      : `Write a vivid, concise 1-2 sentence description for this event ${kind === "show" ? "show/act" : "decor/element"}, for use in an event planner's builder library. Name: "${name}". Type: "${subtitle || "unspecified"}".${imageUrls.length ? " A reference photo is attached — use it for concrete visual detail." : ""} Return ONLY the description text, no quotes, no markdown.`;

  let draft: string;
  try {
    draft = await chatMultimodal(prompt, imageUrls, 200);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed." },
      { status: 502 }
    );
  }

  return NextResponse.json({ draft: draft.replace(/^["']|["']$/g, "").trim() });
}

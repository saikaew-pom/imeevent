import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { getDocumentContext } from "@/lib/builder/documents";
import { listTasks } from "@/lib/builder/tasks";
import { chatMultimodal } from "@/lib/ai/minimax";
import { SuggestedTask } from "@/data/documents";
import { CATEGORY_LABELS, TaskCategory } from "@/data/tasks";

const VALID_CATEGORIES = Object.keys(CATEGORY_LABELS) as TaskCategory[];
const PER_DOC_CHARS = 5000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
  const { slug } = (await req.json()) as { slug: string };
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't run AI suggestions." }, { status: 403 });
  }

  const docs = await getDocumentContext(access.project.id);
  if (docs.length === 0) {
    return NextResponse.json({ error: "Add a document first." }, { status: 400 });
  }

  const tasks = await listTasks(access.project.id);
  const eventDate = access.project.eventDate ?? "unknown";
  const today = new Date().toISOString().slice(0, 10);

  // Assemble text docs into the prompt; collect public image URLs for vision.
  const textDocs = docs.filter((d) => d.textContent);
  const imageDocs = docs.filter((d) => d.kind === "image" && d.fileKey);
  const imageUrls = imageDocs.map((d) => `${req.nextUrl.origin}/api/builder/photo/${d.fileKey}`);

  const docText = textDocs
    .map((d) => `### Document: ${d.name}\n${(d.textContent ?? "").slice(0, PER_DOC_CHARS)}`)
    .join("\n\n");

  const existing = tasks.length
    ? tasks.map((t) => `- ${t.title} [${t.category}]${t.dueDate ? ` (due ${t.dueDate})` : ""}`).join("\n")
    : "(none yet)";

  const prompt = `You are an event planning assistant. Read the attached documents (contracts, quotes, briefs) and propose prep tasks the planner should add to their timeline.

Today: ${today}
Event date: ${eventDate}

Existing tasks (do NOT duplicate these):
${existing}

Documents:
${docText || "(see attached images)"}

Return ONLY a JSON array (no markdown fences) of up to 8 NEW tasks derived from the documents — deadlines, deliverables, payments, or obligations the documents imply that are not already covered. Each item exactly:
{"title": "short actionable task", "category": "one of: ${VALID_CATEGORIES.join(", ")}", "description": "1 sentence, cite the document/detail", "dueDate": "YYYY-MM-DD or null"}
If a document states or implies a deadline, use it for dueDate; otherwise null. If the documents imply nothing new, return [].`;

  let raw: string;
  try {
    raw = await chatMultimodal(prompt, imageUrls, 1800);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed." },
      { status: 502 }
    );
  }

  const suggestions = parseSuggestions(raw);
  return NextResponse.json({ suggestions });
}

function parseSuggestions(raw: string): SuggestedTask[] {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  let arr: unknown;
  try {
    arr = JSON.parse(cleaned);
  } catch {
    // Try to salvage the first JSON array in the text.
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (!m) return [];
    try {
      arr = JSON.parse(m[0]);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map((x) => {
      const category = typeof x.category === "string" && VALID_CATEGORIES.includes(x.category as TaskCategory)
        ? (x.category as string)
        : "general";
      const dueDate = typeof x.dueDate === "string" && DATE_RE.test(x.dueDate) ? x.dueDate : null;
      return {
        title: typeof x.title === "string" ? x.title.slice(0, 200) : "",
        description: typeof x.description === "string" ? x.description.slice(0, 500) : "",
        category,
        dueDate,
      };
    })
    .filter((s) => s.title.trim().length > 0)
    .slice(0, 8);
}

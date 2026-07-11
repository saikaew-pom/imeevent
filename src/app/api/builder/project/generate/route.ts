import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  getProjectTemplate,
  generateProjectSetup,
  buildOverlayPrompt,
  parseAIOverlay,
  ProjectBriefInput,
} from "@/data/projectTemplates";
import { generateSlideCopy } from "@/lib/ai/minimax";

const OVERLAY_MAX_TOKENS = 2200;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Preview-only: runs before any project exists, so there's nothing to
// authorize beyond "is someone signed in" — matches the self-serve creation
// action. Never writes to the database. AI is an enhancer, never a
// gatekeeper: any failure (network, auth, malformed JSON) returns ok:false
// with no overlay, and the wizard falls back to the plain skeleton silently.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    templateId?: string;
    eventDate?: string;
    notes?: string;
    brief?: ProjectBriefInput;
  } | null;

  const templateId = body?.templateId;
  const template = templateId ? getProjectTemplate(templateId) : undefined;
  if (!template || !body?.brief) {
    return NextResponse.json({ error: "Missing or unknown template/brief." }, { status: 400 });
  }
  const eventDate = body.eventDate ?? "";
  if (template.days.length > 0 && !DATE_RE.test(eventDate)) {
    return NextResponse.json({ error: "A valid event date is required." }, { status: 400 });
  }

  const setup = generateProjectSetup(template, eventDate, body.brief);

  try {
    const prompt = buildOverlayPrompt(template, setup, body.brief, body.notes ?? "");
    const raw = await generateSlideCopy(prompt, OVERLAY_MAX_TOKENS);
    const overlay = parseAIOverlay(raw, setup.program.length);
    return NextResponse.json({ ok: true, overlay });
  } catch {
    return NextResponse.json({ ok: false, overlay: null });
  }
}

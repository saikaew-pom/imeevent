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
import { generateEventTheme } from "@/lib/builder/theme";
import { EventTheme } from "@/data/theme";

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
  const brief = body?.brief;
  if (!template || !brief) {
    return NextResponse.json({ error: "Missing or unknown template/brief." }, { status: 400 });
  }
  const eventDate = body?.eventDate ?? "";
  if (template.days.length > 0 && !DATE_RE.test(eventDate)) {
    return NextResponse.json({ error: "A valid event date is required." }, { status: 400 });
  }

  const setup = generateProjectSetup(template, eventDate, brief);

  // Overlay and theme are independent AI calls — run them in parallel rather
  // than sequentially (the theme prompt uses the plain brief-derived concept
  // instead of waiting for the overlay's richer one) so total wait time is
  // whichever is slower, not the sum of both. Each fails independently: one
  // succeeding is enough to show the user something, and every failure is
  // logged so a bad response is visible in `wrangler tail` instead of just
  // silently vanishing.
  const [overlay, theme] = await Promise.all([
    (async () => {
      try {
        const prompt = buildOverlayPrompt(template, setup, brief, body?.notes ?? "");
        const raw = await generateSlideCopy(prompt, OVERLAY_MAX_TOKENS);
        return parseAIOverlay(raw, setup.program.length);
      } catch (e) {
        console.error("Project overlay generation failed:", e);
        return null;
      }
    })(),
    generateEventTheme(setup.meta).catch((e) => {
      console.error("Project theme generation failed:", e);
      return null as EventTheme | null;
    }),
  ]);

  return NextResponse.json({ ok: Boolean(overlay || theme), overlay, theme });
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createProject, setProjectEventDate } from "@/lib/auth/queries";
import { setProjectState } from "@/lib/builder/projectState";
import { createTasksBulk, BulkTaskInput } from "@/lib/builder/tasks";
import { getEventPreset, offsetToDate } from "@/data/eventPresets";
import {
  getProjectTemplate,
  generateProjectSetup,
  applyAIOverlay,
  parseAIOverlay,
  BudgetPosture,
} from "@/data/projectTemplates";
import { CURRENCIES, CurrencyCode } from "@/lib/format";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Self-serve project creation via the archetype wizard: pick a shape (Step 1),
// answer the 5W brief (Step 2), optionally preview an AI-enriched version
// (Step 3 — a separate, read-only preview call; nothing is written until this
// action runs). This action writes the final setup — meta, program,
// financials, imported task preset and starter-doc checklist — and lands the
// creator straight on the new project's dashboard.
//
// The AI overlay (if the client attaches one) is re-validated from scratch
// here against the setup freshly generated from THIS submission's brief —
// never trusted as-is, and safely discarded (falling back to the plain
// skeleton) if the brief changed after the preview was generated.
export async function createProjectFromTemplateAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("A project name is required.");

  const templateId = String(formData.get("templateId") ?? "");
  const template = getProjectTemplate(templateId);
  if (!template) throw new Error("Unknown project template.");

  const eventDate = String(formData.get("eventDate") ?? "").trim();
  if (template.days.length > 0 && !DATE_RE.test(eventDate)) {
    throw new Error("A valid event date is required.");
  }

  const venue = String(formData.get("venue") ?? "").trim();
  const headcount = Number(formData.get("headcount") ?? 0) || 0;
  const objective = String(formData.get("objective") ?? "").trim();

  const budgetPostureRaw = String(formData.get("budgetPosture") ?? "standard");
  const budgetPosture: BudgetPosture =
    budgetPostureRaw === "lean" || budgetPostureRaw === "premium" ? budgetPostureRaw : "standard";

  const currencyRaw = String(formData.get("currency") ?? template.defaultCurrency);
  const currency: CurrencyCode = CURRENCIES.some((c) => c.code === currencyRaw)
    ? (currencyRaw as CurrencyCode)
    : template.defaultCurrency;

  const activeDayLabels = formData.getAll("activeDays").map(String);

  const answers: Record<string, string> = {};
  for (const q of template.brief) {
    const v = formData.get(q.id);
    if (v != null && String(v).trim()) answers[q.id] = String(v).trim();
  }

  const project = await createProject({ name, ownerId: user.id });

  const baseSetup = generateProjectSetup(template, eventDate || "2026-01-01", {
    venue,
    headcount,
    objective,
    budgetPosture,
    currency,
    activeDayLabels,
    answers,
  });

  // The wizard's two submit buttons carry this intent so a stale/regenerated
  // overlay sitting in the hidden field is only ever applied when the user
  // actually clicked "Use this setup" — clicking "Skip AI" always ignores it.
  const intent = String(formData.get("intent") ?? "skip");
  const aiOverlayRaw = String(formData.get("aiOverlay") ?? "").trim();
  const overlay =
    intent === "use-ai" && aiOverlayRaw ? parseAIOverlay(aiOverlayRaw, baseSetup.program.length) : null;
  const setup = applyAIOverlay(baseSetup, overlay);

  await Promise.all([
    setProjectState(project.id, "meta", setup.meta, user.id),
    setProjectState(project.id, "program", setup.program, user.id),
    setProjectState(project.id, "financials", setup.financials, user.id),
  ]);

  const rows: BulkTaskInput[] = [];
  if (setup.taskPresetId) {
    const preset = getEventPreset(setup.taskPresetId);
    if (preset) {
      // Same ordering as the manual preset-import route: chronological by due
      // date so sort_order reads naturally within each category group.
      const sortKey = (t: (typeof preset.tasks)[number]) =>
        t.dueOffsetDays ?? t.startOffsetDays ?? -Infinity;
      const ordered = [...preset.tasks].sort((a, b) => sortKey(b) - sortKey(a));
      for (const tpl of ordered) {
        rows.push({
          title: tpl.title,
          description: tpl.description,
          category: tpl.category,
          status: tpl.status ?? "todo",
          startDate: offsetToDate(eventDate, tpl.startOffsetDays),
          dueDate: offsetToDate(eventDate, tpl.dueOffsetDays),
          assigneeId: null,
          sortOrder: rows.length,
        });
      }
    }
  }
  for (const doc of setup.starterDocs) {
    rows.push({
      title: `Collect: ${doc}`,
      description: "",
      category: "general",
      status: "todo",
      startDate: null,
      dueDate: null,
      assigneeId: null,
      sortOrder: rows.length,
    });
  }
  for (const t of setup.aiTasks ?? []) {
    rows.push({
      title: t.title,
      description: t.description,
      category: t.category,
      status: "todo",
      startDate: null,
      dueDate: null,
      assigneeId: null,
      sortOrder: rows.length,
    });
  }
  if (rows.length > 0) {
    await createTasksBulk(project.id, user.id, rows);
  }

  if (eventDate) {
    await setProjectEventDate(project.id, eventDate);
  }

  revalidatePath("/projects");
  redirect(`/p/${project.slug}/dashboard`);
}

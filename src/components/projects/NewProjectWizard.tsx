"use client";

import { useRef, useState } from "react";
import {
  PROJECT_TEMPLATES,
  ProjectTemplate,
  templateSparkline,
  generateProjectSetup,
  applyAIOverlay,
  GeneratedProjectSetup,
  AIOverlay,
  ProjectBriefInput,
  BudgetPosture,
} from "@/data/projectTemplates";
import { getEventPreset } from "@/data/eventPresets";
import { EventTheme } from "@/data/theme";
import { CURRENCIES, CurrencyCode, money } from "@/lib/format";
import { ink, sub, border, hoverBg, accentBg } from "@/lib/notionTheme";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formDataToBrief(fd: FormData, template: ProjectTemplate): ProjectBriefInput {
  const budgetPostureRaw = String(fd.get("budgetPosture") ?? "standard");
  const budgetPosture: BudgetPosture =
    budgetPostureRaw === "lean" || budgetPostureRaw === "premium" ? budgetPostureRaw : "standard";
  const currencyRaw = String(fd.get("currency") ?? template.defaultCurrency);
  const currency: CurrencyCode = CURRENCIES.some((c) => c.code === currencyRaw)
    ? (currencyRaw as CurrencyCode)
    : template.defaultCurrency;
  const answers: Record<string, string> = {};
  for (const q of template.brief) {
    const v = fd.get(q.id);
    if (v != null && String(v).trim()) answers[q.id] = String(v).trim();
  }
  return {
    venue: String(fd.get("venue") ?? "").trim(),
    headcount: Number(fd.get("headcount") ?? 0) || 0,
    objective: String(fd.get("objective") ?? "").trim(),
    budgetPosture,
    currency,
    activeDayLabels: fd.getAll("activeDays").map(String),
    answers,
  };
}

function Sparkline({ energies }: { energies: number[] }) {
  if (energies.length === 0) {
    return (
      <div
        className="h-[34px] flex items-center text-[11px]"
        style={{ color: sub }}
      >
        No preset program — build it yourself.
      </div>
    );
  }
  const w = 260;
  const h = 34;
  const step = energies.length > 1 ? w / (energies.length - 1) : 0;
  const points = energies
    .map((e, i) => `${(i * step).toFixed(1)},${(h - (e / 10) * h).toFixed(1)}`)
    .join(" ");
  const peakIdx = energies.indexOf(Math.max(...energies));
  const peakX = peakIdx * step;
  const peakY = h - (energies[peakIdx] / 10) * h;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-hidden>
      <line x1={0} y1={h} x2={w} y2={h} stroke={border} strokeWidth={1} />
      <polyline points={points} fill="none" stroke="#1F7D57" strokeWidth={2} />
      <circle cx={peakX} cy={peakY} r={3.5} fill="#A97F2E" />
    </svg>
  );
}

function TemplateCard({
  template,
  onPick,
}: {
  template: ProjectTemplate;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="text-left rounded-[10px] p-4 transition-colors flex flex-col gap-2"
      style={{ border: `1px solid ${border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[14.5px] font-semibold">
          {template.icon} {template.name}
        </span>
        <span className="text-[10.5px] uppercase tracking-wide shrink-0" style={{ color: sub }}>
          {template.shape}
        </span>
      </div>
      <Sparkline energies={templateSparkline(template)} />
      <p className="text-[12.5px]" style={{ color: sub }}>
        {template.description}
      </p>
      {template.leadLabel && (
        <span className="text-[11px]" style={{ color: sub }}>
          {template.leadLabel}
        </span>
      )}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="text-[12px] font-medium block mb-1" style={{ color: sub }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = { border: `1px solid ${border}` };
const inputClass = "text-[13.5px] rounded-[6px] px-3 py-2 w-full";

interface Preview {
  setup: GeneratedProjectSetup;
  overlay: AIOverlay | null;
  theme: EventTheme | null;
}

function PreviewPanel({ template, preview }: { template: ProjectTemplate; preview: Preview }) {
  const { setup, theme } = preview;
  const byDay = new Map<number, typeof setup.program>();
  for (const b of setup.program) {
    const d = b.day ?? 1;
    byDay.set(d, [...(byDay.get(d) ?? []), b]);
  }
  const presetTaskCount = setup.taskPresetId ? getEventPreset(setup.taskPresetId)?.tasks.length ?? 0 : 0;
  const taskCount = presetTaskCount + setup.starterDocs.length + (setup.aiTasks?.length ?? 0);
  const totalRevenue = setup.financials.tiers.reduce((s, t) => s + t.priceTHB * t.qty, 0);

  return (
    <div
      className="rounded-[8px] p-4 space-y-3"
      style={{ border: `1px solid ${border}`, background: hoverBg }}
    >
      <div>
        <span className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: sub }}>
          ✨ AI proposal
        </span>
        {setup.meta.concept && (
          <p className="text-[13.5px] mt-1 italic" style={{ color: ink }}>
            “{setup.meta.concept}”
          </p>
        )}
      </div>

      {setup.meta.date && (
        <p className="text-[12px]" style={{ color: sub }}>
          {setup.meta.date}
          {setup.meta.timing ? ` · ${setup.meta.timing}` : ""}
        </p>
      )}

      {theme && (
        <div>
          <span className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: sub }}>
            Suggested theme
          </span>
          <p className="text-[13px] font-semibold mt-1" style={{ color: ink }}>
            {theme.name}
          </p>
          <p className="text-[12.5px] mt-0.5" style={{ color: sub }}>
            {theme.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {theme.palette.map((c) => (
              <span
                key={c.hex}
                className="w-4 h-4 rounded-full shrink-0 inline-block"
                title={`${c.label} · ${c.hex}`}
                style={{ background: c.hex, border: "1px solid rgba(0,0,0,0.15)" }}
              />
            ))}
          </div>
        </div>
      )}

      {byDay.size > 0 && (
        <div className="space-y-2">
          {Array.from(byDay.entries()).map(([day, blocks]) => (
            <div key={day}>
              {byDay.size > 1 && (
                <div className="text-[11px] font-semibold mb-0.5" style={{ color: sub }}>
                  Day {day}
                </div>
              )}
              <ul className="text-[12.5px] space-y-0.5" style={{ color: ink }}>
                {blocks.map((b) => (
                  <li key={b.id}>
                    <span style={{ color: sub }}>{b.time}</span> — {b.segment}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]" style={{ color: sub }}>
        <span>{taskCount} starting tasks</span>
        {setup.financials.tiers.length > 0 && (
          <span>Est. revenue {money(totalRevenue, setup.financials.currency ?? template.defaultCurrency)}</span>
        )}
      </div>

      {setup.aiTasks && setup.aiTasks.length > 0 && (
        <div>
          <span className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: sub }}>
            Extra suggested tasks
          </span>
          <ul className="text-[12.5px] mt-1 space-y-0.5" style={{ color: ink }}>
            {setup.aiTasks.map((t, i) => (
              <li key={i}>· {t.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function NewProjectWizard({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const template = PROJECT_TEMPLATES.find((t) => t.id === templateId) ?? null;
  const optionalDays = template?.days.filter((d) => d.optional) ?? [];

  const close = () => {
    setOpen(false);
    setStep(1);
    setTemplateId(null);
    setPreview(null);
    setAiError(null);
  };

  const runGenerate = async () => {
    if (!template || !formRef.current) return;
    const fd = new FormData(formRef.current);
    const eventDate = String(fd.get("eventDate") ?? "").trim();
    if (template.days.length > 0 && !DATE_RE.test(eventDate)) {
      setAiError("Pick a start date first.");
      return;
    }
    setAiError(null);
    setAiLoading(true);
    setPreview(null);
    try {
      const brief = formDataToBrief(fd, template);
      const notes = String(fd.get("notes") ?? "");
      const res = await fetch("/api/builder/project/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, eventDate, notes, brief }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        overlay: AIOverlay | null;
        theme: EventTheme | null;
      };
      if (data.ok) {
        const setup = applyAIOverlay(generateProjectSetup(template, eventDate, brief), data.overlay);
        setPreview({ setup, overlay: data.overlay, theme: data.theme });
      } else {
        setAiError("Couldn't generate right now — you can still create with the standard template below.");
      }
    } catch {
      setAiError("Couldn't generate right now — you can still create with the standard template below.");
    } finally {
      setAiLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[13.5px] font-medium rounded-[8px] px-4 py-3 mb-8 w-full text-left"
        style={{ border: `1px dashed ${border}`, color: sub }}
      >
        + New project — pick a shape (meeting, wedding, gala, incentive trip…) and answer a
        short brief
      </button>
    );
  }

  return (
    <div className="rounded-[10px] p-5 mb-8" style={{ border: `1px solid ${border}` }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-semibold" style={{ color: ink }}>
          {step === 1 ? "Step 1 · Pick the shape" : `Step 2 · ${template?.name} — the brief`}
        </span>
        <button
          type="button"
          onClick={close}
          className="text-[12.5px]"
          style={{ color: sub }}
        >
          Cancel
        </button>
      </div>

      {step === 1 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {PROJECT_TEMPLATES.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onPick={() => {
                setTemplateId(t.id);
                setStep(2);
              }}
            />
          ))}
        </div>
      )}

      {step === 2 && template && (
        <form action={action} ref={formRef} className="space-y-4">
          <input type="hidden" name="templateId" value={template.id} />
          <input type="hidden" name="aiOverlay" value={preview?.overlay ? JSON.stringify(preview.overlay) : ""} />
          <input type="hidden" name="aiTheme" value={preview?.theme ? JSON.stringify(preview.theme) : ""} />

          <Field label="Project name" htmlFor="np-name">
            <input
              id="np-name"
              name="name"
              required
              maxLength={80}
              placeholder={
                template.id === "wedding" || template.id === "indian-wedding"
                  ? "e.g. Sarah & Tom Wedding"
                  : `e.g. ${template.name}`
              }
              className={inputClass}
              style={inputStyle}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={template.days.length > 0 ? "Start date" : "Date (optional)"} htmlFor="np-date">
              <input
                id="np-date"
                type="date"
                name="eventDate"
                required={template.days.length > 0}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Venue / setting" htmlFor="np-venue">
              <input
                id="np-venue"
                name="venue"
                placeholder="e.g. JW Marriott Phuket"
                className={inputClass}
                style={inputStyle}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={`${template.guestLabel} count`} htmlFor="np-headcount">
              <input
                id="np-headcount"
                type="number"
                name="headcount"
                min={1}
                defaultValue={
                  template.tiers.reduce((s, t) => s + t.qty, 0) || 50
                }
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Currency" htmlFor="np-currency">
              <select
                id="np-currency"
                name="currency"
                defaultValue={template.defaultCurrency}
                className={inputClass}
                style={inputStyle}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Objective — one line (WHY this event)" htmlFor="np-objective">
            <textarea
              id="np-objective"
              name="objective"
              rows={2}
              placeholder="e.g. Celebrate the year and thank top clients"
              className={inputClass}
              style={inputStyle}
            />
          </Field>

          <Field label="Budget posture" htmlFor="np-budget">
            <select
              id="np-budget"
              name="budgetPosture"
              defaultValue="standard"
              className={inputClass}
              style={inputStyle}
            >
              <option value="lean">Lean</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </Field>

          {optionalDays.length > 0 && (
            <div>
              <span className="text-[12px] font-medium block mb-1.5" style={{ color: sub }}>
                Which days apply?
              </span>
              <div className="space-y-1.5">
                {template.days
                  .filter((d) => !d.optional)
                  .map((d) => (
                    <div key={d.label} className="text-[13px]" style={{ color: sub }}>
                      ✓ {d.label} <span style={{ color: sub }}>(always included)</span>
                    </div>
                  ))}
                {optionalDays.map((d) => (
                  <label key={d.label} className="flex items-center gap-2 text-[13px]">
                    <input type="checkbox" name="activeDays" value={d.label} defaultChecked />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <Field label="Anything else about this event? (optional — this is what the AI uses)" htmlFor="np-notes">
            <textarea
              id="np-notes"
              name="notes"
              rows={2}
              placeholder="e.g. Casual outdoor vibe, lots of kids, avoid loud fireworks"
              className={inputClass}
              style={inputStyle}
            />
          </Field>

          {template.brief.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {template.brief.map((q) => (
                <Field key={q.id} label={q.label} htmlFor={`np-${q.id}`}>
                  {q.type === "select" ? (
                    <select id={`np-${q.id}`} name={q.id} className={inputClass} style={inputStyle}>
                      {(q.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`np-${q.id}`}
                      type={q.type === "number" ? "number" : "text"}
                      name={q.id}
                      placeholder={q.placeholder}
                      className={inputClass}
                      style={inputStyle}
                    />
                  )}
                </Field>
              ))}
            </div>
          )}

          {aiError && (
            <p className="text-[12.5px]" style={{ color: "#b45309" }}>
              {aiError}
            </p>
          )}

          {preview && <PreviewPanel template={template} preview={preview} />}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setPreview(null);
                setAiError(null);
              }}
              className="text-[13px] rounded-[6px] px-3 py-2"
              style={{ border: `1px solid ${border}`, color: sub }}
            >
              ← Back
            </button>

            {!preview && (
              <button
                type="button"
                onClick={runGenerate}
                disabled={aiLoading}
                className="text-[13.5px] font-medium rounded-[6px] px-4 py-2"
                style={{ border: `1px solid ${border}`, color: ink, opacity: aiLoading ? 0.6 : 1 }}
              >
                {aiLoading ? "Generating…" : "✨ Generate with AI"}
              </button>
            )}

            {preview && (
              <>
                <button
                  type="submit"
                  name="intent"
                  value="use-ai"
                  className="text-[13.5px] font-medium rounded-[6px] px-4 py-2"
                  style={{ background: accentBg, color: "#fff" }}
                >
                  Use this setup
                </button>
                <button
                  type="button"
                  onClick={runGenerate}
                  disabled={aiLoading}
                  className="text-[13px] rounded-[6px] px-3 py-2"
                  style={{ border: `1px solid ${border}`, color: sub, opacity: aiLoading ? 0.6 : 1 }}
                >
                  {aiLoading ? "Regenerating…" : "Regenerate"}
                </button>
              </>
            )}

            <button
              type="submit"
              name="intent"
              value="skip"
              className="text-[13px] rounded-[6px] px-3 py-2 ml-auto"
              style={{ color: sub }}
            >
              Skip AI, use the standard template
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

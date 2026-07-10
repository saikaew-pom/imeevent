"use client";

import { ProjectTask, CATEGORY_LABELS, TaskCategory } from "@/data/tasks";

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  venue: "var(--gold-bright)",
  fnb: "var(--emerald-bright)",
  entertainment: "#c98fd9",
  marketing: "#8fb8d9",
  finance: "#d9a68f",
  general: "var(--text-faint)",
};

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 86400000;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function GanttChart({
  tasks,
  eventDate,
}: {
  tasks: ProjectTask[];
  eventDate: string | null;
}) {
  const EVENT_DATE = eventDate ? new Date(`${eventDate}T00:00:00Z`) : null;
  const dated = tasks.filter((t) => t.dueDate);
  const undated = tasks.filter((t) => !t.dueDate);

  if (dated.length === 0) {
    return (
      <div className="panel px-6 py-10 text-center text-[13px] text-[var(--text-faint)]">
        No tasks have a due date yet — add one to see it plotted here.
      </div>
    );
  }

  const today = new Date();
  const anchorTimes = [today.getTime(), ...(EVENT_DATE ? [EVENT_DATE.getTime()] : [])];
  const allDates = dated.flatMap((t) =>
    [t.startDate, t.dueDate].filter(Boolean).map((d) => new Date(d as string))
  );
  const rangeStart = new Date(
    Math.min(...anchorTimes, ...allDates.map((d) => d.getTime()))
  );
  const rangeEnd = new Date(
    Math.max(...anchorTimes, ...allDates.map((d) => d.getTime()))
  );
  // Pad both ends by a few days so bars/markers never sit flush on the edge.
  rangeStart.setDate(rangeStart.getDate() - 3);
  rangeEnd.setDate(rangeEnd.getDate() + 3);
  const totalDays = Math.max(1, daysBetween(rangeStart, rangeEnd));
  const pct = (d: Date) => (daysBetween(rangeStart, d) / totalDays) * 100;
  const todayPct = pct(today);
  const eventPct = EVENT_DATE ? pct(EVENT_DATE) : null;

  // Month gridlines across the range.
  const months: { label: string; pct: number }[] = [];
  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  while (cursor <= rangeEnd) {
    months.push({ label: monthLabel(cursor), pct: pct(cursor) });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const grouped = dated.reduce<Record<string, ProjectTask[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="panel px-2 py-4 overflow-x-auto">
      <div style={{ minWidth: 900, position: "relative" }}>
        {/* Month header */}
        <div className="relative h-6 mb-2 ml-40">
          {months.map((m, i) => (
            <span
              key={i}
              className="absolute text-[10px] text-[var(--text-faint)] uppercase tracking-wide"
              style={{ left: `${m.pct}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="relative">
          {/* Today + event-date vertical lines */}
          <div
            className="absolute top-0 bottom-0 border-l ml-40"
            style={{ left: `${todayPct}%`, borderColor: "var(--emerald-bright)", opacity: 0.5 }}
          />
          {eventPct !== null && (
            <div
              className="absolute top-0 bottom-0 border-l ml-40"
              style={{ left: `${eventPct}%`, borderColor: "var(--gold-bright)", opacity: 0.6 }}
            />
          )}

          {Object.entries(grouped).map(([cat, catTasks]) => (
            <div key={cat} className="mb-1">
              <div className="text-[10px] uppercase tracking-wide text-[var(--text-faint)] pl-2 py-1">
                {CATEGORY_LABELS[cat as TaskCategory]}
              </div>
              {catTasks.map((t) => {
                const due = new Date(t.dueDate as string);
                const start = t.startDate ? new Date(t.startDate) : null;
                const duePct = pct(due);
                const startPct = start ? pct(start) : duePct;
                const color = CATEGORY_COLORS[t.category];
                const done = t.status === "done";
                return (
                  <div key={t.id} className="flex items-center h-8">
                    <div className="w-40 pr-2 text-[12px] truncate shrink-0" title={t.title}>
                      {t.title}
                    </div>
                    <div className="relative flex-1 h-full">
                      {start ? (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full"
                          style={{
                            left: `${startPct}%`,
                            width: `${Math.max(0.5, duePct - startPct)}%`,
                            background: color,
                            opacity: done ? 0.4 : 0.85,
                          }}
                          title={`${t.startDate} → ${t.dueDate}`}
                        />
                      ) : (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45"
                          style={{
                            left: `${duePct}%`,
                            background: color,
                            opacity: done ? 0.4 : 0.9,
                          }}
                          title={t.dueDate ?? ""}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {undated.length > 0 && (
        <p className="text-[11px] text-[var(--text-faint)] mt-3 px-2">
          {undated.length} task{undated.length === 1 ? "" : "s"} without a due date not shown
          here — visible in the checklist.
        </p>
      )}
    </div>
  );
}

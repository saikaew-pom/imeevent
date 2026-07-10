"use client";

import { useMemo, useState } from "react";
import { useDeck } from "@/store/useDeck";
import {
  ProjectTask,
  NewTaskInput,
  TaskCategory,
  TaskStatus,
  CATEGORY_LABELS,
  STATUS_LABELS,
} from "@/data/tasks";
import { TaskFormModal } from "@/components/timeline/TaskFormModal";
import { GanttChart } from "@/components/timeline/GanttChart";
import { PresetPickerModal } from "@/components/timeline/PresetPickerModal";
import { AddDocumentModal } from "@/components/timeline/AddDocumentModal";
import { SuggestionsModal } from "@/components/timeline/SuggestionsModal";
import { SuggestedTask } from "@/data/documents";
import { useProjectSlug } from "@/components/ProjectProvider";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as TaskCategory[];

function daysUntil(eventDate: string | null): number | null {
  if (!eventDate) return null;
  const target = new Date(`${eventDate}T00:00:00Z`).getTime();
  return Math.ceil((target - Date.now()) / 86400000);
}

export default function TimelinePage() {
  const tasks = useDeck((s) => s.tasks);
  const members = useDeck((s) => s.members);
  const myRole = useDeck((s) => s.myRole);
  const addTask = useDeck((s) => s.addTask);
  const updateTask = useDeck((s) => s.updateTask);
  const removeTask = useDeck((s) => s.removeTask);
  const importPreset = useDeck((s) => s.importPreset);
  const eventDate = useDeck((s) => s.eventDate);
  const documents = useDeck((s) => s.documents);
  const addDocument = useDeck((s) => s.addDocument);
  const removeDocument = useDeck((s) => s.removeDocument);
  const suggestTasks = useDeck((s) => s.suggestTasks);
  const acceptSuggestions = useDeck((s) => s.acceptSuggestions);
  const canWrite = myRole === "owner" || myRole === "editor";
  const PROJECT_SLUG = useProjectSlug();

  const [view, setView] = useState<"checklist" | "gantt">("checklist");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedTask[] | null>(null);
  const [editing, setEditing] = useState<ProjectTask | null>(null);
  const [error, setError] = useState("");

  const runSuggest = async () => {
    setError("");
    setSuggesting(true);
    const result = await suggestTasks(PROJECT_SLUG);
    setSuggesting(false);
    if (result.ok) setSuggestions(result.suggestions ?? []);
    else setError(result.error ?? "AI suggestion failed.");
  };

  const filtered = useMemo(
    () => (statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter)),
    [tasks, statusFilter]
  );

  const grouped = useMemo(() => {
    const map = new Map<TaskCategory, ProjectTask[]>();
    for (const cat of ALL_CATEGORIES) map.set(cat, []);
    for (const t of filtered) map.get(t.category)?.push(t);
    return map;
  }, [filtered]);

  const submitForm = async (input: NewTaskInput) => {
    setError("");
    const result = editing
      ? await updateTask(PROJECT_SLUG, editing.id, input)
      : await addTask(PROJECT_SLUG, input);
    if (!result.ok) setError(result.error ?? "Something went wrong.");
    return result;
  };

  const handleStatusChange = async (task: ProjectTask, status: TaskStatus) => {
    setError("");
    const result = await updateTask(PROJECT_SLUG, task.id, {
      title: task.title,
      description: task.description,
      category: task.category,
      status,
      startDate: task.startDate,
      dueDate: task.dueDate,
      assigneeId: task.assigneeId,
    });
    if (!result.ok) setError(result.error ?? "Failed to update status.");
  };

  const handleRemove = async (id: string) => {
    setError("");
    const result = await removeTask(PROJECT_SLUG, id);
    if (!result.ok) setError(result.error ?? "Failed to remove task.");
  };

  const days = daysUntil(eventDate);
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const handleImport = async (presetId: string, date: string) => {
    setError("");
    const result = await importPreset(PROJECT_SLUG, presetId, date);
    if (!result.ok) setError(result.error ?? "Import failed.");
    return result;
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <div className="chip mb-2">Project Management</div>
          <h1 className="font-display italic text-3xl md:text-4xl gold-gradient">
            Timeline
          </h1>
          <p className="text-[13px] text-[var(--text-dim)] mt-1 max-w-2xl">
            Prep tasks and deadlines leading up to the event —{" "}
            {days !== null && days >= 0 ? (
              <>
                <span className="gold-text font-semibold">{days} days</span> to go ·{" "}
              </>
            ) : null}
            {doneCount}/{tasks.length} done. This is separate from Event Flow, which is the
            run-of-show on the night itself.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 panel-2 p-1">
            {(["checklist", "gantt"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="nav-link"
                style={
                  view === v
                    ? { color: "var(--gold-bright)", background: "rgba(217,180,90,0.12)" }
                    : {}
                }
              >
                {v === "checklist" ? "Checklist" : "Gantt"}
              </button>
            ))}
          </div>
          {canWrite && (
            <>
              <button
                onClick={() => setPresetOpen(true)}
                className="btn py-1.5 px-3 text-[12.5px]"
              >
                ✨ Use a preset
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="btn btn-emerald py-1.5 px-3 text-[12.5px]"
              >
                + Add task
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-[12.5px] mb-3" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {/* Documents & AI planning */}
      <section className="panel px-4 py-3.5 mb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[12px] uppercase tracking-wide text-[var(--text-faint)]">
              Documents
            </span>
            <span className="text-[11px] text-[var(--text-faint)]">
              {documents.length} attached
            </span>
          </div>
          {canWrite && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDocModalOpen(true)}
                className="btn py-1.5 px-3 text-[12px]"
              >
                + Add document
              </button>
              <button
                onClick={runSuggest}
                disabled={suggesting || documents.length === 0}
                className="btn btn-gold py-1.5 px-3 text-[12px] disabled:opacity-50"
                title={documents.length === 0 ? "Add a document first" : "Let AI read your documents"}
              >
                {suggesting ? "Reading…" : "✨ AI: suggest tasks"}
              </button>
            </div>
          )}
        </div>
        {documents.length === 0 ? (
          <p className="text-[12px] text-[var(--text-faint)]">
            Attach contracts, quotes or briefs (PDF, image, or pasted text). The AI reads
            them and suggests tasks for your timeline.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {documents.map((d) => (
              <span
                key={d.id}
                className="panel-2 flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 text-[12px]"
              >
                <span>{d.kind === "pdf" ? "📄" : d.kind === "image" ? "🖼️" : "📝"}</span>
                {d.fileKey ? (
                  <a
                    href={`/api/builder/photo/${d.fileKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline max-w-[220px] truncate"
                    title={d.name}
                  >
                    {d.name}
                  </a>
                ) : (
                  <span className="max-w-[220px] truncate" title={d.name}>
                    {d.name}
                  </span>
                )}
                {canWrite && (
                  <button
                    onClick={() => removeDocument(PROJECT_SLUG, d.id)}
                    className="text-[var(--text-faint)] hover:text-[var(--danger)] px-1"
                    title="Remove"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </section>

      {view === "checklist" && (
        <div className="flex gap-1 panel-2 p-1 mb-4 w-fit">
          {(["all", "todo", "in_progress", "done"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="nav-link"
              style={
                statusFilter === s
                  ? { color: "var(--gold-bright)", background: "rgba(217,180,90,0.12)" }
                  : {}
              }
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}

      {view === "gantt" ? (
        <GanttChart tasks={tasks} eventDate={eventDate} />
      ) : (
        <div className="space-y-5">
          {ALL_CATEGORIES.map((cat) => {
            const catTasks = grouped.get(cat) ?? [];
            if (catTasks.length === 0) return null;
            return (
              <section key={cat}>
                <h3 className="text-[12px] uppercase tracking-wide text-[var(--text-faint)] mb-2">
                  {CATEGORY_LABELS[cat]} · {catTasks.length}
                </h3>
                <div className="space-y-1.5">
                  {catTasks.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      canWrite={canWrite}
                      onStatusChange={(status) => handleStatusChange(t, status)}
                      onEdit={() => {
                        setEditing(t);
                        setFormOpen(true);
                      }}
                      onRemove={() => handleRemove(t.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
          {filtered.length === 0 && tasks.length === 0 && (
            <div className="panel px-6 py-12 text-center">
              <p className="text-[14px] text-[var(--text-dim)] mb-1">
                No tasks yet.
              </p>
              <p className="text-[12.5px] text-[var(--text-faint)] mb-5">
                Start from a preset for your event type, or add tasks one at a time.
              </p>
              {canWrite && (
                <button
                  onClick={() => setPresetOpen(true)}
                  className="btn btn-gold py-2 px-5 text-[13px]"
                >
                  ✨ Start from a preset
                </button>
              )}
            </div>
          )}
          {filtered.length === 0 && tasks.length > 0 && (
            <div className="panel px-6 py-10 text-center text-[13px] text-[var(--text-faint)]">
              No tasks match this filter.
            </div>
          )}
        </div>
      )}

      {formOpen && (
        <TaskFormModal
          initial={editing ?? undefined}
          members={members}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={submitForm}
        />
      )}

      {presetOpen && (
        <PresetPickerModal
          existingCount={tasks.length}
          defaultEventDate={eventDate}
          onClose={() => setPresetOpen(false)}
          onImport={handleImport}
        />
      )}

      {docModalOpen && (
        <AddDocumentModal
          onClose={() => setDocModalOpen(false)}
          onAdd={(input) => addDocument(PROJECT_SLUG, input)}
        />
      )}

      {suggestions !== null && (
        <SuggestionsModal
          suggestions={suggestions}
          onClose={() => setSuggestions(null)}
          onAccept={(accepted) => acceptSuggestions(PROJECT_SLUG, accepted)}
        />
      )}
    </div>
  );
}

function TaskRow({
  task,
  canWrite,
  onStatusChange,
  onEdit,
  onRemove,
}: {
  task: ProjectTask;
  canWrite: boolean;
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const isDone = task.status === "done";
  return (
    <div className="panel-2 flex items-center gap-3 px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div
          className="text-[13px] font-semibold truncate"
          style={isDone ? { color: "var(--text-faint)", textDecoration: "line-through" } : {}}
        >
          {task.title}
        </div>
        <div className="text-[11px] text-[var(--text-faint)] truncate">
          {task.dueDate ? `Due ${task.dueDate}` : "No due date"}
          {task.assigneeName ? ` · ${task.assigneeName}` : ""}
        </div>
      </div>
      <select
        value={task.status}
        onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
        disabled={!canWrite}
        className="text-[12px] py-1"
      >
        {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {canWrite && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="text-[11px] text-[var(--text-faint)] hover:text-[var(--gold-bright)] px-1"
          >
            ✎
          </button>
          <button
            onClick={onRemove}
            className="text-[11px] text-[var(--text-faint)] hover:text-[var(--danger)] px-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

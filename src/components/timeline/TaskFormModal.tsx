"use client";

import { useState } from "react";
import {
  NewTaskInput,
  ProjectTask,
  ProjectMember,
  TaskCategory,
  TaskStatus,
  CATEGORY_LABELS,
  STATUS_LABELS,
} from "@/data/tasks";
import { ProjectDocument } from "@/data/documents";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as TaskCategory[];
const ALL_STATUSES = Object.keys(STATUS_LABELS) as TaskStatus[];

export function TaskFormModal({
  initial,
  members,
  documents,
  onClose,
  onSubmit,
}: {
  initial?: ProjectTask;
  members: ProjectMember[];
  documents: ProjectDocument[];
  onClose: () => void;
  onSubmit: (input: NewTaskInput) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<TaskCategory>(initial?.category ?? "general");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "todo");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [assigneeId, setAssigneeId] = useState(initial?.assigneeId ?? "");
  const [documentIds, setDocumentIds] = useState<string[]>(initial?.documentIds ?? []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleDocument = (id: string) => {
    setDocumentIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const submit = async () => {
    if (!title.trim()) return;
    setError("");
    setSaving(true);
    const result = await onSubmit({
      title,
      description,
      category,
      status,
      startDate: startDate || null,
      dueDate: dueDate || null,
      assigneeId: assigneeId || null,
      documentIds,
    });
    setSaving(false);
    if (result.ok) onClose();
    else setError(result.error ?? "Something went wrong.");
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto panel px-6 py-6 fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold gold-text">
            {initial ? "Edit task" : "Add task"}
          </h3>
          <button onClick={onClose} className="btn px-3 py-1.5">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Title">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Confirm floral vendor deposit"
              className="w-full"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full text-[13px]"
              style={{
                background: "var(--bg-soft)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "7px 10px",
                color: "var(--text)",
                resize: "vertical",
              }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full"
              >
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date (optional)">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </Field>
            <Field label="Due date">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full"
              />
            </Field>
          </div>

          <Field label="Assignee">
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.email}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Attached documents">
            {documents.length === 0 ? (
              <p className="text-[12px] text-[var(--text-faint)]">
                No documents in this project yet — add one from the Documents panel.
              </p>
            ) : (
              <div
                className="space-y-1 max-h-32 overflow-y-auto panel-2 p-2"
                style={{ borderRadius: 8 }}
              >
                {documents.map((d) => (
                  <label
                    key={d.id}
                    className="flex items-center gap-2 text-[12.5px] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={documentIds.includes(d.id)}
                      onChange={() => toggleDocument(d.id)}
                    />
                    {d.name}
                  </label>
                ))}
              </div>
            )}
          </Field>
        </div>

        {error && (
          <p className="text-[12.5px] mt-3" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn px-4 py-2">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="btn btn-gold px-4 py-2 disabled:opacity-60"
          >
            {saving ? "Saving…" : initial ? "Save changes" : "Add task"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

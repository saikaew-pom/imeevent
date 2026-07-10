"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Act,
  ItemKind,
  NewActInput,
  Placement,
  PLACEMENT_LABELS,
  ThemeKey,
  THEME_LABELS,
} from "@/data/acts";
import { useDeck } from "@/store/useDeck";
import { useProjectSlug } from "@/components/ProjectProvider";

const ALL_THEMES = Object.keys(THEME_LABELS) as ThemeKey[];
const ALL_PLACEMENTS = Object.keys(PLACEMENT_LABELS) as Placement[];

export function ItemFormModal({
  initial,
  defaultKind,
  onClose,
  onSubmit,
}: {
  initial?: Act; // present when editing an existing custom item
  defaultKind?: ItemKind; // preset the kind toggle when creating fresh (e.g. from the beat drawer)
  onClose: () => void;
  onSubmit: (input: NewActInput) => Promise<{ ok: boolean; error?: string }>;
}) {
  const draftItemDescription = useDeck((s) => s.draftItemDescription);
  const PROJECT_SLUG = useProjectSlug();

  const [kind, setKind] = useState<ItemKind>(initial?.kind ?? defaultKind ?? "show");
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [themes, setThemes] = useState<ThemeKey[]>(initial?.themes ?? []);
  const [requiresDark, setRequiresDark] = useState(initial?.requiresDark ?? false);
  const [durationMin, setDurationMin] = useState(initial?.durationMin ?? 10);
  const [costTHB, setCostTHB] = useState(initial?.costTHB ?? 0);
  const [photo, setPhoto] = useState(initial?.photo ?? "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [energy, setEnergy] = useState(initial?.energy ?? 5);
  const [placement, setPlacement] = useState<Placement[]>(
    initial?.placement ?? ["mid"]
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draftingDesc, setDraftingDesc] = useState(false);

  const handleDraftDescription = async () => {
    if (!name.trim()) return;
    setDraftingDesc(true);
    setError("");
    const result = await draftItemDescription(PROJECT_SLUG, {
      kind,
      name,
      subtitle: type || undefined,
      photoUrl: photo || undefined,
    });
    if (result.ok && result.draft) setDescription(result.draft);
    else setError(result.error ?? "AI drafting failed.");
    setDraftingDesc(false);
  };

  const handlePhotoFile = async (file: File) => {
    setPhotoError("");
    setUploadingPhoto(true);
    const previousPhoto = photo;
    const localPreview = URL.createObjectURL(file);
    setPhoto(localPreview);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/builder/upload?slug=${encodeURIComponent(PROJECT_SLUG)}`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setPhoto(data.url as string);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed.");
      setPhoto(previousPhoto);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const toggleTheme = (t: ThemeKey) =>
    setThemes((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  const togglePlacement = (p: Placement) =>
    setPlacement((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  const submit = async () => {
    if (!name.trim()) return;
    setError("");
    setSaving(true);
    const result = await onSubmit({
      name,
      type,
      description,
      kind,
      themes,
      requiresDark,
      durationMin,
      costTHB,
      photo: photo.trim() || undefined,
      energy: kind === "show" ? energy : undefined,
      placement: kind === "show" ? placement : undefined,
    });
    setSaving(false);
    if (result.ok) onClose();
    else setError(result.error ?? "Something went wrong.");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto panel px-6 py-6 fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold gold-text">
            {initial ? "Edit item" : "Add new item"}
          </h3>
          <button onClick={onClose} className="btn px-3 py-1.5">
            ✕
          </button>
        </div>

        {/* Kind toggle */}
        <div className="flex gap-1 panel-2 p-1 mb-4 w-fit">
          {(["show", "decor"] as ItemKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className="nav-link"
              style={
                kind === k
                  ? { color: "var(--gold-bright)", background: "rgba(217,180,90,0.12)" }
                  : {}
              }
            >
              {k === "show" ? "Show / Act" : "Decor / Element"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === "show" ? "e.g. Fire Poi Dance" : "e.g. Floral Arch"}
              className="w-full"
            />
          </Field>

          <Field label="Type / category">
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder={kind === "show" ? "e.g. Circus / Spectacle" : "e.g. Floral installation"}
              className="w-full"
            />
          </Field>

          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
                Description
              </span>
              <button
                type="button"
                onClick={handleDraftDescription}
                disabled={draftingDesc || !name.trim()}
                className="text-[11px] emerald-text hover:underline disabled:opacity-60"
              >
                {draftingDesc ? "Drafting…" : "✨ Draft with AI"}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full text-[13px] mt-1"
              style={{
                background: "var(--bg-soft)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "7px 10px",
                color: "var(--text)",
                resize: "vertical",
              }}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration (min)">
              <input
                type="number"
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full"
              />
            </Field>
            <Field label="Cost (THB)">
              <input
                type="number"
                value={costTHB}
                onChange={(e) => setCostTHB(Number(e.target.value))}
                className="w-full"
              />
            </Field>
          </div>

          <Field label="Photo">
            <div className="flex items-center gap-3">
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt=""
                  className="w-16 h-16 rounded-md object-cover border"
                  style={{ borderColor: "var(--border)" }}
                />
              )}
              <label className="btn px-3 py-1.5 text-[12.5px] cursor-pointer">
                {uploadingPhoto ? "Uploading…" : photo ? "Change photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploadingPhoto}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoFile(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {photoError && (
              <p className="text-[11px] mt-1" style={{ color: "var(--danger)" }}>
                {photoError}
              </p>
            )}
          </Field>

          <Field label="Themes">
            <div className="flex flex-wrap gap-1.5">
              {ALL_THEMES.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTheme(t)}
                  className="chip"
                  style={
                    themes.includes(t)
                      ? { color: "var(--gold-bright)", borderColor: "var(--gold)" }
                      : {}
                  }
                >
                  {THEME_LABELS[t]}
                </button>
              ))}
            </div>
          </Field>

          <label className="flex items-center gap-2 text-[12.5px] text-[var(--text-dim)]">
            <input
              type="checkbox"
              checked={requiresDark}
              onChange={(e) => setRequiresDark(e.target.checked)}
            />
            Needs low light / darkness to read well
          </label>

          {/* Show-only fields: energy + placement. Decor items skip both. */}
          {kind === "show" && (
            <>
              <Field label={`Energy: ${energy}/10`}>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full"
                />
              </Field>
              <Field label="Placement">
                <div className="flex flex-wrap gap-1.5">
                  {ALL_PLACEMENTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePlacement(p)}
                      className="chip"
                      style={
                        placement.includes(p)
                          ? { color: "var(--emerald-bright)", borderColor: "var(--emerald)" }
                          : {}
                      }
                    >
                      {PLACEMENT_LABELS[p]}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}
          {kind === "decor" && (
            <p className="text-[11px] text-[var(--text-faint)]">
              Decor &amp; element items are reference/costing only — no energy score
              or night placement.
            </p>
          )}
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
            disabled={saving || uploadingPhoto}
            className="btn btn-gold px-4 py-2 disabled:opacity-60"
          >
            {saving ? "Saving…" : uploadingPhoto ? "Uploading…" : initial ? "Save changes" : "Add item"}
          </button>
        </div>
      </div>
    </div>,
    document.body
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ink, sub, border, hoverBg, danger, bg, accentBg } from "@/lib/notionTheme";
import {
  LibraryMediaItem,
  LibraryAct,
  LibraryVendorItem,
  VendorCategory,
  VENDOR_CATEGORIES,
  NewLibraryVendorInput,
} from "@/data/companyLibrary";
import { NewActInput, ThemeKey, Placement, ItemKind } from "@/data/acts";

type Tab = "media" | "acts" | "vendors";
type ProjectOption = { id: string; name: string };

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data as T;
}

const THEME_OPTIONS: ThemeKey[] = [
  "thai",
  "garden",
  "chinese",
  "led",
  "indian",
  "cabaret",
  "circus",
  "interactive",
];
const PLACEMENT_OPTIONS: Placement[] = ["welcome", "opening", "mid", "finale"];

function label(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");
}

// ---------------------------------------------------------------------------
// Copy-to-project control — shared by every tab's item rows.
// ---------------------------------------------------------------------------
function CopyPicker({
  projects,
  onCopy,
}: {
  projects: ProjectOption[];
  onCopy: (projectId: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [target, setTarget] = useState(projects[0]?.id ?? "");
  const [status, setStatus] = useState<"idle" | "copying" | "done" | "error">("idle");
  const [error, setError] = useState("");

  if (projects.length === 0) {
    return <span className="text-[11px]" style={{ color: sub }}>No projects you can edit</span>;
  }

  const handleCopy = async () => {
    if (!target) return;
    setStatus("copying");
    setError("");
    const result = await onCopy(target);
    if (result.ok) {
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("error");
      setError(result.error ?? "Copy failed.");
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="text-[11px] rounded-[6px] px-1.5 py-1"
        style={{ border: `1px solid ${border}` }}
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleCopy}
        disabled={status === "copying"}
        className="text-[11px] font-medium rounded-[6px] px-2.5 py-1 disabled:opacity-60"
        style={{ border: `1px solid ${border}`, color: sub }}
      >
        {status === "copying" ? "Copying…" : status === "done" ? "Copied ✓" : "Copy to project"}
      </button>
      {status === "error" && <span className="text-[11px]" style={{ color: danger }}>{error}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Media tab
// ---------------------------------------------------------------------------
function MediaTab({
  isAdmin,
  media,
  setMedia,
  projects,
}: {
  isAdmin: boolean;
  media: LibraryMediaItem[];
  setMedia: (m: LibraryMediaItem[]) => void;
  projects: ProjectOption[];
}) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const addLink = async () => {
    if (!linkUrl.trim()) return;
    setBusy(true);
    setError("");
    try {
      const data = await apiJson<{ item: LibraryMediaItem }>("/api/library/media/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkUrl, name: linkName }),
      });
      setMedia([data.item, ...media]);
      setLinkUrl("");
      setLinkName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add link.");
    } finally {
      setBusy(false);
    }
  };

  const uploadImage = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const data = await apiJson<{ item: LibraryMediaItem }>("/api/library/media/upload", {
        method: "POST",
        body: form,
      });
      setMedia([data.item, ...media]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await apiJson(`/api/library/media/${id}`, { method: "DELETE" });
    setMedia(media.filter((m) => m.id !== id));
  };

  return (
    <div>
      {isAdmin && (
        <div className="rounded-[8px] p-4 mb-5" style={{ border: `1px solid ${border}` }}>
          <span className="text-[10.5px] uppercase tracking-wide text-[var(--text-faint)]">
            Add media to the library
          </span>
          <div className="flex flex-wrap items-center gap-2 mt-2 mb-2">
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Paste a link (YouTube, Vimeo, …)"
              className="text-[13px] rounded-[6px] px-3 py-2 flex-1 min-w-[200px]"
              style={{ border: `1px solid ${border}` }}
            />
            <input
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="Name (optional)"
              className="text-[13px] rounded-[6px] px-3 py-2 w-40"
              style={{ border: `1px solid ${border}` }}
            />
            <button
              type="button"
              onClick={addLink}
              disabled={busy}
              className="text-[13px] font-medium rounded-[6px] px-4 py-2 disabled:opacity-60"
              style={{ background: accentBg, color: "#fff" }}
            >
              Add link
            </button>
          </div>
          <label className="text-[12px] cursor-pointer" style={{ color: sub }}>
            {busy ? "Working…" : "Or upload an image (JPEG/PNG/WEBP/GIF, max 8MB) →"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
                e.target.value = "";
              }}
            />
          </label>
          {error && <p className="text-[11px] mt-2" style={{ color: danger }}>{error}</p>}
        </div>
      )}

      {media.length === 0 ? (
        <p className="text-[13px]" style={{ color: sub }}>No media in the library yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-2">
          {media.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-[8px]" style={{ border: `1px solid ${border}` }}>
              <div
                className="w-12 h-12 rounded-[6px] shrink-0 flex items-center justify-center text-[10px] overflow-hidden"
                style={{ background: hoverBg, color: sub }}
              >
                {m.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  m.kind
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{m.name}</p>
                <p className="text-[11px] truncate" style={{ color: sub }}>{m.kind}</p>
              </div>
              <CopyPicker
                projects={projects}
                onCopy={(projectId) =>
                  apiJson(`/api/library/media/${m.id}/copy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ projectId }),
                  })
                    .then(() => ({ ok: true }))
                    .catch((e) => ({ ok: false, error: e instanceof Error ? e.message : "Copy failed." }))
                }
              />
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  className="text-[11px] shrink-0"
                  style={{ color: danger }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Show & Decor tab
// ---------------------------------------------------------------------------
const EMPTY_ACT_INPUT: NewActInput = {
  name: "",
  type: "",
  description: "",
  kind: "show",
  themes: ["interactive"],
  requiresDark: false,
  durationMin: 10,
  costTHB: 0,
  photo: "",
  energy: 5,
  placement: ["mid"],
};

// Labelled-field wrapper for the library add/edit forms. Every input gets a
// visible label instead of leaning on a placeholder that disappears the moment
// the field has a value — the reason the numeric boxes (cost / duration /
// energy) read as unlabelled "0 / 10 / 5". Module-level (not nested in a form
// component) so inputs don't remount and lose focus on each keystroke.
function LibField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-wide text-[var(--text-faint)]">
        {label}
      </span>
      {hint ? (
        <span className="text-[10.5px] text-[var(--text-faint)] tracking-normal">
          {" "}· {hint}
        </span>
      ) : null}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function ActForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: NewActInput;
  onSubmit: (input: NewActInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [input, setInput] = useState<NewActInput>(initial ?? { ...EMPTY_ACT_INPUT });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isShow = input.kind === "show";

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const data = await apiJson<{ url: string }>("/api/library/upload", { method: "POST", body: form });
      setInput((i) => ({ ...i, photo: data.url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const toggleTheme = (t: ThemeKey) => {
    setInput((i) => ({
      ...i,
      themes: i.themes.includes(t) ? i.themes.filter((x) => x !== t) : [...i.themes, t],
    }));
  };

  const togglePlacement = (p: Placement) => {
    setInput((i) => ({
      ...i,
      placement: (i.placement ?? []).includes(p)
        ? (i.placement ?? []).filter((x) => x !== p)
        : [...(i.placement ?? []), p],
    }));
  };

  const submit = async () => {
    if (!input.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit(input);
      if (!initial) setInput({ ...EMPTY_ACT_INPUT });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[8px] p-4 mb-3" style={{ border: `1px solid ${border}` }}>
      <div className="grid md:grid-cols-2 gap-x-2 gap-y-3 mb-3">
        <LibField label="Item type">
          <select
            value={input.kind}
            onChange={(e) => setInput((i) => ({ ...i, kind: e.target.value as ItemKind }))}
            className="w-full text-[13px] rounded-[6px] px-3 py-2"
            style={{ border: `1px solid ${border}` }}
          >
            <option value="show">Show act (performance)</option>
            <option value="decor">Décor / installation</option>
          </select>
        </LibField>
        <LibField label="Name">
          <input
            value={input.name}
            onChange={(e) => setInput((i) => ({ ...i, name: e.target.value }))}
            placeholder="e.g. Aerial silk duo"
            className="w-full text-[13px] rounded-[6px] px-3 py-2"
            style={{ border: `1px solid ${border}` }}
          />
        </LibField>
        <LibField label="Category / style">
          <input
            value={input.type}
            onChange={(e) => setInput((i) => ({ ...i, type: e.target.value }))}
            placeholder="e.g. Aerial, LED, Fire, Cultural"
            className="w-full text-[13px] rounded-[6px] px-3 py-2"
            style={{ border: `1px solid ${border}` }}
          />
        </LibField>
        <LibField label="Indicative cost" hint="THB">
          <input
            type="number"
            value={input.costTHB}
            onChange={(e) => setInput((i) => ({ ...i, costTHB: Number(e.target.value) || 0 }))}
            placeholder="0"
            className="w-full text-[13px] rounded-[6px] px-3 py-2"
            style={{ border: `1px solid ${border}` }}
          />
        </LibField>
        <LibField label="Stage time" hint="minutes">
          <input
            type="number"
            value={input.durationMin}
            onChange={(e) => setInput((i) => ({ ...i, durationMin: Number(e.target.value) || 0 }))}
            placeholder="10"
            className="w-full text-[13px] rounded-[6px] px-3 py-2"
            style={{ border: `1px solid ${border}` }}
          />
        </LibField>
        {isShow && (
          <LibField label="Energy level" hint="1 = calm, 10 = peak">
            <input
              type="number"
              min={1}
              max={10}
              value={input.energy ?? 5}
              onChange={(e) => setInput((i) => ({ ...i, energy: Number(e.target.value) || 5 }))}
              placeholder="5"
              className="w-full text-[13px] rounded-[6px] px-3 py-2"
              style={{ border: `1px solid ${border}` }}
            />
          </LibField>
        )}
      </div>
      <div className="mb-3">
        <LibField label="Description">
          <textarea
            value={input.description}
            onChange={(e) => setInput((i) => ({ ...i, description: e.target.value }))}
            placeholder="What it is and how it reads on stage"
            rows={2}
            className="w-full text-[13px] rounded-[6px] px-3 py-2"
            style={{ border: `1px solid ${border}` }}
          />
        </LibField>
      </div>
      <div className="mb-3">
        <span className="text-[10.5px] uppercase tracking-wide text-[var(--text-faint)]">
          Themes / vibe
        </span>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {THEME_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTheme(t)}
              className="text-[11px] rounded-full px-2.5 py-1"
              style={{
                border: `1px solid ${border}`,
                background: input.themes.includes(t) ? accentBg : "transparent",
                color: input.themes.includes(t) ? "#fff" : sub,
              }}
            >
              {label(t)}
            </button>
          ))}
        </div>
      </div>
      {isShow && (
        <div className="mb-3">
          <span className="text-[10.5px] uppercase tracking-wide text-[var(--text-faint)]">
            Where in the show
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {PLACEMENT_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlacement(p)}
                className="text-[11px] rounded-full px-2.5 py-1"
                style={{
                  border: `1px solid ${border}`,
                  background: (input.placement ?? []).includes(p) ? accentBg : "transparent",
                  color: (input.placement ?? []).includes(p) ? "#fff" : sub,
                }}
              >
                {label(p)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <label className="flex items-center gap-1.5 text-[12px]" style={{ color: sub }}>
          <input
            type="checkbox"
            checked={input.requiresDark}
            onChange={(e) => setInput((i) => ({ ...i, requiresDark: e.target.checked }))}
          />
          Requires dark
        </label>
        <label className="text-[12px] cursor-pointer" style={{ color: sub }}>
          {uploading ? "Uploading…" : input.photo ? "Change photo" : "Upload photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadPhoto(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {error && <p className="text-[11px] mb-2" style={{ color: danger }}>{error}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-[12px] rounded-[6px] px-3 py-1.5" style={{ border: `1px solid ${border}`, color: sub }}>
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={saving || uploading}
          className="text-[13px] font-medium rounded-[6px] px-4 py-2 disabled:opacity-60"
          style={{ background: accentBg, color: "#fff" }}
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Add item"}
        </button>
      </div>
    </div>
  );
}

function ActsTab({
  isAdmin,
  acts,
  setActs,
  projects,
}: {
  isAdmin: boolean;
  acts: LibraryAct[];
  setActs: (a: LibraryAct[]) => void;
  projects: ProjectOption[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const create = async (input: NewActInput) => {
    const data = await apiJson<{ act: LibraryAct }>("/api/library/acts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    setActs([data.act, ...acts]);
  };

  const update = async (id: string, input: NewActInput) => {
    await apiJson(`/api/library/acts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    setActs(acts.map((a) => (a.id === id ? { ...a, ...input } : a)));
    setEditingId(null);
  };

  const remove = async (id: string) => {
    await apiJson(`/api/library/acts/${id}`, { method: "DELETE" });
    setActs(acts.filter((a) => a.id !== id));
  };

  return (
    <div>
      {isAdmin && <ActForm onSubmit={create} />}

      {acts.length === 0 ? (
        <p className="text-[13px]" style={{ color: sub }}>No shows or decor in the library yet.</p>
      ) : (
        <div className="space-y-2">
          {acts.map((a) =>
            editingId === a.id ? (
              <ActForm
                key={a.id}
                initial={a}
                onSubmit={(input) => update(a.id, input)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-[8px]" style={{ border: `1px solid ${border}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.photo} alt="" className="w-12 h-12 rounded-[6px] object-cover shrink-0" style={{ background: hoverBg }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{a.name}</p>
                  <p className="text-[11px] truncate" style={{ color: sub }}>
                    {label(a.kind)} · {a.type} · {a.costTHB}
                    {a.energy ? ` · energy ${a.energy}` : ""}
                  </p>
                </div>
                <CopyPicker
                  projects={projects}
                  onCopy={(projectId) =>
                    apiJson(`/api/library/acts/${a.id}/copy`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ projectId }),
                    })
                      .then(() => ({ ok: true }))
                      .catch((e) => ({ ok: false, error: e instanceof Error ? e.message : "Copy failed." }))
                  }
                />
                {isAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => setEditingId(a.id)} className="text-[11px]" style={{ color: sub }}>
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(a.id)} className="text-[11px]" style={{ color: danger }}>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vendors tab
// ---------------------------------------------------------------------------
const EMPTY_VENDOR_INPUT: NewLibraryVendorInput = {
  category: "equipment",
  name: "",
  description: "",
  photo: "",
  costTHB: 0,
  unit: "",
  vendorContact: "",
};

function VendorForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: NewLibraryVendorInput;
  onSubmit: (input: NewLibraryVendorInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [input, setInput] = useState<NewLibraryVendorInput>(initial ?? { ...EMPTY_VENDOR_INPUT });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const data = await apiJson<{ url: string }>("/api/library/upload", { method: "POST", body: form });
      setInput((i) => ({ ...i, photo: data.url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!input.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit(input);
      if (!initial) setInput({ ...EMPTY_VENDOR_INPUT });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[8px] p-4 mb-3" style={{ border: `1px solid ${border}` }}>
      <div className="grid md:grid-cols-2 gap-x-2 gap-y-3 mb-3">
        <LibField label="Vendor category">
          <select
            value={input.category}
            onChange={(e) => setInput((i) => ({ ...i, category: e.target.value as VendorCategory }))}
            className="w-full text-[13px] rounded-[6px] px-3 py-2"
            style={{ border: `1px solid ${border}` }}
          >
            {VENDOR_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </LibField>
        <LibField label="Name">
          <input
            value={input.name}
            onChange={(e) => setInput((i) => ({ ...i, name: e.target.value }))}
            placeholder="e.g. Bright Stage AV"
            className="w-full text-[13px] rounded-[6px] px-3 py-2"
            style={{ border: `1px solid ${border}` }}
          />
        </LibField>
        <LibField label="Cost" hint="THB per unit">
          <input
            type="number"
            value={input.costTHB}
            onChange={(e) => setInput((i) => ({ ...i, costTHB: Number(e.target.value) || 0 }))}
            placeholder="0"
            className="w-full text-[13px] rounded-[6px] px-3 py-2"
            style={{ border: `1px solid ${border}` }}
          />
        </LibField>
        <LibField label="Priced per" hint="the unit above">
          <input
            value={input.unit}
            onChange={(e) => setInput((i) => ({ ...i, unit: e.target.value }))}
            placeholder='e.g. "per day", "per trip", "per person"'
            className="w-full text-[13px] rounded-[6px] px-3 py-2"
            style={{ border: `1px solid ${border}` }}
          />
        </LibField>
        <div className="md:col-span-2">
          <LibField label="Vendor contact" hint="name, phone or email">
            <input
              value={input.vendorContact}
              onChange={(e) => setInput((i) => ({ ...i, vendorContact: e.target.value }))}
              placeholder="e.g. Khun Nok · 08x-xxx-xxxx"
              className="w-full text-[13px] rounded-[6px] px-3 py-2"
              style={{ border: `1px solid ${border}` }}
            />
          </LibField>
        </div>
      </div>
      <div className="mb-3">
        <LibField label="Description">
          <textarea
            value={input.description}
            onChange={(e) => setInput((i) => ({ ...i, description: e.target.value }))}
            placeholder="What they supply and any notes"
            rows={2}
            className="w-full text-[13px] rounded-[6px] px-3 py-2"
            style={{ border: `1px solid ${border}` }}
          />
        </LibField>
      </div>
      <label className="text-[12px] cursor-pointer" style={{ color: sub }}>
        {uploading ? "Uploading…" : input.photo ? "Change photo" : "Upload photo (optional)"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadPhoto(file);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="text-[11px] mt-2 mb-2" style={{ color: danger }}>{error}</p>}
      <div className="flex justify-end gap-2 mt-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-[12px] rounded-[6px] px-3 py-1.5" style={{ border: `1px solid ${border}`, color: sub }}>
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={saving || uploading}
          className="text-[13px] font-medium rounded-[6px] px-4 py-2 disabled:opacity-60"
          style={{ background: accentBg, color: "#fff" }}
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Add item"}
        </button>
      </div>
    </div>
  );
}

function VendorsTab({
  isAdmin,
  vendors,
  setVendors,
  projects,
}: {
  isAdmin: boolean;
  vendors: LibraryVendorItem[];
  setVendors: (v: LibraryVendorItem[]) => void;
  projects: ProjectOption[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const create = async (input: NewLibraryVendorInput) => {
    const data = await apiJson<{ vendor: LibraryVendorItem }>("/api/library/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    setVendors([data.vendor, ...vendors]);
  };

  const update = async (id: string, input: NewLibraryVendorInput) => {
    await apiJson(`/api/library/vendors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    setVendors(vendors.map((v) => (v.id === id ? { ...v, ...input } : v)));
    setEditingId(null);
  };

  const remove = async (id: string) => {
    await apiJson(`/api/library/vendors/${id}`, { method: "DELETE" });
    setVendors(vendors.filter((v) => v.id !== id));
  };

  return (
    <div>
      {isAdmin && <VendorForm onSubmit={create} />}

      {vendors.length === 0 ? (
        <p className="text-[13px]" style={{ color: sub }}>No vendor items in the library yet.</p>
      ) : (
        <div className="space-y-2">
          {vendors.map((v) =>
            editingId === v.id ? (
              <VendorForm
                key={v.id}
                initial={{ ...v, photo: v.photo ?? undefined }}
                onSubmit={(input) => update(v.id, input)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={v.id} className="flex items-center gap-3 px-4 py-3 rounded-[8px]" style={{ border: `1px solid ${border}` }}>
                <div
                  className="w-12 h-12 rounded-[6px] shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ background: hoverBg }}
                >
                  {v.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.photo} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{v.name}</p>
                  <p className="text-[11px] truncate" style={{ color: sub }}>
                    {VENDOR_CATEGORIES.find((c) => c.key === v.category)?.label} · {v.costTHB}
                    {v.unit ? ` ${v.unit}` : ""}
                  </p>
                </div>
                <CopyPicker
                  projects={projects}
                  onCopy={(projectId) =>
                    apiJson(`/api/library/vendors/${v.id}/copy`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ projectId }),
                    })
                      .then(() => ({ ok: true }))
                      .catch((e) => ({ ok: false, error: e instanceof Error ? e.message : "Copy failed." }))
                  }
                />
                {isAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => setEditingId(v.id)} className="text-[11px]" style={{ color: sub }}>
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(v.id)} className="text-[11px]" style={{ color: danger }}>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------
export function LibraryClient({
  isAdmin,
  initialMedia,
  initialActs,
  initialVendors,
  projects,
}: {
  isAdmin: boolean;
  initialMedia: LibraryMediaItem[];
  initialActs: LibraryAct[];
  initialVendors: LibraryVendorItem[];
  projects: ProjectOption[];
}) {
  const [tab, setTab] = useState<Tab>("media");
  const [media, setMedia] = useState(initialMedia);
  const [acts, setActs] = useState(initialActs);
  const [vendors, setVendors] = useState(initialVendors);

  const tabs: { key: Tab; title: string }[] = [
    { key: "media", title: "Media" },
    { key: "acts", title: "Show & Decor" },
    { key: "vendors", title: "Vendors" },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ background: bg, color: ink }}>
      <header style={{ borderBottom: `1px solid ${border}` }}>
        <div className="mx-auto max-w-[880px] px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center rounded-[6px] w-5 h-5 text-[11px] font-bold"
              style={{ background: accentBg, color: "#fff" }}
            >
              E
            </span>
            <span className="text-[14px] font-semibold">EventFlow Production</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/projects" className="text-[13px] hover:underline" style={{ color: sub }}>
              Projects
            </Link>
            <ThemeToggle className="text-[13px] hover:underline" style={{ color: sub }} />
            <SignOutButton className="text-[13px] hover:underline" style={{ color: sub }} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[880px] px-6 py-12">
        <h1 className="text-[22px] font-semibold mb-1">Company Library</h1>
        <p className="text-[13.5px] mb-6" style={{ color: sub }}>
          {isAdmin
            ? "Curate reusable media, shows/decor, and vendor items — copy any of them straight into a project you can edit."
            : "Browse your company's reusable media, shows/decor, and vendor items — copy any of them straight into a project you can edit."}
        </p>

        <div className="flex gap-1 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="text-[13px] font-medium rounded-[6px] px-3.5 py-2"
              style={
                tab === t.key
                  ? { background: accentBg, color: "#fff" }
                  : { border: `1px solid ${border}`, color: sub }
              }
            >
              {t.title}
            </button>
          ))}
        </div>

        {tab === "media" && <MediaTab isAdmin={isAdmin} media={media} setMedia={setMedia} projects={projects} />}
        {tab === "acts" && <ActsTab isAdmin={isAdmin} acts={acts} setActs={setActs} projects={projects} />}
        {tab === "vendors" && (
          <VendorsTab isAdmin={isAdmin} vendors={vendors} setVendors={setVendors} projects={projects} />
        )}
      </section>
    </div>
  );
}

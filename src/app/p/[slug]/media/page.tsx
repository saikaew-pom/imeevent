"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDeck } from "@/store/useDeck";
import { MediaAsset, MediaAssetKind, VIDEO_PLACEHOLDER_POSTER } from "@/data/media";
import { useProjectSlug } from "@/components/ProjectProvider";

const kindLabels: Record<MediaAssetKind | "all", string> = {
  all: "All",
  image: "Photos",
  video: "Videos",
  audio: "Songs",
  link: "Links",
};

export default function MediaLibraryPage() {
  const mediaAssets = useDeck((s) => s.mediaAssets);
  const myRole = useDeck((s) => s.myRole);
  const uploadMediaAsset = useDeck((s) => s.uploadMediaAsset);
  const renameMediaAsset = useDeck((s) => s.renameMediaAsset);
  const removeMediaAsset = useDeck((s) => s.removeMediaAsset);
  const addMediaLink = useDeck((s) => s.addMediaLink);
  const searchMediaAssetsAI = useDeck((s) => s.searchMediaAssetsAI);
  const canWrite = myRole === "owner" || myRole === "editor";
  const PROJECT_SLUG = useProjectSlug();

  const [filter, setFilter] = useState<MediaAssetKind | "all">("all");
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [addLinkOpen, setAddLinkOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [aiMatchIds, setAiMatchIds] = useState<Set<string> | null>(null);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiError, setAiError] = useState("");

  const kindFiltered = useMemo(
    () => (filter === "all" ? mediaAssets : mediaAssets.filter((a) => a.kind === filter)),
    [mediaAssets, filter]
  );

  const filtered = useMemo(() => {
    if (aiMatchIds) return kindFiltered.filter((a) => aiMatchIds.has(a.id));
    const q = query.trim().toLowerCase();
    if (!q) return kindFiltered;
    return kindFiltered.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.linkUrl ?? "").toLowerCase().includes(q)
    );
  }, [kindFiltered, query, aiMatchIds]);

  const handleUpload = async (file: File) => {
    setError("");
    setBusy(true);
    setUploadPct(null);
    const result = await uploadMediaAsset(PROJECT_SLUG, file, undefined, setUploadPct);
    setBusy(false);
    setUploadPct(null);
    if (!result.ok) setError(result.error ?? "Upload failed.");
  };

  const startEdit = (a: MediaAsset) => {
    setEditingId(a.id);
    setEditName(a.name);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await renameMediaAsset(PROJECT_SLUG, editingId, editName);
    setEditingId(null);
  };

  const handleRemove = async (id: string) => {
    setError("");
    const result = await removeMediaAsset(PROJECT_SLUG, id);
    if (!result.ok) setError("Failed to remove asset.");
  };

  const handleAiSearch = async () => {
    if (!query.trim()) return;
    setAiError("");
    setAiSearching(true);
    const result = await searchMediaAssetsAI(PROJECT_SLUG, query.trim());
    setAiSearching(false);
    if (result.ok) setAiMatchIds(new Set(result.ids ?? []));
    else setAiError(result.error ?? "AI search failed.");
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <div className="chip mb-2">Media Library</div>
          <h1 className="font-display italic text-3xl md:text-4xl gold-gradient">Media</h1>
          <p className="text-[13px] text-[var(--text-dim)] mt-1 max-w-2xl">
            Every photo, video clip, and song uploaded anywhere in the project lands here,
            so it can be reused across Event Flow beats, talent references, and shows
            without re-uploading.
          </p>
          <p className="text-[11px] text-[var(--text-faint)] mt-1">
            Images up to 8MB. Video clips and songs up to 150MB.
          </p>
        </div>
        {canWrite && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddLinkOpen(true)}
              className="btn py-1.5 px-3 text-[12.5px]"
            >
              + Add link
            </button>
            <label className="btn btn-emerald py-1.5 px-3 text-[12.5px] cursor-pointer">
              {busy ? (uploadPct !== null ? `Uploading… ${uploadPct}%` : "Uploading…") : "+ Upload"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[12.5px] mb-3" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setAiMatchIds(null);
            setAiError("");
          }}
          placeholder={`Search ${mediaAssets.length} items…`}
          className="w-56"
        />
        <button
          onClick={handleAiSearch}
          disabled={!query.trim() || aiSearching}
          className="btn py-1.5 px-3 text-[12px] disabled:opacity-50"
          title="Let AI guess related matches, even if the exact words aren't in the name"
        >
          {aiSearching ? "Searching…" : "✨ AI search"}
        </button>
        {aiMatchIds && (
          <span className="text-[12px] text-[var(--text-faint)] flex items-center gap-2">
            ✨ {aiMatchIds.size} AI match{aiMatchIds.size === 1 ? "" : "es"} for “{query.trim()}”
            <button
              onClick={() => setAiMatchIds(null)}
              className="emerald-text hover:underline"
            >
              Clear
            </button>
          </span>
        )}
        {aiError && (
          <span className="text-[12px]" style={{ color: "var(--danger)" }}>
            {aiError}
          </span>
        )}
      </div>

      <div className="flex gap-1 panel-2 p-1 mb-4 w-fit">
        {(["all", "image", "video", "audio", "link"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="nav-link"
            style={
              filter === f
                ? { color: "var(--gold-bright)", background: "rgba(217,180,90,0.12)" }
                : {}
            }
          >
            {kindLabels[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="panel px-6 py-12 text-center text-[13px] text-[var(--text-faint)]">
          {mediaAssets.length === 0
            ? "No media uploaded yet."
            : aiMatchIds
            ? "No AI matches for that search."
            : "No media matches this filter."}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((a) => (
            <div key={a.id} className="panel-2 overflow-hidden">
              {a.kind === "audio" ? (
                <div
                  className="relative aspect-video flex flex-col items-center justify-center gap-1.5 px-2"
                  style={{ background: "var(--bg-soft)" }}
                >
                  <span style={{ fontSize: 22 }}>🎵</span>
                  <audio
                    src={a.url}
                    controls
                    preload="none"
                    className="w-full"
                    style={{ height: 28 }}
                  />
                </div>
              ) : a.kind === "link" ? (
                <a
                  href={a.linkUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-video flex flex-col items-center justify-center gap-1 px-2 text-center hover:brightness-110 transition-[filter]"
                  style={{ background: "var(--bg-soft)" }}
                  title={a.linkUrl ?? ""}
                >
                  <span style={{ fontSize: 22 }}>🔗</span>
                  <span className="text-[10px] text-[var(--text-faint)] truncate max-w-full">
                    {(() => {
                      try {
                        return new URL(a.linkUrl ?? "").hostname.replace(/^www\./, "");
                      } catch {
                        return a.linkUrl;
                      }
                    })()}
                  </span>
                </a>
              ) : (
                <div className="relative aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.kind === "video" ? a.posterUrl ?? VIDEO_PLACEHOLDER_POSTER : a.url}
                    alt={a.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  {a.kind === "video" && (
                    <span className="absolute top-1.5 right-1.5 chip py-0.5 px-1.5" style={{ fontSize: 9 }}>
                      video
                    </span>
                  )}
                </div>
              )}
              <div className="px-2 py-2">
                {editingId === a.id ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-[11px] py-0.5"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="text-[11px] emerald-text shrink-0">
                      ✓
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] font-medium truncate" title={a.name}>
                    {a.name}
                  </div>
                )}
                {canWrite && editingId !== a.id && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => startEdit(a)}
                      className="text-[10px] text-[var(--text-faint)] hover:text-[var(--gold-bright)]"
                    >
                      ✎ rename
                    </button>
                    <button
                      onClick={() => handleRemove(a.id)}
                      className="text-[10px] text-[var(--text-faint)] hover:text-[var(--danger)]"
                    >
                      ✕ delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {addLinkOpen && (
        <AddLinkModal
          onClose={() => setAddLinkOpen(false)}
          onAdd={async (url, name) => addMediaLink(PROJECT_SLUG, url, name)}
        />
      )}
    </div>
  );
}

function AddLinkModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (url: string, name?: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!url.trim()) return;
    setBusy(true);
    setError("");
    const result = await onAdd(url.trim(), name.trim() || undefined);
    setBusy(false);
    if (result.ok) onClose();
    else setError(result.error ?? "Failed to add link.");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md panel px-6 py-6 fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold gold-text">Add a reference link</h3>
          <button onClick={onClose} className="btn px-3 py-1.5">
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
              URL
            </span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/…"
              className="w-full mt-1"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
              Name (optional)
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Defaults to the link's domain"
              className="w-full mt-1"
            />
          </label>
          {error && (
            <p className="text-[12px]" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn px-4 py-2">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !url.trim()}
            className="btn btn-gold px-4 py-2 disabled:opacity-60"
          >
            {busy ? "Adding…" : "Add link"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

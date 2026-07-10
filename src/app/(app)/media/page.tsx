"use client";

import { useMemo, useState } from "react";
import { useDeck } from "@/store/useDeck";
import { MediaAsset, MediaAssetKind, VIDEO_PLACEHOLDER_POSTER } from "@/data/media";

const PROJECT_SLUG = "jw-gala-garden-night";

export default function MediaLibraryPage() {
  const mediaAssets = useDeck((s) => s.mediaAssets);
  const myRole = useDeck((s) => s.myRole);
  const uploadMediaAsset = useDeck((s) => s.uploadMediaAsset);
  const renameMediaAsset = useDeck((s) => s.renameMediaAsset);
  const removeMediaAsset = useDeck((s) => s.removeMediaAsset);
  const canWrite = myRole === "owner" || myRole === "editor";

  const [filter, setFilter] = useState<MediaAssetKind | "all">("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const filtered = useMemo(
    () => (filter === "all" ? mediaAssets : mediaAssets.filter((a) => a.kind === filter)),
    [mediaAssets, filter]
  );

  const handleUpload = async (file: File) => {
    setError("");
    setBusy(true);
    const result = await uploadMediaAsset(PROJECT_SLUG, file);
    setBusy(false);
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
        </div>
        {canWrite && (
          <label className="btn btn-emerald py-1.5 px-3 text-[12.5px] cursor-pointer">
            {busy ? "Uploading…" : "+ Upload"}
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
        )}
      </div>

      {error && (
        <p className="text-[12.5px] mb-3" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <div className="flex gap-1 panel-2 p-1 mb-4 w-fit">
        {(["all", "image", "video", "audio"] as const).map((f) => (
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
            {f === "all" ? "All" : f === "image" ? "Photos" : f === "video" ? "Videos" : "Songs"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="panel px-6 py-12 text-center text-[13px] text-[var(--text-faint)]">
          {mediaAssets.length === 0
            ? "No media uploaded yet."
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
    </div>
  );
}

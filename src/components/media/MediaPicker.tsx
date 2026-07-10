"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useDeck } from "@/store/useDeck";
import { MediaAsset, VIDEO_PLACEHOLDER_POSTER } from "@/data/media";
import { MediaItem } from "@/data/runOfShow";

// Beat galleries only hold photos/videos (tap-to-play), so audio assets never
// reach this — the library list below excludes them.
export function assetToMediaItem(asset: MediaAsset): MediaItem {
  return {
    type: asset.kind === "video" ? "video" : "image",
    src: asset.url,
    poster: asset.kind === "video" ? asset.posterUrl ?? VIDEO_PLACEHOLDER_POSTER : undefined,
    label: asset.name,
  };
}

type Tab = "upload" | "library";

export function MediaPicker({
  slug,
  onClose,
  onPick,
}: {
  slug: string;
  onClose: () => void;
  onPick: (item: MediaItem, asset: MediaAsset) => void;
}) {
  // Beat galleries only hold photos/videos — audio lives in the Media
  // Library but isn't pickable here.
  const mediaAssets = useDeck((s) => s.mediaAssets).filter((a) => a.kind !== "audio");
  const uploadMediaAsset = useDeck((s) => s.uploadMediaAsset);

  const [tab, setTab] = useState<Tab>("upload");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (file: File) => {
    setError("");
    setBusy(true);
    const result = await uploadMediaAsset(slug, file, name || undefined);
    setBusy(false);
    if (result.ok && result.asset) {
      onPick(assetToMediaItem(result.asset), result.asset);
      onClose();
    } else {
      setError(result.error ?? "Upload failed.");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[85vh] overflow-y-auto panel px-6 py-6 fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold gold-text">Add photo or video</h3>
          <button onClick={onClose} className="btn px-3 py-1.5">
            ✕
          </button>
        </div>

        <div className="flex gap-1 panel-2 p-1 mb-4 w-fit">
          {(["upload", "library"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="nav-link"
              style={
                tab === t
                  ? { color: "var(--gold-bright)", background: "rgba(217,180,90,0.12)" }
                  : {}
              }
            >
              {t === "upload" ? "Upload new" : `From library (${mediaAssets.length})`}
            </button>
          ))}
        </div>

        {tab === "upload" ? (
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="w-full"
            />
            <label className="btn btn-emerald px-3 py-2 text-[12.5px] cursor-pointer inline-block">
              {busy ? "Uploading…" : "Choose photo or video"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
            <p className="text-[11px] text-[var(--text-faint)]">
              Images up to 8MB. Video clips up to 50MB — for longer footage, paste a
              YouTube/Vimeo link instead.
            </p>
          </div>
        ) : mediaAssets.length === 0 ? (
          <p className="text-[13px] text-[var(--text-faint)] py-6 text-center">
            No media uploaded yet — switch to &quot;Upload new&quot;.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {mediaAssets.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  onPick(assetToMediaItem(a), a);
                  onClose();
                }}
                className="panel-2 overflow-hidden text-left group"
                title={`Use "${a.name}"`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.kind === "video" ? a.posterUrl ?? VIDEO_PLACEHOLDER_POSTER : a.url}
                  alt={a.name}
                  loading="lazy"
                  className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="px-2 py-1.5 text-[11px] truncate">{a.name}</div>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-[12.5px] mt-3" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}

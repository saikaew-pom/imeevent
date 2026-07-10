"use client";

import { useState } from "react";
import { useDeck } from "@/store/useDeck";
import { Talent, NewTalentInput } from "@/data/talent";

const PROJECT_SLUG = "jw-gala-garden-night";

export function TalentFormModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: Talent; // present when editing an existing talent
  onClose: () => void;
  onSubmit: (input: NewTalentInput) => Promise<{ ok: boolean; error?: string }>;
}) {
  const uploadMediaAsset = useDeck((s) => s.uploadMediaAsset);

  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [photoKey, setPhotoKey] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? "");

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoFile = async (file: File) => {
    setError("");
    setUploadingPhoto(true);
    const previous = photoUrl;
    const localPreview = URL.createObjectURL(file);
    setPhotoUrl(localPreview);
    try {
      // Uploading via the media-library endpoint (not the plain /upload one)
      // so this photo also becomes reusable in the master Media Library.
      const result = await uploadMediaAsset(PROJECT_SLUG, file, `${name || "Talent"} photo`);
      if (!result.ok || !result.asset) throw new Error(result.error ?? "Upload failed.");
      setPhotoUrl(result.asset.url);
      setPhotoKey(result.asset.fileKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setPhotoUrl(previous);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submit = async () => {
    if (!name.trim()) return;
    setError("");
    setSaving(true);
    const result = await onSubmit({
      name,
      role,
      description,
      photoKey: photoKey ?? undefined,
      videoUrl: videoUrl || null,
      linkUrl: linkUrl || null,
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
            {initial ? "Edit talent" : "New talent"}
          </h3>
          <button onClick={onClose} className="btn px-3 py-1.5">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. FineDay Band"
              className="w-full"
            />
          </Field>
          <Field label="Role">
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. MC, Live band, Florist"
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

          <Field label="Photo">
            <div className="flex items-center gap-3">
              {photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt=""
                  className="w-16 h-16 rounded-md object-cover border"
                  style={{ borderColor: "var(--border)" }}
                />
              )}
              <label className="btn px-3 py-1.5 text-[12.5px] cursor-pointer">
                {uploadingPhoto ? "Uploading…" : photoUrl ? "Change photo" : "Upload photo"}
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
          </Field>

          <Field label="Reference video (optional)">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
              className="w-full"
            />
          </Field>
          <Field label="Link (optional)">
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://…"
              className="w-full"
            />
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
            disabled={saving || uploadingPhoto}
            className="btn btn-gold px-4 py-2 disabled:opacity-60"
          >
            {saving ? "Saving…" : initial ? "Save changes" : "Add talent"}
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

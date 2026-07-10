"use client";

import { useState } from "react";
import { Slide } from "@/data/slides";
import { useProjectSlug } from "@/components/ProjectProvider";

export function SlideEditorModal({
  initial,
  onClose,
  onSave,
  hidePhoto,
}: {
  initial: { title: string; subtitle: string; body: string; imageUrl?: string };
  onClose: () => void;
  onSave: (patch: Partial<Slide>) => void;
  hidePhoto?: boolean;
}) {
  const PROJECT_SLUG = useProjectSlug();
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [body, setBody] = useState(initial.body);
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);
    const previous = imageUrl;
    const localPreview = URL.createObjectURL(file);
    setImageUrl(localPreview);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/builder/upload?slug=${encodeURIComponent(PROJECT_SLUG)}`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setImageUrl(data.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setImageUrl(previous);
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    if (uploading) return;
    onSave({ title, subtitle, body, imageUrl: imageUrl || undefined });
    onClose();
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
          <h3 className="text-lg font-semibold gold-text">Edit slide</h3>
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
              className="w-full"
            />
          </Field>
          <Field label="Subtitle">
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full"
            />
          </Field>
          <Field label="Body">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
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
          {!hidePhoto && (
          <Field label="Photo">
            <div className="flex items-center gap-3">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="w-20 h-14 rounded-md object-cover border"
                  style={{ borderColor: "var(--border)" }}
                />
              )}
              <label className="btn px-3 py-1.5 text-[12.5px] cursor-pointer">
                {uploading ? "Uploading…" : imageUrl ? "Change photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </Field>
          )}
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
            onClick={save}
            disabled={uploading}
            className="btn btn-gold px-4 py-2 disabled:opacity-60"
          >
            Save
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

"use client";

import { useState } from "react";
import { NewDocumentInput } from "@/data/documents";
import { extractPdfText } from "@/lib/pdf";
import { useProjectSlug } from "@/components/ProjectProvider";

type Mode = "file" | "text";

export function AddDocumentModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (input: NewDocumentInput) => Promise<{ ok: boolean; error?: string }>;
}) {
  const PROJECT_SLUG = useProjectSlug();
  const [mode, setMode] = useState<Mode>("file");
  const [name, setName] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // For file mode we prep these before submitting.
  const [pending, setPending] = useState<NewDocumentInput | null>(null);

  const handleFile = async (file: File) => {
    setError("");
    setStatus("");
    setPending(null);
    if (!name) setName(file.name.replace(/\.[^.]+$/, ""));
    setBusy(true);
    try {
      if (file.type === "application/pdf") {
        setStatus("Reading PDF…");
        const text = await extractPdfText(file);
        const key = await uploadFile(file);
        setPending({
          name: name || file.name.replace(/\.[^.]+$/, ""),
          kind: "pdf",
          fileKey: key,
          textContent: text,
          mime: file.type,
        });
        setStatus(`PDF ready — ${text.length.toLocaleString()} characters of text.`);
      } else if (file.type.startsWith("image/")) {
        setStatus("Uploading image…");
        const key = await uploadFile(file);
        setPending({
          name: name || file.name.replace(/\.[^.]+$/, ""),
          kind: "image",
          fileKey: key,
          textContent: null,
          mime: file.type,
        });
        setStatus("Image ready — the AI will read it directly.");
      } else {
        setError("Only PDF or image files are supported.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not process the file.");
    } finally {
      setBusy(false);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(
      `/api/builder/documents/upload?slug=${encodeURIComponent(PROJECT_SLUG)}`,
      { method: "POST", body: form }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Upload failed.");
    return data.key as string;
  };

  const submit = async () => {
    setError("");
    let input: NewDocumentInput | null = null;
    if (mode === "text") {
      if (!pastedText.trim()) {
        setError("Paste some text first.");
        return;
      }
      input = {
        name: name.trim() || "Pasted note",
        kind: "text",
        textContent: pastedText,
      };
    } else {
      if (!pending) {
        setError("Choose a PDF or image first.");
        return;
      }
      input = { ...pending, name: name.trim() || pending.name };
    }
    setBusy(true);
    const result = await onAdd(input);
    setBusy(false);
    if (result.ok) onClose();
    else setError(result.error ?? "Failed to add document.");
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
          <h3 className="text-lg font-semibold gold-text">Add document</h3>
          <button onClick={onClose} className="btn px-3 py-1.5">
            ✕
          </button>
        </div>

        <div className="flex gap-1 panel-2 p-1 mb-4 w-fit">
          {(["file", "text"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="nav-link"
              style={
                mode === m
                  ? { color: "var(--gold-bright)", background: "rgba(217,180,90,0.12)" }
                  : {}
              }
            >
              {m === "file" ? "Upload PDF / image" : "Paste text"}
            </button>
          ))}
        </div>

        <label className="block mb-3">
          <span className="text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
            Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. FineDay Band contract"
            className="w-full mt-1"
          />
        </label>

        {mode === "file" ? (
          <div>
            <label className="btn px-3 py-2 text-[12.5px] cursor-pointer inline-block">
              {busy ? "Working…" : pending ? "Choose a different file" : "Choose PDF or image"}
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
            </label>
            {status && (
              <p className="text-[12px] mt-2" style={{ color: "var(--emerald-bright)" }}>
                {status}
              </p>
            )}
          </div>
        ) : (
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={8}
            placeholder="Paste the contract, quote, or brief text here…"
            className="w-full text-[13px]"
            style={{
              background: "var(--bg-soft)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 10px",
              color: "var(--text)",
              resize: "vertical",
            }}
          />
        )}

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
            disabled={busy}
            className="btn btn-gold px-4 py-2 disabled:opacity-60"
          >
            {busy ? "Working…" : "Add document"}
          </button>
        </div>
      </div>
    </div>
  );
}

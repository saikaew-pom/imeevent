"use client";

import { RefObject, useState } from "react";
import { useDeck } from "@/store/useDeck";
import { exportElementToPdf } from "@/lib/exportPdf";

export function ExportSaveButtons({
  targetRef,
  filename,
  canWrite,
}: {
  targetRef: RefObject<HTMLDivElement | null>;
  filename: string;
  canWrite: boolean;
}) {
  const saveFinancialsNow = useDeck((s) => s.saveFinancialsNow);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [exporting, setExporting] = useState(false);

  const save = async () => {
    setSaveState("saving");
    const res = await saveFinancialsNow();
    setSaveState(res.ok ? "saved" : "idle");
    if (res.ok) setTimeout(() => setSaveState("idle"), 2000);
  };

  const exportPdf = async () => {
    if (!targetRef.current) return;
    setExporting(true);
    try {
      await exportElementToPdf(targetRef.current, filename);
    } catch {
      alert("PDF export failed — try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-2" data-export-hide>
      {canWrite && (
        <button onClick={save} disabled={saveState === "saving"} className="btn">
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : "Save"}
        </button>
      )}
      <button onClick={exportPdf} disabled={exporting} className="btn">
        {exporting ? "Exporting…" : "⬇ Export PDF"}
      </button>
    </div>
  );
}

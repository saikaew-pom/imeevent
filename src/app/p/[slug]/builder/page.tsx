"use client";

import { PresetBar } from "@/components/builder/PresetBar";
import { ActLibrary } from "@/components/builder/ActLibrary";
import { LineupPanel } from "@/components/builder/LineupPanel";

export default function BuilderPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8">
      <div className="mb-5">
        <div className="chip mb-2">Module 02 · Show &amp; Decor Designer</div>
        <h1 className="font-display italic text-3xl md:text-4xl gold-gradient">
          Show &amp; Decor Builder
        </h1>
        <p className="text-[13px] text-[var(--text-dim)] mt-1 max-w-2xl">
          Add your own shows or decor/element items, then pick acts into the four
          slots of the night. The vibe curve redraws live from whatever you link in
          Event Flow — decor items skip energy and placement; they&apos;re
          reference/costing only.
        </p>
      </div>

      <PresetBar />

      <div className="grid lg:grid-cols-[1fr_390px] gap-4 mt-4 items-start">
        <ActLibrary />
        <div className="lg:sticky lg:top-[72px]">
          <LineupPanel />
        </div>
      </div>
    </div>
  );
}

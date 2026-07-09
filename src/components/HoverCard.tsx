"use client";

import { ReactNode } from "react";

// A lightweight hover tooltip: wraps a trigger and shows `content` on hover.
export function HoverCard({
  trigger,
  content,
  width = 280,
}: {
  trigger: ReactNode;
  content: ReactNode;
  width?: number;
}) {
  return (
    <span className="relative inline-flex group/hc align-middle">
      {trigger}
      <span
        className="pointer-events-none absolute left-0 top-full mt-1.5 z-50 opacity-0 translate-y-1 group-hover/hc:opacity-100 group-hover/hc:translate-y-0 transition-all duration-150"
        style={{ width }}
      >
        <span
          className="block panel-2 px-3 py-2.5 text-left shadow-xl"
          style={{
            background: "var(--panel-2)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
        >
          {content}
        </span>
      </span>
    </span>
  );
}

// A small ⓘ info dot that reveals text on hover.
export function InfoDot({ text, width }: { text: string; width?: number }) {
  return (
    <HoverCard
      width={width}
      trigger={
        <span
          className="inline-flex items-center justify-center rounded-full text-[9px] cursor-help ml-1"
          style={{
            width: 14,
            height: 14,
            border: "1px solid var(--border)",
            color: "var(--text-faint)",
          }}
        >
          i
        </span>
      }
      content={
        <span className="text-[11.5px] text-[var(--text-dim)] leading-relaxed">
          {text}
        </span>
      }
    />
  );
}

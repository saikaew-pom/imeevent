"use client";

import { useState } from "react";
import { MediaItem } from "@/data/runOfShow";

export function MediaGallery({ items }: { items: MediaItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  if (!items || items.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {items.map((m, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            className="relative aspect-video rounded-lg overflow-hidden border hairline group"
            title={m.label}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.type === "video" ? m.poster : m.src}
              alt={m.label ?? ""}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {m.type === "video" && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(10,15,13,0.6)", backdropFilter: "blur(2px)" }}
                >
                  <span
                    style={{
                      borderLeft: "11px solid var(--gold-bright)",
                      borderTop: "7px solid transparent",
                      borderBottom: "7px solid transparent",
                      marginLeft: 3,
                    }}
                  />
                </span>
              </span>
            )}
          </button>
        ))}
      </div>

      {open !== null && (
        <Lightbox
          items={items}
          index={open}
          onClose={() => setOpen(null)}
          onNav={(d) =>
            setOpen((x) =>
              x === null ? x : (x + d + items.length) % items.length
            )
          }
        />
      )}
    </>
  );
}

function Lightbox({
  items,
  index,
  onClose,
  onNav,
}: {
  items: MediaItem[];
  index: number;
  onClose: () => void;
  onNav: (d: number) => void;
}) {
  const m = items[index];
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 btn px-3 py-1.5 z-10"
      >
        ✕
      </button>
      {items.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNav(-1);
            }}
            className="absolute left-4 btn px-3 py-2 z-10"
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNav(1);
            }}
            className="absolute right-4 btn px-3 py-2 z-10"
          >
            →
          </button>
        </>
      )}
      <div
        className="max-w-5xl w-full max-h-[85vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {m.type === "video" ? (
          <video
            key={m.src}
            src={m.src}
            poster={m.poster}
            controls
            autoPlay
            playsInline
            className="max-h-[80vh] w-auto rounded-xl border hairline"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.src}
            alt={m.label ?? ""}
            className="max-h-[80vh] w-auto rounded-xl border hairline"
          />
        )}
        {m.label && (
          <div className="text-[13px] text-[var(--text-dim)] mt-3">
            {m.label}
            {items.length > 1 && (
              <span className="text-[var(--text-faint)]">
                {" "}
                · {index + 1}/{items.length}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

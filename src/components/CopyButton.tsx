"use client";

import { CSSProperties, useState } from "react";

// Copies a value to the clipboard with brief "Copied ✓" feedback. Used for the
// guest passcode on the admin page — a passcode is meant to be shared, so the
// useful affordance is one-click copy (not masking it, which would just make
// the admin reveal it every time they need to send it to a client).
export function CopyButton({
  value,
  className,
  style,
}: {
  value: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard blocked (e.g. insecure context) — no-op; the passcode is
          // visible on screen for manual copy either way.
        }
      }}
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

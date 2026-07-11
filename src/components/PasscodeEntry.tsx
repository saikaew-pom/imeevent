"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ink, sub, border, danger } from "@/lib/notionTheme";

function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5v-9zM12 15v2" />
    </svg>
  );
}

// A public, project-agnostic passcode entry: the code alone resolves the
// project server-side, so no project name is ever exposed on the landing page.
export function PasscodeEntry({ variant = "outline" }: { variant?: "outline" | "link" }) {
  const [open, setOpen] = useState(false);

  const trigger =
    variant === "link" ? (
      <button
        onClick={() => setOpen(true)}
        className="text-[14px] font-medium underline underline-offset-2"
        style={{ color: sub }}
      >
        Have a passcode?
      </button>
    ) : (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-[14px] font-medium px-4 py-2.5 rounded-[8px]"
        style={{ border: `1px solid ${border}`, color: ink }}
      >
        <LockIcon size={15} />
        Enter a passcode
      </button>
    );

  return (
    <>
      {trigger}
      {open && <PasscodeModal onClose={() => setOpen(false)} />}
    </>
  );
}

function PasscodeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!value.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.slug) {
        setError(data.error ?? "Incorrect passcode.");
        setLoading(false);
        return;
      }
      router.push(`/p/${data.slug}/dashboard`);
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 font-sans"
      style={{ background: "rgba(55,53,47,0.35)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[10px] px-7 py-8 text-center"
        style={{
          background: "#ffffff",
          border: `1px solid ${border}`,
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
          color: ink,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-9 h-9 rounded-[8px] flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(55,53,47,0.05)" }}
        >
          <LockIcon />
        </div>
        <h3 className="text-[16px] font-semibold mb-1">Enter your passcode</h3>
        <p className="text-[13px] mb-5" style={{ color: sub }}>
          Instant, view-only access to the deck you were invited to.
        </p>
        <input
          type="password"
          value={value}
          autoFocus
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Passcode"
          className="w-full text-center mb-2 text-[14px] rounded-[7px] px-3 py-2.5 outline-none"
          style={{ border: `1px solid ${error ? danger : border}`, color: ink }}
        />
        {error && (
          <p className="text-[12px] mb-2" style={{ color: danger }}>
            {error}
          </p>
        )}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[7px] text-[13.5px] font-medium"
            style={{ border: `1px solid ${border}`, color: ink }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-[7px] text-[13.5px] font-medium"
            style={{ background: ink, color: "#fff", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Entering…" : "Enter"}
          </button>
        </div>
        <p className="text-[12px] mt-5" style={{ color: sub }}>
          Have an account?{" "}
          <Link href="/login" className="underline" style={{ color: ink }}>
            Sign in
          </Link>{" "}
          instead.
        </p>
      </div>
    </div>
  );
}

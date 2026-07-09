"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ink, sub, border, hoverBg, danger } from "@/lib/notionTheme";

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

function ArrowIcon({ size = 14 }: { size?: number }) {
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
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function ProjectPasscodeCard({
  slug,
  name,
  subtitle,
  dashboardHref,
}: {
  slug: string;
  name: string;
  subtitle: string;
  dashboardHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left flex items-center gap-3.5 px-4 py-3.5 rounded-[8px] transition-colors group"
        style={{ border: `1px solid ${border}` }}
        onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span
          className="w-9 h-9 rounded-[7px] flex items-center justify-center shrink-0"
          style={{ background: hoverBg, color: sub }}
        >
          <LockIcon />
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-[14.5px] font-semibold" style={{ color: ink }}>
              {name}
            </span>
            <span
              className="text-[11px] font-medium px-1.5 py-[1px] rounded-full"
              style={{ border: `1px solid ${border}`, color: sub }}
            >
              Private
            </span>
          </span>
          <span className="block text-[12.5px] mt-0.5" style={{ color: sub }}>
            {subtitle}
          </span>
        </span>
        <span
          className="text-[13px] font-medium flex items-center gap-1 shrink-0"
          style={{ color: ink }}
        >
          Enter passcode
          <ArrowIcon />
        </span>
      </button>

      {open && (
        <PasscodeModal
          slug={slug}
          name={name}
          dashboardHref={dashboardHref}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function PasscodeModal({
  slug,
  name,
  dashboardHref,
  onClose,
}: {
  slug: string;
  name: string;
  dashboardHref: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, passcode: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push(dashboardHref);
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
        <h3 className="text-[16px] font-semibold mb-1">{name}</h3>
        <p className="text-[13px] mb-5" style={{ color: sub }}>
          Enter the passcode for instant, view-only access.
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

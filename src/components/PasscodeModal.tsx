"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unlock } from "@/lib/gate";

const PASSCODE = "cheewitcheewa";
const ink = "#37352F";
const sub = "#787774";
const border = "rgba(55,53,47,0.12)";

export function PasscodeModal({
  projectName,
  onClose,
}: {
  projectName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const submit = () => {
    if (value.trim().toLowerCase() === PASSCODE) {
      setChecking(true);
      unlock();
      router.push("/dashboard");
    } else {
      setError(true);
      setValue("");
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
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5v-9zM12 15v2" />
          </svg>
        </div>
        <h3 className="text-[16px] font-semibold mb-1">{projectName}</h3>
        <p className="text-[13px] mb-5" style={{ color: sub }}>
          Enter the project passcode to continue.
        </p>
        <input
          type="password"
          value={value}
          autoFocus
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Passcode"
          className="w-full text-center mb-2 text-[14px] rounded-[7px] px-3 py-2.5 outline-none"
          style={{
            border: `1px solid ${error ? "#e03e3e" : border}`,
            color: ink,
            background: "#fff",
          }}
        />
        {error && (
          <p className="text-[12px] mb-2" style={{ color: "#e03e3e" }}>
            Incorrect passcode — try again.
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
            disabled={checking}
            className="flex-1 py-2.5 rounded-[7px] text-[13.5px] font-medium"
            style={{ background: ink, color: "#fff", opacity: checking ? 0.6 : 1 }}
          >
            {checking ? "Entering…" : "Enter"}
          </button>
        </div>
      </div>
    </div>
  );
}

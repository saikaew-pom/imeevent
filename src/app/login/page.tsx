"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ink, sub, border, danger } from "@/lib/notionTheme";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push("/projects");
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center font-sans px-4"
      style={{ background: "#ffffff", color: ink }}
    >
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <span
            className="inline-flex items-center justify-center rounded-[6px] w-5 h-5 text-[11px] font-bold"
            style={{ background: ink, color: "#fff" }}
          >
            E
          </span>
          <span className="text-[14px] font-semibold">EventFlow Production</span>
        </div>

        <h1 className="text-[20px] font-semibold text-center mb-1">Sign in</h1>
        <p className="text-[13px] text-center mb-6" style={{ color: sub }}>
          Access is by invitation — ask your admin if you don&apos;t have an account.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: sub }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-[14px] rounded-[7px] px-3 py-2.5 outline-none"
              style={{ border: `1px solid ${border}`, color: ink }}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: sub }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-[14px] rounded-[7px] px-3 py-2.5 outline-none"
              style={{ border: `1px solid ${border}`, color: ink }}
            />
          </div>
          {error && (
            <p className="text-[12.5px]" style={{ color: danger }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-[7px] text-[13.5px] font-medium mt-2"
            style={{ background: ink, color: "#fff", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <Link
          href="/"
          className="block text-center text-[12.5px] mt-6 hover:underline"
          style={{ color: sub }}
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const signOut = async () => {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <button onClick={signOut} disabled={loading} className={className} style={style}>
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}

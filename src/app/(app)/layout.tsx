"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { isUnlocked } from "@/lib/gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isUnlocked()) {
      setReady(true);
    } else {
      router.replace("/");
    }
  }, [router]);

  if (!ready) return null;

  return (
    <>
      <NavBar />
      <main className="flex-1">{children}</main>
    </>
  );
}

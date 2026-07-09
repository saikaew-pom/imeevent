"use client";

// Lightweight client-side project gate — not real security, just a soft
// passcode wall in front of the demo dashboard.
const KEY = "jw-gala-unlocked";

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEY) === "1";
}

export function unlock() {
  if (typeof window !== "undefined") sessionStorage.setItem(KEY, "1");
}

export function lock() {
  if (typeof window !== "undefined") sessionStorage.removeItem(KEY);
}

"use client";

import { useEffect, useState } from "react";

// A number input that displays thousand separators (100,000 instead of
// 100000) while still committing a plain number via onChange. Native
// type="number" can't show comma formatting at all, so this is a text input
// underneath: shows the raw digits while focused (so typing/cursor behaves
// normally), reformats with commas on blur.
export function MoneyInput({
  value,
  onChange,
  className,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState(String(value));

  // Keep the unfocused display in sync with external value changes (e.g.
  // another field recalculating this one) without clobbering active typing.
  useEffect(() => {
    if (!focused) setRaw(String(value));
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      className={className}
      value={focused ? raw : value.toLocaleString("en-US")}
      onFocus={() => {
        setRaw(String(value));
        setFocused(true);
      }}
      onChange={(e) => {
        // Strip anything that isn't a digit, minus sign, or decimal point —
        // covers pasted "1,000.50"-style input too.
        const cleaned = e.target.value.replace(/[^\d.-]/g, "");
        setRaw(cleaned);
        const parsed = Number(cleaned);
        onChange(Number.isFinite(parsed) ? parsed : 0);
      }}
      onBlur={() => setFocused(false)}
    />
  );
}

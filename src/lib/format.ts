// Supported project currencies. `symbol` drives the short format; the full
// format uses Intl currency formatting. No FX conversion — a project holds a
// single currency for both display and entry.
export type CurrencyCode =
  | "THB" | "USD" | "EUR" | "CNY" | "INR" | "GBP" | "SGD" | "AED" | "JPY" | "AUD";

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "THB", label: "Thai Baht", symbol: "฿" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "CNY", label: "Chinese Yuan (RMB)", symbol: "¥" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$" },
  { code: "AED", label: "UAE Dirham", symbol: "AED" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
];

const SYMBOLS: Record<CurrencyCode, string> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c.symbol])
) as Record<CurrencyCode, string>;

// Full currency format, no decimals (event budgets are whole-unit).
export const money = (n: number, currency: CurrencyCode = "THB") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

// Compact format for charts / stat chips: ฿1.20M, $45k, €900.
export const moneyShort = (n: number, currency: CurrencyCode = "THB") => {
  const s = SYMBOLS[currency] ?? "";
  if (Math.abs(n) >= 1_000_000) return `${s}${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${s}${(n / 1_000).toFixed(0)}k`;
  return `${s}${n}`;
};

// THB-locked wrappers, kept for genuinely-THB data (the JW 2023–2025 historical
// benchmark in data/history.ts is all THB and must not adopt a project currency).
export const thb = (n: number) => money(n, "THB");
export const thbShort = (n: number) => moneyShort(n, "THB");

export const pct = (n: number) => `${n.toFixed(1)}%`;

export function energyClass(energy: number) {
  if (energy <= 3) return "energy-low";
  if (energy <= 5) return "energy-mid";
  if (energy <= 8) return "energy-high";
  return "energy-max";
}

export function energyColor(energy: number) {
  if (energy <= 3) return "#8fb8d9";
  if (energy <= 5) return "#7fd3a8";
  if (energy <= 8) return "#f0cd77";
  return "#f0a05a";
}

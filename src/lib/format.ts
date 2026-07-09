export const thb = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(n);

export const thbShort = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `฿${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `฿${(n / 1_000).toFixed(0)}k`;
  return `฿${n}`;
};

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

import { FinancialAssumptions } from "@/data/financials";
import { CostGroupKey } from "@/data/costStructure";
import { CurrencyCode } from "@/lib/format";

export interface GroupTotal {
  key: CostGroupKey;
  value: number;
}

export interface PnL {
  totalRevenue: number;
  // cost
  showActs: number; // live from the Entertainment Builder lineup
  costLinesTotal: number; // sum of editable cost lines
  groupTotals: GroupTotal[]; // per main line item (production includes showActs)
  fnbCost: number;
  operatingCost: number; // total − fnb
  totalCost: number;
  // profit
  grossProfit: number;
  marginPct: number;
  // per-guest / benchmarks
  costPerGuest: number;
  revenuePerGuest: number;
  breakEvenQty: number;
  primaryTierName: string;
  entertainment: number; // ent-tagged lines + show acts
  entertainmentPctRev: number;
  pax: number;
  currency: CurrencyCode; // the project's currency (defaults THB on legacy records)
}

// showActsTHB comes from the built lineup (sum of act costs). It is added to the
// Production group as a live "show acts" line, on top of the editable cost lines.
export function computePnL(
  f: FinancialAssumptions,
  showActsTHB: number
): PnL {
  const pax = f.tiers.reduce((s, t) => s + t.qty, 0);
  const totalRevenue = f.tiers.reduce((s, t) => s + t.priceTHB * t.qty, 0);

  const costLinesTotal = f.costLines.reduce((s, l) => s + l.value, 0);
  const totalCost = costLinesTotal + showActsTHB;

  // Group subtotals (Production gets the live show-acts line added in).
  const groupKeys: CostGroupKey[] = ["tent", "production", "misc", "others", "fnb"];
  const groupTotals: GroupTotal[] = groupKeys.map((key) => {
    let value = f.costLines
      .filter((l) => l.group === key)
      .reduce((s, l) => s + l.value, 0);
    if (key === "production") value += showActsTHB;
    return { key, value };
  });

  const fnbCost = groupTotals.find((g) => g.key === "fnb")?.value ?? 0;
  const operatingCost = totalCost - fnbCost;

  const grossProfit = totalRevenue - totalCost;
  const marginPct = totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;

  const entertainment =
    showActsTHB +
    f.costLines.filter((l) => l.ent).reduce((s, l) => s + l.value, 0);

  // Break-even on the primary (first) tier, holding other tiers + all costs fixed.
  const primary = f.tiers[0];
  const otherRev = totalRevenue - (primary ? primary.priceTHB * primary.qty : 0);
  const breakEvenQty =
    primary && primary.priceTHB > 0
      ? Math.max(0, (totalCost - otherRev) / primary.priceTHB)
      : 0;

  return {
    totalRevenue,
    showActs: showActsTHB,
    costLinesTotal,
    groupTotals,
    fnbCost,
    operatingCost,
    totalCost,
    grossProfit,
    marginPct,
    costPerGuest: pax ? totalCost / pax : 0,
    revenuePerGuest: pax ? totalRevenue / pax : 0,
    breakEvenQty,
    primaryTierName: primary ? primary.name : "guests",
    entertainment,
    entertainmentPctRev: totalRevenue ? (entertainment / totalRevenue) * 100 : 0,
    pax,
    currency: f.currency ?? "THB",
  };
}

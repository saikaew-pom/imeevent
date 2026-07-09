// Real historical P&L for the JW Marriott Phuket NYE gala — LIKE-FOR-LIKE
// 2023–2025. Source: NYE_PnL_Comparison_2023-2025.xlsx (all THB, ex-tax).
// Structured to match the five main cost line items so the 2026 plan compares
// like-for-like. Sub-item values power the hover breakdowns.

import { CostGroupKey } from "./costStructure";

export const YEARS = [2023, 2024, 2025] as const;
export type YearTriple = [number, number, number];

// Revenue by package tier (ex-tax), and pax by tier.
export interface HistRevLine {
  label: string;
  values: YearTriple;
  pax?: YearTriple;
}

export const histRevenue: HistRevLine[] = [
  { label: "VVIP package", values: [543088, 912288, 1359936], pax: [26, 51, 72] },
  { label: "Adult Gold package", values: [789064, 708288, 387144], pax: [53, 51, 28] },
  { label: "Adult Silver package", values: [915376, 1154128, 1093696], pax: [77, 106, 92] },
  { label: "Child & Teen", values: [267500, 213000, 196000], pax: [69, 71, 56] },
  { label: "After Party", values: [139500, 18000, 0], pax: [31, 3, 0] },
  { label: "Beverage Additional", values: [0, 0, 24458] },
  { label: "A la carte (food/bev + tobacco)", values: [0, 0, 704] },
  { label: "Revenue adjustment / rebate", values: [0, -58232, 0] },
];

// Cost sub-items, tagged by main line-item group.
export interface HistCostLine {
  group: CostGroupKey;
  label: string;
  values: YearTriple;
  ent?: boolean;
}

export const histCosts: HistCostLine[] = [
  // Tent
  { group: "tent", label: "Main tent", values: [342400, 190080, 348000] },
  { group: "tent", label: "Food tents", values: [13908, 13500, 0] },
  // Production, AV, Decoration & Show
  {
    group: "production",
    label: "Entertainment, Sound, Lighting, LED, Band, DJ, MC",
    values: [1038756, 1238000, 1654260],
    ent: true,
  },
  { group: "production", label: "Centerpiece", values: [12000, 12000, 44475] },
  { group: "production", label: "Party pack", values: [50000, 50000, 0] },
  { group: "production", label: "Props on table", values: [0, 0, 12920] },
  { group: "production", label: "Kids corner (game & décor)", values: [5000, 5000, 0] },
  { group: "production", label: "Neon décor (body paint / mask)", values: [0, 0, 0] },
  { group: "production", label: "Band travel (air / transport / room)", values: [0, 0, 89600] },
  // Misc
  { group: "misc", label: "Wristband", values: [2940, 2625, 8000] },
  { group: "misc", label: "Ice for kitchen décor", values: [20000, 20000, 0] },
  { group: "misc", label: "MICS (menu papers / candles)", values: [5000, 5000, 0] },
  { group: "misc", label: "Ticket NYE + box + marker", values: [0, 0, 384] },
  { group: "misc", label: "Staff uniform", values: [12000, 12000, 36723] },
  { group: "misc", label: "Hostess uniform", values: [0, 0, 1595] },
  { group: "misc", label: "Lucky draw", values: [0, 0, 0] },
  { group: "misc", label: "Table runner", values: [5350, 5350, 0] },
  // Others
  { group: "others", label: "Department payroll (per day +37%)", values: [0, 0, 0] },
  { group: "others", label: "Casuals", values: [7500, 7500, 3360] },
  { group: "others", label: "Truck / logistics", values: [0, 0, 12000] },
  // Food & Beverage COGS
  { group: "fnb", label: "Food cost", values: [400910, 441608, 374900] },
  { group: "fnb", label: "Beverage cost", values: [368692, 393122, 394916] },
];

export const histSummary = {
  revenue: [2654528, 2947472, 3061938] as YearTriple,
  revenueIncTax: [3124379, 3472494, 3603901] as YearTriple,
  pax: [199, 279, 248] as YearTriple,
  operatingCost: [1514854, 1561055, 2211317] as YearTriple,
  fnbCost: [769602, 834730, 769816] as YearTriple,
  totalCost: [2284456, 2395785, 2981133] as YearTriple,
  gop: [370072, 551687, 80805] as YearTriple,
  margin: [13.94, 18.72, 2.64] as YearTriple,
  entertainment: [1038756, 1238000, 1654260] as YearTriple,
  rebateMemo: [-248962, -248962, -248962] as YearTriple,
};

// Per-group subtotal for a given year index (0=2023,1=2024,2=2025).
export function histGroupSubtotal(group: CostGroupKey, yi: number): number {
  return histCosts
    .filter((c) => c.group === group)
    .reduce((s, c) => s + c.values[yi], 0);
}

export function histGroupItems(group: CostGroupKey, yi: number) {
  return histCosts
    .filter((c) => c.group === group)
    .map((c) => ({ label: c.label, value: c.values[yi] }));
}

// Derived per-year helpers (used by benchmark cards).
const idx = YEARS.length - 1; // latest = 2025
export const lastYear = {
  year: YEARS[idx],
  revenue: histSummary.revenue[idx],
  totalCost: histSummary.totalCost[idx],
  gop: histSummary.gop[idx],
  margin: histSummary.margin[idx],
  pax: histSummary.pax[idx],
  entertainment: histSummary.entertainment[idx],
  entPctRevenue: (histSummary.entertainment[idx] / histSummary.revenue[idx]) * 100,
  revPerPax: histSummary.revenue[idx] / histSummary.pax[idx],
};

const avg = (a: readonly number[]) => a.reduce((s, n) => s + n, 0) / a.length;
export const historyAverages = {
  revenue: avg(histSummary.revenue),
  totalCost: avg(histSummary.totalCost),
  gop: avg(histSummary.gop),
  margin: avg(histSummary.margin),
  pax: avg(histSummary.pax),
  entertainment: avg(histSummary.entertainment),
  entPctRevenue: avg(
    histSummary.entertainment.map((e, i) => (e / histSummary.revenue[i]) * 100)
  ),
  revPerPax: avg(histSummary.revenue.map((r, i) => r / histSummary.pax[i])),
};

// For the year-by-year chart.
export const historyDerived = YEARS.map((year, i) => ({
  year,
  revenue: histSummary.revenue[i],
  totalCost: histSummary.totalCost[i],
  gop: histSummary.gop[i],
  margin: histSummary.margin[i],
  pax: histSummary.pax[i],
  entertainment: histSummary.entertainment[i],
  entPctRevenue: (histSummary.entertainment[i] / histSummary.revenue[i]) * 100,
}));

export const historyInsights = [
  {
    title: "Entertainment cost is the margin story",
    body: "The Entertainment / AV / band / DJ / MC line rose ฿1.04M → ฿1.65M (2023→2025) — +59% — while GOP margin fell from 14% to 2.6%. It is the single biggest lever.",
  },
  {
    title: "Production is where the money goes",
    body: "The Production/AV/Show block is ~75% of operating cost. Tent, Misc and labour are comparatively small and stable.",
  },
  {
    title: "F&B cost is steady, revenue is resilient",
    body: "F&B COGS held ~฿0.77–0.83M and revenue ฿2.65–3.06M across three years. 2025's squeeze came from the cost side (+24% total cost).",
  },
];

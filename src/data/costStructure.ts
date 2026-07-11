// The cost structure follows the like-for-like P&L (NYE_PnL_Comparison_2023-2025):
// five main line items, each with sub-items. Sub-items are editable in the 2026
// deep dive; the main line item = sum of its sub-items, and its hover description
// lists what's inside.

export type CostGroupKey = "tent" | "production" | "misc" | "others" | "fnb";

export interface CostGroupMeta {
  key: CostGroupKey;
  label: string;
  description: string; // shown on hover of the main line item
}

export const COST_GROUPS: CostGroupMeta[] = [
  {
    key: "tent",
    label: "Tent Rental",
    description:
      "Marquee & food-tent rental for outdoor / pond areas — main tent plus any food tents.",
  },
  {
    key: "production",
    label: "Production, AV, Decoration & Show",
    description:
      "The show and the room: entertainment / sound / lighting / LED, band / DJ / MC, centerpieces & florals, props, kids corner, neon décor and band travel.",
  },
  {
    key: "misc",
    label: "Misc",
    description:
      "Consumables & guest items: wristbands, tickets, staff & hostess uniforms, menu papers / candles, lucky draw, table runners, ice.",
  },
  {
    key: "others",
    label: "Others (labour & logistics)",
    description: "Ungrouped labour & logistics: department payroll, casual staff, truck / transport.",
  },
  {
    key: "fnb",
    label: "Food & Beverage Cost (COGS)",
    description: "Cost of goods sold — food cost plus beverage cost.",
  },
];

export const costGroupMeta = (key: CostGroupKey) =>
  COST_GROUPS.find((g) => g.key === key)!;

// An editable cost line (sub-item) in the 2026 model.
export interface CostLine {
  id: string;
  group: CostGroupKey;
  label: string;
  value: number; // THB
  note?: string; // extra hover context
  ent?: boolean; // counts toward the "entertainment %" benchmark
  day?: number; // 1-based event day/function this line belongs to — enables per-day spend breakdown
}


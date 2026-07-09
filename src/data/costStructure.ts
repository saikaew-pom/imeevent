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
}

// 2026 default cost lines — seeded off the 2025 actuals and adjusted for the JW
// ballroom + pond format (~230 pax, single VIP package). Fully editable.
// NOTE: live show-act cost from the Entertainment Builder is added on top of
// these as a separate synced line (see pnl.ts), so it is NOT duplicated here.
export const default2026CostLines: CostLine[] = [
  // Tent
  { id: "tent-main", group: "tent", label: "Main tent (pond / outdoor countdown)", value: 200000 },
  { id: "tent-food", group: "tent", label: "Food tents", value: 0 },
  // Production, AV, Decoration & Show
  { id: "prod-av", group: "production", label: "Sound, lighting, LED, staging & AV", value: 550000, ent: true },
  { id: "prod-band", group: "production", label: "Band, DJ & MC", value: 350000, ent: true },
  { id: "prod-centerpiece", group: "production", label: "Centerpiece & florals", value: 45000 },
  { id: "prod-props", group: "production", label: "Props on table", value: 13000 },
  { id: "prod-partypack", group: "production", label: "Party pack", value: 0 },
  { id: "prod-kids", group: "production", label: "Kids corner (game & décor)", value: 5000 },
  { id: "prod-neon", group: "production", label: "Neon décor (body paint / mask)", value: 0 },
  { id: "prod-bandtravel", group: "production", label: "Band travel (air / transport / room)", value: 90000 },
  // Misc
  { id: "misc-wristband", group: "misc", label: "Wristband", value: 8000 },
  { id: "misc-ice", group: "misc", label: "Ice for kitchen décor", value: 0 },
  { id: "misc-mics", group: "misc", label: "MICS (menu papers / candles)", value: 5000 },
  { id: "misc-ticket", group: "misc", label: "Ticket NYE + box + marker", value: 400 },
  { id: "misc-staffuni", group: "misc", label: "Staff uniform", value: 30000 },
  { id: "misc-hostessuni", group: "misc", label: "Hostess uniform", value: 2000 },
  { id: "misc-luckydraw", group: "misc", label: "Lucky draw", value: 0 },
  { id: "misc-tablerunner", group: "misc", label: "Table runner", value: 5000 },
  // Others
  { id: "others-payroll", group: "others", label: "Department payroll (per day +37%)", value: 0 },
  { id: "others-casuals", group: "others", label: "Casuals", value: 5000 },
  { id: "others-truck", group: "others", label: "Truck / logistics", value: 12000 },
  // Food & Beverage COGS
  { id: "fnb-food", group: "fnb", label: "Food cost", value: 350000, note: "≈ ฿1,520 / guest" },
  { id: "fnb-bev", group: "fnb", label: "Beverage cost", value: 366000, note: "≈ ฿1,590 / guest" },
];

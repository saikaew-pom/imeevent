// Revenue & cost assumptions for the 2026 plan. Revenue = editable package tiers.
// Cost = editable sub-items grouped under the five like-for-like main line items
// (see costStructure.ts). All figures are editable in the Costing deep dive.

import { CostLine, default2026CostLines } from "./costStructure";
import { CurrencyCode } from "@/lib/format";

export interface PackageTier {
  id: string;
  name: string;
  priceTHB: number; // per-guest package price (net of tax) — held in the project's currency
  qty: number; // number of guests on this tier
}

export interface FinancialAssumptions {
  tiers: PackageTier[];
  costLines: CostLine[];
  currency?: CurrencyCode; // project currency; undefined on legacy records = "THB"
}

export const defaultFinancials: FinancialAssumptions = {
  currency: "THB",
  tiers: [
    { id: "vvip", name: "VVIP Package", priceTHB: 20000, qty: 20 },
    { id: "vip", name: "VIP Package", priceTHB: 15000, qty: 200 },
    { id: "child", name: "Child", priceTHB: 6000, qty: 30 },
  ],
  costLines: default2026CostLines.map((l) => ({ ...l })),
};

// Revenue & cost assumptions. Revenue = editable package tiers. Cost = editable
// sub-items grouped under the five like-for-like main line items (see
// costStructure.ts). All figures are editable in the Costing deep dive.

import { CostLine } from "./costStructure";
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

// A genuinely blank starting point — no tiers, no cost lines. This is the
// fallback for any project with no saved financials (a fresh project, a
// failed fetch, an explicit Reset). It must never carry another project's
// real numbers; the archetype wizard's own templates (src/data/projectTemplates.ts)
// are where a new project's real starting tiers/cost lines come from.
export const defaultFinancials: FinancialAssumptions = {
  tiers: [],
  costLines: [],
};

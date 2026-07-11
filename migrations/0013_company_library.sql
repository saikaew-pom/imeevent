-- Company Library: a company-scoped catalogue of reusable content that any
-- project under that company can copy an item from. Copy-on-use, not a live
-- shared record — a copied item becomes an independent row in the target
-- project's own table (media_assets / custom_acts), or an independent
-- CostLine in the target project's financials, from that point on.

CREATE TABLE company_library_media (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'image' | 'video' | 'audio' | 'link'
  name TEXT NOT NULL,
  file_key TEXT NOT NULL, -- empty string for kind 'link'
  poster_key TEXT,
  link_url TEXT,
  mime TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_company_library_media_company ON company_library_media(company_id);

CREATE TABLE company_library_acts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'show' | 'decor'
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  themes TEXT NOT NULL DEFAULT '[]', -- JSON array of ThemeKey
  requires_dark INTEGER NOT NULL DEFAULT 0,
  duration_min INTEGER NOT NULL DEFAULT 10,
  cost_thb INTEGER NOT NULL DEFAULT 0, -- a plain number in the company's own working currency, same convention as custom_acts.cost_thb
  photo TEXT NOT NULL,
  placement TEXT, -- JSON array of Placement, NULL for decor
  energy INTEGER, -- NULL for decor
  energy_label TEXT, -- NULL for decor
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_company_library_acts_company ON company_library_acts(company_id);

-- Covers all four Phase J categories in one table (Equipment Rental, Sound &
-- Lighting, Airport Transfers, Tours & Activities) — they're structurally
-- identical (name/description/photo/cost/unit/vendor contact), so a
-- category column is the right granularity rather than four repeated tables.
CREATE TABLE company_library_vendors (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'equipment' | 'sound-lighting' | 'airport-transfers' | 'tours-activities'
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  photo TEXT,
  cost_thb INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '', -- e.g. "per day", "per trip", "per person"
  vendor_contact TEXT NOT NULL DEFAULT '',
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_company_library_vendors_company ON company_library_vendors(company_id);

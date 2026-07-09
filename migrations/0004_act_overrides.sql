-- Rework custom_acts to also support "overrides" of built-in catalogue acts,
-- not just fresh user-added items. Table is empty in both environments as of
-- this migration, so a clean drop/recreate is safe (no data migration needed).
DROP TABLE IF EXISTS custom_acts;

CREATE TABLE custom_acts (
  id TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'show' | 'decor'
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  themes TEXT NOT NULL DEFAULT '[]',
  requires_dark INTEGER NOT NULL DEFAULT 0,
  duration_min INTEGER NOT NULL DEFAULT 10,
  cost_thb INTEGER NOT NULL DEFAULT 0,
  photo TEXT NOT NULL,
  placement TEXT,
  energy INTEGER,
  energy_label TEXT,
  -- 1 = this row is a patch on top of a built-in catalogue act (id matches
  -- the built-in act's id); 0 = a fresh item added from scratch.
  is_override INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (project_id, id)
);

CREATE INDEX idx_custom_acts_project ON custom_acts(project_id);

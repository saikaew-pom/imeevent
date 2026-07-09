-- Show & Decor Builder custom items, shared per project (previously stored
-- only in browser localStorage — invisible/uneditable across sessions).
CREATE TABLE custom_acts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'show' | 'decor'
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  themes TEXT NOT NULL DEFAULT '[]', -- JSON array of ThemeKey
  requires_dark INTEGER NOT NULL DEFAULT 0,
  duration_min INTEGER NOT NULL DEFAULT 10,
  cost_thb INTEGER NOT NULL DEFAULT 0,
  photo TEXT NOT NULL,
  placement TEXT, -- JSON array of Placement, NULL for decor
  energy INTEGER, -- NULL for decor
  energy_label TEXT, -- NULL for decor
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_custom_acts_project ON custom_acts(project_id);

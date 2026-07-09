-- Shared, project-scoped state for the lineup, Event Flow program, and
-- revenue/costing assumptions. Previously these lived only in each user's
-- browser (localStorage) — this makes them real shared project state,
-- following the same pattern as custom_acts. Stored as JSON blobs keyed by
-- a small fixed set of keys ('lineup' | 'program' | 'financials') rather
-- than fully normalized tables, since the shapes are nested/editable as a
-- unit and don't need to be queried piecemeal.
CREATE TABLE project_state (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (project_id, key)
);

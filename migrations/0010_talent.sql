-- Talent references (MC, band, performers, vendors) as a reusable builder
-- entity, distinct from custom_acts (shows/decor) since talent needs
-- person/vendor fields — photo, a reference video link, an external
-- profile/portfolio link — rather than energy/placement/themes/cost.
CREATE TABLE talent (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',        -- e.g. "MC", "Band", "Vendor"
  description TEXT NOT NULL DEFAULT '',
  photo_key TEXT,                       -- R2 key, optional
  video_url TEXT,                       -- pasted YouTube/Vimeo reference link, optional
  link_url TEXT,                        -- external profile/portfolio link, optional
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_talent_project ON talent(project_id);

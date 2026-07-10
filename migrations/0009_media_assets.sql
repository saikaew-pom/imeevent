-- Project-scoped master media library. Every upload (beat gallery photos/
-- clips, later talent/show media) registers a row here so it can be reused
-- across the project rather than re-uploaded. Files live in the existing
-- imeevent-photos R2 bucket under a media/ key prefix.
CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'image' | 'video'
  name TEXT NOT NULL,
  file_key TEXT NOT NULL,   -- R2 key for the main file
  poster_key TEXT,          -- R2 key for a video's poster image, if any
  mime TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_media_assets_project ON media_assets(project_id);

-- Project document library — contracts, quotes, briefs etc attached to an
-- event. Files live in R2 (file_key); extracted/pasted text is stored so the
-- AI can read it. Images have a file_key but no text (read via vision at
-- suggest-time); pasted text has text_content but no file.
CREATE TABLE project_documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL, -- 'pdf' | 'image' | 'text'
  file_key TEXT,      -- R2 key, null for pasted text
  text_content TEXT,  -- extracted (pdf) or pasted (text); null for images
  mime TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_project_documents_project ON project_documents(project_id);

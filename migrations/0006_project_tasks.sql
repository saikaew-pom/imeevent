-- Project management timeline: prep tasks/deadlines leading up to the event,
-- distinct from the Event Flow run-of-show. Each row is an independent task
-- (create/update/delete one at a time), so it gets its own table rather than
-- a JSON blob in project_state.
CREATE TABLE project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'todo', -- 'todo' | 'in_progress' | 'done'
  start_date TEXT, -- ISO date, optional — powers the Gantt bar
  due_date TEXT,   -- ISO date, optional
  assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);

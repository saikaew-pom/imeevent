-- Attaches project documents (contracts, quotes, briefs) to specific
-- Timeline tasks — many-to-many, since one document (e.g. a venue contract)
-- can plausibly inform more than one task. Pure join table, no payload of
-- its own; both sides cascade so removing either the task or the document
-- cleans up the link automatically.
CREATE TABLE task_documents (
  task_id TEXT NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES project_documents(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, document_id)
);

CREATE INDEX idx_task_documents_document ON task_documents(document_id);

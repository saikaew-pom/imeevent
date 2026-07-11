-- Introduces "company" as a tenant layer above projects. A project belongs to
-- exactly one company; a user can be a member of a company as 'admin' (full
-- control over that company's users/projects) or 'member' (no admin powers).
-- This is purely an administrative/organizational layer — day-to-day project
-- access is still governed entirely by project_members, unchanged.
--
-- Also adds soft-delete for projects: archived_at makes a project disappear
-- from every normal list (self-serve /projects, admin) without deleting any
-- data; only a Recycle Bin view (admin-only) shows archived projects, with a
-- Restore action. There is no hard-delete.

CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE company_members (
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (company_id, user_id)
);
CREATE INDEX idx_company_members_user ON company_members(user_id);

ALTER TABLE projects ADD COLUMN company_id TEXT;
ALTER TABLE projects ADD COLUMN archived_at TEXT;

-- Seed one company owning everything that predates this migration — every
-- existing project and user was implicitly "one company" already (any admin
-- could see and manage all of it). Rename it from the admin page any time;
-- the id/slug are internal and never shown.
INSERT INTO companies (id, slug, name) VALUES ('default-company', 'default', 'Default Company');

UPDATE projects SET company_id = 'default-company' WHERE company_id IS NULL;

-- Every real (non-guest) user becomes a member; existing super admins also
-- become this company's admin so the admin dashboard reads consistently.
-- Auto-provisioned guest accounts (one per project, passcode-only, never
-- listed as a real user) are excluded.
INSERT INTO company_members (company_id, user_id, role)
SELECT 'default-company', id, CASE WHEN is_admin = 1 THEN 'admin' ELSE 'member' END
FROM users
WHERE email NOT LIKE 'guest+%@eventflow.local';

-- A shared project passcode lets a visitor get instant, view-only access
-- without an admin-created account — separate from real user login. NULL
-- means the project has no passcode access enabled.
ALTER TABLE projects ADD COLUMN passcode TEXT;

UPDATE projects SET passcode = 'cheewitcheewa' WHERE slug = 'jw-gala-garden-night';

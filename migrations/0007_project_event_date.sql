-- Anchor date for the project management timeline. Preset imports compute
-- each task's start/due date relative to this (offsets in days before the event).
ALTER TABLE projects ADD COLUMN event_date TEXT;

UPDATE projects SET event_date = '2026-12-31' WHERE slug = 'jw-gala-garden-night';

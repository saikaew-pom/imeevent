-- Tags Timeline tasks with the event preset they were imported from
-- (eventPresets.ts id, e.g. "gala" / "wedding" / "corporate"), so a project's
-- imported presets can later be listed and refined/regenerated as a group from a
-- free-text brief. Nullable: tasks added ad-hoc, or seeded by the New Project
-- wizard's project templates, carry no preset id and are left untouched by refine.
ALTER TABLE project_tasks ADD COLUMN preset_id TEXT;

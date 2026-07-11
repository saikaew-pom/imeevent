import "server-only";
import { getDB } from "@/lib/cf";

export const STATE_KEYS = [
  "lineup",
  "program",
  "financials",
  "presentation",
  "hiddenSlides",
  "meta",
  "aiTheme",
] as const;
export type StateKey = (typeof STATE_KEYS)[number];

interface StateRow {
  key: StateKey;
  data: string;
}

// Fetches all three state blobs for a project in one query. Any key never
// saved before comes back as null (caller falls back to its own default).
export async function getProjectState(
  projectId: string
): Promise<Record<StateKey, unknown | null>> {
  const db = await getDB();
  const { results } = await db
    .prepare("SELECT key, data FROM project_state WHERE project_id = ?")
    .bind(projectId)
    .all<StateRow>();

  const out: Record<StateKey, unknown | null> = {
    lineup: null,
    program: null,
    financials: null,
    presentation: null,
    hiddenSlides: null,
    meta: null,
    aiTheme: null,
  };
  for (const row of results) {
    if (STATE_KEYS.includes(row.key)) {
      out[row.key] = JSON.parse(row.data);
    }
  }
  return out;
}

export async function setProjectState(
  projectId: string,
  key: StateKey,
  data: unknown,
  updatedBy: string
): Promise<void> {
  const db = await getDB();
  await db
    .prepare(
      `INSERT INTO project_state (project_id, key, data, updated_by)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (project_id, key) DO UPDATE SET
         data = excluded.data, updated_by = excluded.updated_by, updated_at = datetime('now')`
    )
    .bind(projectId, key, JSON.stringify(data), updatedBy)
    .run();
}

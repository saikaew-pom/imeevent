import "server-only";
import { getDB } from "@/lib/cf";
import { Talent, NewTalentInput } from "@/data/talent";

interface TalentRow {
  id: string;
  name: string;
  role: string;
  description: string;
  photoKey: string | null;
  videoUrl: string | null;
  linkUrl: string | null;
  createdAt: string;
}

function rowToTalent(row: TalentRow): Talent {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    description: row.description,
    photoUrl: row.photoKey ? `/api/builder/photo/${row.photoKey}` : null,
    videoUrl: row.videoUrl,
    linkUrl: row.linkUrl,
    createdAt: row.createdAt,
  };
}

export async function listTalent(projectId: string): Promise<Talent[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT id, name, role, description, photo_key as photoKey,
              video_url as videoUrl, link_url as linkUrl, created_at as createdAt
       FROM talent WHERE project_id = ? ORDER BY created_at ASC`
    )
    .bind(projectId)
    .all<TalentRow>();
  return results.map(rowToTalent);
}

export async function createTalent(
  projectId: string,
  createdBy: string,
  input: NewTalentInput
): Promise<Talent> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const name = input.name.trim() || "Untitled talent";
  await db
    .prepare(
      `INSERT INTO talent (id, project_id, name, role, description, photo_key, video_url, link_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      projectId,
      name,
      input.role?.trim() ?? "",
      input.description?.trim() ?? "",
      input.photoKey ?? null,
      input.videoUrl?.trim() || null,
      input.linkUrl?.trim() || null,
      createdBy
    )
    .run();
  return {
    id,
    name,
    role: input.role?.trim() ?? "",
    description: input.description?.trim() ?? "",
    photoUrl: input.photoKey ? `/api/builder/photo/${input.photoKey}` : null,
    videoUrl: input.videoUrl?.trim() || null,
    linkUrl: input.linkUrl?.trim() || null,
    createdAt: new Date().toISOString(),
  };
}

export async function updateTalent(
  projectId: string,
  id: string,
  input: NewTalentInput
): Promise<void> {
  const db = await getDB();
  await db
    .prepare(
      `UPDATE talent SET
        name = ?, role = ?, description = ?,
        photo_key = COALESCE(?, photo_key),
        video_url = ?, link_url = ?
       WHERE project_id = ? AND id = ?`
    )
    .bind(
      input.name.trim() || "Untitled talent",
      input.role?.trim() ?? "",
      input.description?.trim() ?? "",
      input.photoKey ?? null,
      input.videoUrl?.trim() || null,
      input.linkUrl?.trim() || null,
      projectId,
      id
    )
    .run();
}

export async function deleteTalent(
  projectId: string,
  id: string
): Promise<string | null> {
  const db = await getDB();
  const row = await db
    .prepare("SELECT photo_key as photoKey FROM talent WHERE project_id = ? AND id = ?")
    .bind(projectId, id)
    .first<{ photoKey: string | null }>();
  await db
    .prepare("DELETE FROM talent WHERE project_id = ? AND id = ?")
    .bind(projectId, id)
    .run();
  return row?.photoKey ?? null;
}

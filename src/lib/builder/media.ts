import "server-only";
import { getDB } from "@/lib/cf";
import { MediaAsset, MediaAssetKind } from "@/data/media";

interface MediaRow {
  id: string;
  kind: MediaAssetKind;
  name: string;
  fileKey: string;
  posterKey: string | null;
  mime: string | null;
  createdAt: string;
}

function rowToAsset(row: MediaRow): MediaAsset {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    url: `/api/builder/photo/${row.fileKey}`,
    posterUrl: row.posterKey ? `/api/builder/photo/${row.posterKey}` : null,
    mime: row.mime,
    createdAt: row.createdAt,
  };
}

export async function listMediaAssets(projectId: string): Promise<MediaAsset[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT id, kind, name, file_key as fileKey, poster_key as posterKey, mime,
              created_at as createdAt
       FROM media_assets WHERE project_id = ? ORDER BY created_at DESC`
    )
    .bind(projectId)
    .all<MediaRow>();
  return results.map(rowToAsset);
}

export async function createMediaAsset(
  projectId: string,
  createdBy: string,
  input: { kind: MediaAssetKind; name: string; fileKey: string; posterKey?: string | null; mime?: string | null }
): Promise<MediaAsset> {
  const db = await getDB();
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO media_assets (id, project_id, kind, name, file_key, poster_key, mime, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      projectId,
      input.kind,
      input.name.trim() || "Untitled",
      input.fileKey,
      input.posterKey ?? null,
      input.mime ?? null,
      createdBy
    )
    .run();
  return rowToAsset({
    id,
    kind: input.kind,
    name: input.name.trim() || "Untitled",
    fileKey: input.fileKey,
    posterKey: input.posterKey ?? null,
    mime: input.mime ?? null,
    createdAt: new Date().toISOString(),
  });
}

export async function renameMediaAsset(
  projectId: string,
  id: string,
  name: string
): Promise<void> {
  const db = await getDB();
  await db
    .prepare("UPDATE media_assets SET name = ? WHERE project_id = ? AND id = ?")
    .bind(name.trim() || "Untitled", projectId, id)
    .run();
}

// Returns the R2 keys to clean up (file + poster) so the caller can delete
// them from the bucket after the row is removed.
export async function deleteMediaAsset(
  projectId: string,
  id: string
): Promise<{ fileKey: string; posterKey: string | null } | null> {
  const db = await getDB();
  const row = await db
    .prepare("SELECT file_key as fileKey, poster_key as posterKey FROM media_assets WHERE project_id = ? AND id = ?")
    .bind(projectId, id)
    .first<{ fileKey: string; posterKey: string | null }>();
  await db
    .prepare("DELETE FROM media_assets WHERE project_id = ? AND id = ?")
    .bind(projectId, id)
    .run();
  return row ?? null;
}

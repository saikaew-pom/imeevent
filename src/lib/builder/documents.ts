import "server-only";
import { getDB } from "@/lib/cf";
import { ProjectDocument, NewDocumentInput, DocumentKind } from "@/data/documents";

interface DocRow {
  id: string;
  name: string;
  kind: DocumentKind;
  fileKey: string | null;
  hasText: number;
  mime: string | null;
  createdAt: string;
}

// Lists documents WITHOUT their (potentially large) text bodies.
export async function listDocuments(projectId: string): Promise<ProjectDocument[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT id, name, kind, file_key as fileKey,
              (text_content IS NOT NULL AND text_content != '') as hasText,
              mime, created_at as createdAt
       FROM project_documents WHERE project_id = ? ORDER BY created_at DESC`
    )
    .bind(projectId)
    .all<DocRow>();
  return results.map((r) => ({ ...r, hasText: Boolean(r.hasText) }));
}

export async function createDocument(
  projectId: string,
  createdBy: string,
  input: NewDocumentInput
): Promise<ProjectDocument> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const name = input.name.trim() || "Untitled document";
  const text = input.textContent?.trim() || null;
  await db
    .prepare(
      `INSERT INTO project_documents
        (id, project_id, name, kind, file_key, text_content, mime, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, projectId, name, input.kind, input.fileKey ?? null, text, input.mime ?? null, createdBy)
    .run();
  return {
    id,
    name,
    kind: input.kind,
    fileKey: input.fileKey ?? null,
    hasText: Boolean(text),
    mime: input.mime ?? null,
    createdAt: new Date().toISOString(),
  };
}

export async function deleteDocument(projectId: string, id: string): Promise<string | null> {
  const db = await getDB();
  const row = await db
    .prepare("SELECT file_key as fileKey FROM project_documents WHERE project_id = ? AND id = ?")
    .bind(projectId, id)
    .first<{ fileKey: string | null }>();
  await db
    .prepare("DELETE FROM project_documents WHERE project_id = ? AND id = ?")
    .bind(projectId, id)
    .run();
  return row?.fileKey ?? null;
}

// Full rows incl. text + file_key — used server-side when assembling the AI
// context (never sent wholesale to the client).
export interface DocumentContext {
  name: string;
  kind: DocumentKind;
  fileKey: string | null;
  textContent: string | null;
}

export async function getDocumentContext(projectId: string): Promise<DocumentContext[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT name, kind, file_key as fileKey, text_content as textContent
       FROM project_documents WHERE project_id = ? ORDER BY created_at ASC`
    )
    .bind(projectId)
    .all<DocumentContext>();
  return results;
}

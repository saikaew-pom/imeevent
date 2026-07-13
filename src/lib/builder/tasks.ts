import "server-only";
import { getDB } from "@/lib/cf";
import { ProjectTask, NewTaskInput, TaskStatus, TaskCategory } from "@/data/tasks";

interface TaskRow {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  startDate: string | null;
  dueDate: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  sortOrder: number;
  documentIds: string | null; // comma-joined; parsed below
}

function parseDocumentIds(raw: string | null): string[] {
  return raw ? raw.split(",") : [];
}

export async function listTasks(projectId: string): Promise<ProjectTask[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT t.id, t.title, t.description, t.category, t.status,
              t.start_date as startDate, t.due_date as dueDate,
              t.assignee_id as assigneeId, u.name as assigneeName,
              t.sort_order as sortOrder,
              (SELECT GROUP_CONCAT(document_id) FROM task_documents WHERE task_id = t.id) as documentIds
       FROM project_tasks t
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.project_id = ?
       ORDER BY t.sort_order ASC, t.created_at ASC`
    )
    .bind(projectId)
    .all<TaskRow>();
  return results.map((r) => ({ ...r, documentIds: parseDocumentIds(r.documentIds) }));
}

// Replace-all: simplest correct semantics for a modal that submits the
// task's full document-attachment list on every save, same as how the rest
// of TaskFormModal's fields already work (whole-object submit, not diffing).
// Sequential awaits, not a batch — a task attaches at most a handful of
// documents, same reasoning as createTasksBulk's loop-of-single-writes.
//
// documentIds is client-supplied, so it's scoped to project_documents that
// actually belong to projectId (same project-scoping pattern as every other
// query in this file/documents.ts) and de-duplicated before insert — without
// this, a client could attach another project's document by id, and a
// duplicate id in the array would violate the (task_id, document_id) PK and
// abort the loop partway through.
export async function setTaskDocuments(
  projectId: string,
  taskId: string,
  documentIds: string[]
): Promise<string[]> {
  const db = await getDB();
  const uniqueIds = Array.from(new Set(documentIds));

  let validIds: string[] = [];
  if (uniqueIds.length) {
    const placeholders = uniqueIds.map(() => "?").join(", ");
    const { results } = await db
      .prepare(
        `SELECT id FROM project_documents WHERE project_id = ? AND id IN (${placeholders})`
      )
      .bind(projectId, ...uniqueIds)
      .all<{ id: string }>();
    validIds = results.map((r) => r.id);
  }

  await db.prepare("DELETE FROM task_documents WHERE task_id = ?").bind(taskId).run();
  for (const documentId of validIds) {
    await db
      .prepare("INSERT INTO task_documents (task_id, document_id) VALUES (?, ?)")
      .bind(taskId, documentId)
      .run();
  }
  return validIds;
}

export async function createTask(
  projectId: string,
  createdBy: string,
  input: NewTaskInput
): Promise<ProjectTask> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const title = input.title.trim() || "Untitled task";
  const category = input.category ?? "general";
  const status = input.status ?? "todo";

  await db
    .prepare(
      `INSERT INTO project_tasks
        (id, project_id, title, description, category, status, start_date, due_date, assignee_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      projectId,
      title,
      input.description?.trim() ?? "",
      category,
      status,
      input.startDate || null,
      input.dueDate || null,
      input.assigneeId || null,
      createdBy
    )
    .run();

  let assigneeName: string | null = null;
  if (input.assigneeId) {
    const row = await db
      .prepare("SELECT name FROM users WHERE id = ?")
      .bind(input.assigneeId)
      .first<{ name: string }>();
    assigneeName = row?.name ?? null;
  }

  const requestedDocumentIds = input.documentIds ?? [];
  const documentIds = requestedDocumentIds.length
    ? await setTaskDocuments(projectId, id, requestedDocumentIds)
    : [];

  return {
    id,
    title,
    description: input.description?.trim() ?? "",
    category,
    status,
    startDate: input.startDate || null,
    dueDate: input.dueDate || null,
    assigneeId: input.assigneeId || null,
    assigneeName,
    sortOrder: 0,
    documentIds,
  };
}

export async function updateTask(
  projectId: string,
  id: string,
  input: NewTaskInput
): Promise<void> {
  const db = await getDB();
  await db
    .prepare(
      `UPDATE project_tasks SET
        title = ?, description = ?, category = ?, status = ?,
        start_date = ?, due_date = ?, assignee_id = ?, updated_at = datetime('now')
       WHERE project_id = ? AND id = ?`
    )
    .bind(
      input.title.trim() || "Untitled task",
      input.description?.trim() ?? "",
      input.category ?? "general",
      input.status ?? "todo",
      input.startDate || null,
      input.dueDate || null,
      input.assigneeId || null,
      projectId,
      id
    )
    .run();

  if (input.documentIds) await setTaskDocuments(projectId, id, input.documentIds);
}

export async function deleteTask(projectId: string, id: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare("DELETE FROM project_tasks WHERE project_id = ? AND id = ?")
    .bind(projectId, id)
    .run();
}

export interface BulkTaskInput extends NewTaskInput {
  sortOrder: number;
}

// Inserts many tasks (e.g. a preset import) with unassigned owner/assignee.
// Loops single inserts — fine for the ~10–32 rows a preset produces.
// presetId tags every inserted row with the event preset it came from (see
// migration 0015) so the set can later be refined as a group; pass null for
// non-preset seeding (e.g. the New Project wizard's templates).
export async function createTasksBulk(
  projectId: string,
  createdBy: string,
  rows: BulkTaskInput[],
  presetId: string | null = null
): Promise<ProjectTask[]> {
  const db = await getDB();
  const created: ProjectTask[] = [];
  for (const input of rows) {
    const id = crypto.randomUUID();
    const title = input.title.trim() || "Untitled task";
    const category = input.category ?? "general";
    const status = input.status ?? "todo";
    await db
      .prepare(
        `INSERT INTO project_tasks
          (id, project_id, title, description, category, status, start_date, due_date, assignee_id, sort_order, created_by, preset_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        projectId,
        title,
        input.description?.trim() ?? "",
        category,
        status,
        input.startDate || null,
        input.dueDate || null,
        null,
        input.sortOrder,
        createdBy,
        presetId
      )
      .run();
    created.push({
      id,
      title,
      description: input.description?.trim() ?? "",
      category,
      status,
      startDate: input.startDate || null,
      dueDate: input.dueDate || null,
      assigneeId: null,
      assigneeName: null,
      sortOrder: input.sortOrder,
      documentIds: [],
    });
  }
  return created;
}

// --- Preset refine (M4) ---
// Lists the distinct event presets that have been imported into a project,
// with how many tasks each currently contributes. Feeds the Timeline's
// "Refine a preset" selector — hidden entirely when this returns empty.
export async function listImportedPresets(
  projectId: string
): Promise<{ presetId: string; count: number }[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT preset_id as presetId, COUNT(*) as count
       FROM project_tasks
       WHERE project_id = ? AND preset_id IS NOT NULL
       GROUP BY preset_id
       ORDER BY count DESC`
    )
    .bind(projectId)
    .all<{ presetId: string; count: number }>();
  return results;
}

export interface PresetTaskRow {
  id: string;
  title: string;
  category: TaskCategory;
  startDate: string | null;
  dueDate: string | null;
  description: string;
}

// The current tasks belonging to one imported preset, in display order.
// Used both to build the AI refine prompt and to capture the ids that a
// successful refine will replace.
export async function listPresetTasks(
  projectId: string,
  presetId: string
): Promise<PresetTaskRow[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT id, title, category, start_date as startDate, due_date as dueDate, description
       FROM project_tasks
       WHERE project_id = ? AND preset_id = ?
       ORDER BY sort_order ASC, created_at ASC`
    )
    .bind(projectId, presetId)
    .all<PresetTaskRow>();
  return results;
}

// Scoped delete by explicit id list (project-scoped for safety). The refine
// flow captures the old preset ids, inserts the replacement set, THEN deletes
// exactly these — so a mid-insert failure can't wipe the old set (D1 exposes
// no transaction here). Deleting by preset_id would also hit the fresh rows.
export async function deleteTasksByIds(projectId: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const db = await getDB();
  const placeholders = ids.map(() => "?").join(", ");
  await db
    .prepare(`DELETE FROM project_tasks WHERE project_id = ? AND id IN (${placeholders})`)
    .bind(projectId, ...ids)
    .run();
}

export async function taskExists(projectId: string, id: string): Promise<boolean> {
  const db = await getDB();
  const row = await db
    .prepare("SELECT 1 as found FROM project_tasks WHERE project_id = ? AND id = ?")
    .bind(projectId, id)
    .first<{ found: number }>();
  return Boolean(row);
}

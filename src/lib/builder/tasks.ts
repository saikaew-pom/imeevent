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
}

export async function listTasks(projectId: string): Promise<ProjectTask[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT t.id, t.title, t.description, t.category, t.status,
              t.start_date as startDate, t.due_date as dueDate,
              t.assignee_id as assigneeId, u.name as assigneeName,
              t.sort_order as sortOrder
       FROM project_tasks t
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.project_id = ?
       ORDER BY t.sort_order ASC, t.created_at ASC`
    )
    .bind(projectId)
    .all<TaskRow>();
  return results;
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
export async function createTasksBulk(
  projectId: string,
  createdBy: string,
  rows: BulkTaskInput[]
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
          (id, project_id, title, description, category, status, start_date, due_date, assignee_id, sort_order, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        createdBy
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
    });
  }
  return created;
}

export async function taskExists(projectId: string, id: string): Promise<boolean> {
  const db = await getDB();
  const row = await db
    .prepare("SELECT 1 as found FROM project_tasks WHERE project_id = ? AND id = ?")
    .bind(projectId, id)
    .first<{ found: number }>();
  return Boolean(row);
}

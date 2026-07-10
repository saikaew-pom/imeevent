// Project management timeline — prep tasks/deadlines leading up to the
// event. Pure data types (no "server-only" imports) so both the client
// store and server-side query code can share them.
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskCategory =
  | "venue"
  | "fnb"
  | "entertainment"
  | "marketing"
  | "finance"
  | "general";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  venue: "Venue & Logistics",
  fnb: "F&B",
  entertainment: "Entertainment",
  marketing: "Marketing",
  finance: "Finance",
  general: "General",
};

export interface ProjectTask {
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

export interface NewTaskInput {
  title: string;
  description?: string;
  category?: TaskCategory;
  status?: TaskStatus;
  startDate?: string | null;
  dueDate?: string | null;
  assigneeId?: string | null;
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
}

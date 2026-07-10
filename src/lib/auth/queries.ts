import "server-only";
import { getDB } from "@/lib/cf";
import { hashPassword } from "./password";

export type Role = "owner" | "editor" | "viewer";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface ProjectRow {
  id: string;
  slug: string;
  name: string;
  passcode: string | null;
  eventDate: string | null;
}

function newId(): string {
  return crypto.randomUUID();
}

// Turn a project name into a URL-safe slug. Empty/symbol-only names fall back
// to "project" so we always have a non-empty base to uniquify.
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return base || "project";
}

export async function getUserByEmail(
  email: string
): Promise<(UserRow & { passwordHash: string }) | null> {
  const db = await getDB();
  const row = await db
    .prepare(
      "SELECT id, email, name, is_admin as isAdmin, password_hash as passwordHash, created_at as createdAt FROM users WHERE email = ?"
    )
    .bind(email.toLowerCase())
    .first<{
      id: string;
      email: string;
      name: string;
      isAdmin: number;
      passwordHash: string;
      createdAt: string;
    }>();
  if (!row) return null;
  return { ...row, isAdmin: Boolean(row.isAdmin) };
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  isAdmin?: boolean;
}): Promise<UserRow> {
  const db = await getDB();
  const id = newId();
  const passwordHash = await hashPassword(input.password);
  await db
    .prepare(
      "INSERT INTO users (id, email, name, password_hash, is_admin) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(id, input.email.toLowerCase(), input.name, passwordHash, input.isAdmin ? 1 : 0)
    .run();
  return { id, email: input.email.toLowerCase(), name: input.name, isAdmin: Boolean(input.isAdmin), createdAt: new Date().toISOString() };
}

export async function listUsers(): Promise<UserRow[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      "SELECT id, email, name, is_admin as isAdmin, created_at as createdAt FROM users ORDER BY created_at DESC"
    )
    .all<{ id: string; email: string; name: string; isAdmin: number; createdAt: string }>();
  return results.map((r) => ({ ...r, isAdmin: Boolean(r.isAdmin) }));
}

export async function deleteUser(userId: string): Promise<void> {
  const db = await getDB();
  await db.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
}

export async function listProjects(): Promise<ProjectRow[]> {
  const db = await getDB();
  const { results } = await db
    .prepare("SELECT id, slug, name, passcode, event_date as eventDate FROM projects ORDER BY created_at ASC")
    .all<ProjectRow>();
  return results;
}

export async function getProjectBySlug(slug: string): Promise<ProjectRow | null> {
  const db = await getDB();
  return db
    .prepare("SELECT id, slug, name, passcode, event_date as eventDate FROM projects WHERE slug = ?")
    .bind(slug)
    .first<ProjectRow>();
}

// Creates a project from a display name and makes the creator its owner.
// Derives a unique slug from the name (appending -2, -3, … on collision).
export async function createProject(input: {
  name: string;
  ownerId: string;
}): Promise<ProjectRow> {
  const db = await getDB();
  const name = input.name.trim();
  const base = slugify(name);

  let slug = base;
  let n = 1;
  // Low-concurrency self-serve creation — a check-then-insert loop is enough,
  // and the UNIQUE constraint on slug is the ultimate backstop.
  while (await getProjectBySlug(slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }

  const id = newId();
  await db
    .prepare("INSERT INTO projects (id, slug, name) VALUES (?, ?, ?)")
    .bind(id, slug, name)
    .run();
  await addProjectMember(id, input.ownerId, "owner");

  return { id, slug, name, passcode: null, eventDate: null };
}

export async function setProjectEventDate(
  projectId: string,
  eventDate: string
): Promise<void> {
  const db = await getDB();
  await db
    .prepare("UPDATE projects SET event_date = ? WHERE id = ?")
    .bind(eventDate, projectId)
    .run();
}

export async function setProjectPasscode(
  projectId: string,
  passcode: string | null
): Promise<void> {
  const db = await getDB();
  await db
    .prepare("UPDATE projects SET passcode = ? WHERE id = ?")
    .bind(passcode, projectId)
    .run();
}

export interface MemberRow {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export async function listProjectMembers(projectId: string): Promise<MemberRow[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT u.id as userId, u.email, u.name, pm.role
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ?
       ORDER BY u.name ASC`
    )
    .bind(projectId)
    .all<MemberRow>();
  return results;
}

export async function isProjectMember(userId: string, projectId: string): Promise<Role | null> {
  const db = await getDB();
  const row = await db
    .prepare("SELECT role FROM project_members WHERE user_id = ? AND project_id = ?")
    .bind(userId, projectId)
    .first<{ role: Role }>();
  return row?.role ?? null;
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: Role
): Promise<void> {
  const db = await getDB();
  await db
    .prepare(
      `INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)
       ON CONFLICT(project_id, user_id) DO UPDATE SET role = excluded.role`
    )
    .bind(projectId, userId, role)
    .run();
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare("DELETE FROM project_members WHERE project_id = ? AND user_id = ?")
    .bind(projectId, userId)
    .run();
}

export async function listUserProjects(userId: string): Promise<(ProjectRow & { role: Role })[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT p.id, p.slug, p.name, p.passcode, p.event_date as eventDate, pm.role
       FROM project_members pm
       JOIN projects p ON p.id = pm.project_id
       WHERE pm.user_id = ?
       ORDER BY p.name ASC`
    )
    .bind(userId)
    .all<ProjectRow & { role: Role }>();
  return results;
}

// A single shared "guest" account per project — anyone with the passcode logs
// in as this account. Simple, view-only access with no admin/user-management
// visibility; distinct from real admin-created accounts.
export async function getOrCreateGuestUser(project: ProjectRow): Promise<UserRow> {
  const guestEmail = `guest+${project.slug}@eventflow.local`;
  const existing = await getUserByEmail(guestEmail);
  if (existing) return existing;

  // Unusable password — this account can only ever be reached via the
  // passcode route, never via /login.
  const randomPassword = crypto.randomUUID() + crypto.randomUUID();
  const user = await createUser({
    email: guestEmail,
    name: `Guest (${project.name})`,
    password: randomPassword,
    isAdmin: false,
  });
  await addProjectMember(project.id, user.id, "viewer");
  return user;
}

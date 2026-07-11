import "server-only";
import { getDB } from "@/lib/cf";
import { hashPassword } from "./password";
import { getProjectState, setProjectState, STATE_KEYS } from "@/lib/builder/projectState";
import type { Beat } from "@/data/runOfShow";

export type Role = "owner" | "editor" | "viewer";
export type CompanyRole = "admin" | "member";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface CompanyRow {
  id: string;
  slug: string;
  name: string;
}

export interface ProjectRow {
  id: string;
  slug: string;
  name: string;
  passcode: string | null;
  eventDate: string | null;
  companyId: string | null;
  archivedAt: string | null;
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

export async function deleteUser(userId: string): Promise<void> {
  const db = await getDB();
  await db.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
}

const PROJECT_COLUMNS =
  "id, slug, name, passcode, event_date as eventDate, company_id as companyId, archived_at as archivedAt";

export async function getProjectById(id: string): Promise<ProjectRow | null> {
  const db = await getDB();
  return db.prepare(`SELECT ${PROJECT_COLUMNS} FROM projects WHERE id = ?`).bind(id).first<ProjectRow>();
}

export async function getProjectBySlug(slug: string): Promise<ProjectRow | null> {
  const db = await getDB();
  return db
    .prepare(`SELECT ${PROJECT_COLUMNS} FROM projects WHERE slug = ?`)
    .bind(slug)
    .first<ProjectRow>();
}

// Resolve a project purely from its guest passcode, so the public landing
// page can offer a code-only entry that never reveals which projects exist.
// Archived projects never resolve here — an archived project's passcode
// stops working, same as every other access path.
export async function getProjectByPasscode(passcode: string): Promise<ProjectRow | null> {
  const trimmed = passcode.trim();
  if (!trimmed) return null;
  const db = await getDB();
  return db
    .prepare(
      `SELECT ${PROJECT_COLUMNS} FROM projects WHERE passcode = ? AND archived_at IS NULL LIMIT 1`
    )
    .bind(trimmed)
    .first<ProjectRow>();
}

// Creates a project from a display name and makes the creator its owner.
// Derives a unique slug from the name (appending -2, -3, … on collision).
// Every project belongs to exactly one company from creation onward.
export async function createProject(input: {
  name: string;
  ownerId: string;
  companyId: string;
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
    .prepare("INSERT INTO projects (id, slug, name, company_id) VALUES (?, ?, ?, ?)")
    .bind(id, slug, name, input.companyId)
    .run();
  await addProjectMember(id, input.ownerId, "owner");

  return {
    id,
    slug,
    name,
    passcode: null,
    eventDate: null,
    companyId: input.companyId,
    archivedAt: null,
  };
}

// Clones a project's full builder content into a brand-new project in the
// same company: custom acts (kept at the same id — its PK is already
// project-scoped so no collision is possible), talent/media/tasks/documents
// (each given a fresh id, since those tables key on a bare global `id`), and
// every project_state blob (lineup/program/financials/presentation/
// hiddenSlides/meta). The "program" blob's Beat.linkedTalent ids are the one
// place a talent id is referenced from outside the talent table itself, so
// they're rewritten through the old->new id map built while copying talent —
// every other cross-reference (custom_acts ids in linkedActs/lineup, beat ids
// in presentation slides, literal media URLs in gallery/keyVisual/refVideos)
// already stays valid because it's either copied as-is or keyed by the
// unchanged id. The copy starts with no passcode (guest access is a
// per-event secret, never silently duplicated) and no members besides the
// acting user as owner — mirrors createProject's "creator becomes owner"
// convention rather than copying the source project's whole team across.
export async function duplicateProject(
  sourceProjectId: string,
  ownerId: string,
  newName: string
): Promise<ProjectRow> {
  const db = await getDB();
  const source = await getProjectById(sourceProjectId);
  if (!source) throw new Error("Project not found.");
  if (!source.companyId) throw new Error("Source project has no company.");

  const name = newName.trim() || `${source.name} (Copy)`;
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await getProjectBySlug(slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }

  const id = newId();
  await db
    .prepare("INSERT INTO projects (id, slug, name, event_date, company_id) VALUES (?, ?, ?, ?, ?)")
    .bind(id, slug, name, source.eventDate, source.companyId)
    .run();
  await addProjectMember(id, ownerId, "owner");

  // custom_acts: composite (project_id, id) PK — same id is safe under a
  // different project_id, so a plain INSERT...SELECT copies every row.
  await db
    .prepare(
      `INSERT INTO custom_acts
        (id, project_id, kind, name, type, description, themes, requires_dark,
         duration_min, cost_thb, photo, placement, energy, energy_label, is_override, created_by)
       SELECT id, ?, kind, name, type, description, themes, requires_dark,
              duration_min, cost_thb, photo, placement, energy, energy_label, is_override, created_by
       FROM custom_acts WHERE project_id = ?`
    )
    .bind(id, sourceProjectId)
    .run();

  // talent: bare `id` PK — needs a fresh id per row, so loop (same "fine for
  // a handful of rows" tradeoff as createTasksBulk elsewhere in this file).
  const { results: talentRows } = await db
    .prepare(
      `SELECT id, name, role, description, photo_key as photoKey, video_url as videoUrl,
              link_url as linkUrl, created_by as createdBy
       FROM talent WHERE project_id = ?`
    )
    .bind(sourceProjectId)
    .all<{
      id: string;
      name: string;
      role: string;
      description: string;
      photoKey: string | null;
      videoUrl: string | null;
      linkUrl: string | null;
      createdBy: string | null;
    }>();
  const talentIdMap = new Map<string, string>();
  for (const row of talentRows) {
    const talentId = newId();
    talentIdMap.set(row.id, talentId);
    await db
      .prepare(
        `INSERT INTO talent (id, project_id, name, role, description, photo_key, video_url, link_url, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(talentId, id, row.name, row.role, row.description, row.photoKey, row.videoUrl, row.linkUrl, row.createdBy)
      .run();
  }

  // media_assets: fresh id per row too. Nothing references a media asset by
  // id from outside this table (beat gallery/keyVisual/refVideos store the
  // resolved /api/builder/photo/<file_key> URL directly), so no remap needed
  // — this just repopulates the new project's own Media Library tab.
  const { results: mediaRows } = await db
    .prepare(
      `SELECT id, kind, name, file_key as fileKey, poster_key as posterKey,
              link_url as linkUrl, mime, created_by as createdBy
       FROM media_assets WHERE project_id = ?`
    )
    .bind(sourceProjectId)
    .all<{
      id: string;
      kind: string;
      name: string;
      fileKey: string;
      posterKey: string | null;
      linkUrl: string | null;
      mime: string | null;
      createdBy: string | null;
    }>();
  for (const row of mediaRows) {
    await db
      .prepare(
        `INSERT INTO media_assets (id, project_id, kind, name, file_key, poster_key, link_url, mime, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(newId(), id, row.kind, row.name, row.fileKey, row.posterKey, row.linkUrl, row.mime, row.createdBy)
      .run();
  }

  // project_tasks: fresh id per row; assignee_id references `users`, not the
  // project, so it carries over unchanged (same assignee on the copy).
  const { results: taskRows } = await db
    .prepare(
      `SELECT id, title, description, category, status, start_date as startDate,
              due_date as dueDate, assignee_id as assigneeId, sort_order as sortOrder,
              created_by as createdBy
       FROM project_tasks WHERE project_id = ?`
    )
    .bind(sourceProjectId)
    .all<{
      id: string;
      title: string;
      description: string;
      category: string;
      status: string;
      startDate: string | null;
      dueDate: string | null;
      assigneeId: string | null;
      sortOrder: number;
      createdBy: string | null;
    }>();
  for (const row of taskRows) {
    await db
      .prepare(
        `INSERT INTO project_tasks
          (id, project_id, title, description, category, status, start_date, due_date, assignee_id, sort_order, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        newId(),
        id,
        row.title,
        row.description,
        row.category,
        row.status,
        row.startDate,
        row.dueDate,
        row.assigneeId,
        row.sortOrder,
        row.createdBy
      )
      .run();
  }

  // project_documents: fresh id per row; the R2 file itself is immutable, so
  // both projects' rows can point at the same file_key.
  const { results: docRows } = await db
    .prepare(
      `SELECT id, name, kind, file_key as fileKey, text_content as textContent,
              mime, created_by as createdBy
       FROM project_documents WHERE project_id = ?`
    )
    .bind(sourceProjectId)
    .all<{
      id: string;
      name: string;
      kind: string;
      fileKey: string | null;
      textContent: string | null;
      mime: string | null;
      createdBy: string | null;
    }>();
  for (const row of docRows) {
    await db
      .prepare(
        `INSERT INTO project_documents (id, project_id, name, kind, file_key, text_content, mime, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(newId(), id, row.name, row.kind, row.fileKey, row.textContent, row.mime, row.createdBy)
      .run();
  }

  // project_state: copy every saved key; only "program" holds a talent
  // reference, so it's the only one that needs id-remapping before saving.
  const state = await getProjectState(sourceProjectId);
  for (const key of STATE_KEYS) {
    const data = state[key];
    if (data === null || data === undefined) continue;
    if (key === "program" && Array.isArray(data)) {
      const remapped = (data as Beat[]).map((beat) => ({
        ...beat,
        linkedTalent: beat.linkedTalent?.map((talentId) => talentIdMap.get(talentId) ?? talentId),
      }));
      await setProjectState(id, key, remapped, ownerId);
    } else {
      await setProjectState(id, key, data, ownerId);
    }
  }

  return {
    id,
    slug,
    name,
    passcode: null,
    eventDate: source.eventDate,
    companyId: source.companyId,
    archivedAt: null,
  };
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

export async function archiveProject(projectId: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare("UPDATE projects SET archived_at = datetime('now') WHERE id = ?")
    .bind(projectId)
    .run();
}

export async function restoreProject(projectId: string): Promise<void> {
  const db = await getDB();
  await db.prepare("UPDATE projects SET archived_at = NULL WHERE id = ?").bind(projectId).run();
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

// Archived projects never show in a member's own list — same "gone until
// restored" rule as everywhere else.
export async function listUserProjects(userId: string): Promise<(ProjectRow & { role: Role })[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT p.id, p.slug, p.name, p.passcode, p.event_date as eventDate,
              p.company_id as companyId, p.archived_at as archivedAt, pm.role
       FROM project_members pm
       JOIN projects p ON p.id = pm.project_id
       WHERE pm.user_id = ? AND p.archived_at IS NULL
       ORDER BY p.name ASC`
    )
    .bind(userId)
    .all<ProjectRow & { role: Role }>();
  return results;
}

// ---------------------------------------------------------------------------
// Companies — the tenant layer above projects. A company groups users and
// projects together; a user's role within a company ("admin" | "member") is
// purely administrative (who can manage the company's users/projects/library)
// and never substitutes for project_members — opening a specific project
// still requires either an explicit membership row or a company-admin/
// super-admin override (see isProjectMember callers).
// ---------------------------------------------------------------------------

export async function listCompanies(): Promise<CompanyRow[]> {
  const db = await getDB();
  const { results } = await db
    .prepare("SELECT id, slug, name FROM companies ORDER BY created_at ASC")
    .all<CompanyRow>();
  return results;
}

export async function getCompanyBySlug(slug: string): Promise<CompanyRow | null> {
  const db = await getDB();
  return db.prepare("SELECT id, slug, name FROM companies WHERE slug = ?").bind(slug).first<CompanyRow>();
}

export async function createCompany(name: string): Promise<CompanyRow> {
  const db = await getDB();
  const trimmed = name.trim();
  const base = slugify(trimmed);

  let slug = base;
  let n = 1;
  while (await getCompanyBySlug(slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }

  const id = newId();
  await db.prepare("INSERT INTO companies (id, slug, name) VALUES (?, ?, ?)").bind(id, slug, trimmed).run();
  return { id, slug, name: trimmed };
}

export async function renameCompany(companyId: string, name: string): Promise<void> {
  const db = await getDB();
  await db.prepare("UPDATE companies SET name = ? WHERE id = ?").bind(name.trim(), companyId).run();
}

export async function isCompanyAdmin(userId: string, companyId: string): Promise<boolean> {
  const db = await getDB();
  const row = await db
    .prepare("SELECT role FROM company_members WHERE user_id = ? AND company_id = ?")
    .bind(userId, companyId)
    .first<{ role: CompanyRole }>();
  return row?.role === "admin";
}

// The company a user creates new self-serve projects under. Admin-invite-only
// signup always assigns exactly one company at user-creation time, so "first"
// is unambiguous today; this is the one seam if that ever changes.
export async function getPrimaryCompanyId(userId: string): Promise<string | null> {
  const db = await getDB();
  const row = await db
    .prepare("SELECT company_id as companyId FROM company_members WHERE user_id = ? ORDER BY created_at ASC LIMIT 1")
    .bind(userId)
    .first<{ companyId: string }>();
  return row?.companyId ?? null;
}

// Every company where this user holds the company-admin role — scopes which
// companies render on their admin dashboard when they aren't a super admin.
export async function listAdminCompanyIds(userId: string): Promise<string[]> {
  const db = await getDB();
  const { results } = await db
    .prepare("SELECT company_id as companyId FROM company_members WHERE user_id = ? AND role = 'admin'")
    .bind(userId)
    .all<{ companyId: string }>();
  return results.map((r) => r.companyId);
}

export interface CompanyMemberRow {
  userId: string;
  email: string;
  name: string;
  isAdmin: boolean; // global super admin, independent of company role
  companyRole: CompanyRole;
}

export async function listCompanyUsers(companyId: string): Promise<CompanyMemberRow[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT u.id as userId, u.email, u.name, u.is_admin as isAdmin, cm.role as companyRole
       FROM company_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.company_id = ?
       ORDER BY u.name ASC`
    )
    .bind(companyId)
    .all<{ userId: string; email: string; name: string; isAdmin: number; companyRole: CompanyRole }>();
  return results.map((r) => ({ ...r, isAdmin: Boolean(r.isAdmin) }));
}

export async function addCompanyMember(
  companyId: string,
  userId: string,
  role: CompanyRole
): Promise<void> {
  const db = await getDB();
  await db
    .prepare(
      `INSERT INTO company_members (company_id, user_id, role) VALUES (?, ?, ?)
       ON CONFLICT(company_id, user_id) DO UPDATE SET role = excluded.role`
    )
    .bind(companyId, userId, role)
    .run();
}

export async function removeCompanyMember(companyId: string, userId: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare("DELETE FROM company_members WHERE company_id = ? AND user_id = ?")
    .bind(companyId, userId)
    .run();
}

// Every project belonging to a company. Archived projects are excluded by
// default — pass includeArchived to power the Recycle Bin view.
export async function listCompanyProjects(
  companyId: string,
  opts: { includeArchived?: boolean } = {}
): Promise<ProjectRow[]> {
  const db = await getDB();
  const clause = opts.includeArchived ? "" : "AND archived_at IS NULL";
  const { results } = await db
    .prepare(`SELECT ${PROJECT_COLUMNS} FROM projects WHERE company_id = ? ${clause} ORDER BY created_at ASC`)
    .bind(companyId)
    .all<ProjectRow>();
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

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import {
  listCompanies,
  listCompanyUsers,
  listCompanyProjects,
  listProjectMembers,
  listAdminCompanyIds,
  CompanyRow,
} from "@/lib/auth/queries";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { CopyButton } from "@/components/CopyButton";
import { ink, sub, border, hoverBg, danger, accentBg, bg } from "@/lib/notionTheme";
import {
  createCompanyAction,
  renameCompanyAction,
  createUserInCompanyAction,
  setCompanyMemberRoleAction,
  removeCompanyMemberAction,
  deleteUserAction,
  createProjectInCompanyAction,
  assignMemberAction,
  removeMemberAction,
  setPasscodeAction,
  archiveProjectAction,
  restoreProjectAction,
} from "./actions";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const isSuperAdmin = user.isAdmin;
  const adminCompanyIds = isSuperAdmin ? null : new Set(await listAdminCompanyIds(user.id));
  if (!isSuperAdmin && adminCompanyIds!.size === 0) redirect("/projects");

  const allCompanies = await listCompanies();
  const companies = isSuperAdmin ? allCompanies : allCompanies.filter((c) => adminCompanyIds!.has(c.id));

  return (
    <div className="min-h-screen font-sans" style={{ background: bg, color: ink }}>
      <header style={{ borderBottom: `1px solid ${border}` }}>
        <div className="mx-auto max-w-[880px] px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center rounded-[6px] w-5 h-5 text-[11px] font-bold"
              style={{ background: accentBg, color: "#fff" }}
            >
              E
            </span>
            <span className="text-[14px] font-semibold">EventFlow Production — Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/projects" className="text-[13px] hover:underline" style={{ color: sub }}>
              Projects
            </Link>
            <ThemeToggle className="text-[13px] hover:underline" style={{ color: sub }} />
            <SignOutButton className="text-[13px] hover:underline" style={{ color: sub }} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[880px] px-6 py-12 space-y-16">
        <div>
          <h1 className="text-[22px] font-semibold mb-1">Admin</h1>
          <p className="text-[13px] mb-4" style={{ color: sub }}>
            Manage companies, people, and who can see each project.
          </p>
          <details className="rounded-[8px] p-4" style={{ border: `1px solid ${border}` }}>
            <summary className="text-[13px] font-medium cursor-pointer">
              What the roles mean
            </summary>
            <ul className="mt-3 space-y-1.5 text-[12.5px]" style={{ color: sub }}>
              <li>
                <b style={{ color: ink }}>Viewer</b> — can open a project and look, but not
                change anything.
              </li>
              <li>
                <b style={{ color: ink }}>Editor</b> — can open a project and edit its plan.
              </li>
              <li>
                <b style={{ color: ink }}>Owner</b> — full control of that one project.
              </li>
              <li>
                <b style={{ color: ink }}>Company admin</b> — can manage every project, person,
                and setting inside their company (this page).
              </li>
              <li>
                <b style={{ color: ink }}>Super admin</b> — can do all of the above across every
                company on the platform.
              </li>
              <li>
                <b style={{ color: ink }}>via passcode</b> — a guest who got in with a project&apos;s
                shared passcode, not a real account.
              </li>
            </ul>
          </details>
        </div>

        {isSuperAdmin && (
          <div>
            <h2 className="text-[16px] font-semibold mb-3">Create a company</h2>
            <form
              action={createCompanyAction}
              className="flex items-center gap-2 rounded-[8px] p-4"
              style={{ border: `1px solid ${border}` }}
            >
              <input
                name="name"
                placeholder="Company name"
                required
                maxLength={80}
                className="text-[13.5px] rounded-[6px] px-3 py-2 flex-1"
                style={{ border: `1px solid ${border}` }}
              />
              <button
                type="submit"
                className="text-[13.5px] font-medium rounded-[6px] px-4 py-2 shrink-0"
                style={{ background: accentBg, color: "#fff" }}
              >
                Create company
              </button>
            </form>
          </div>
        )}

        {companies.map((company) => (
          <CompanySection key={company.id} company={company} isSuperAdmin={isSuperAdmin} />
        ))}
      </section>
    </div>
  );
}

async function CompanySection({
  company,
  isSuperAdmin,
}: {
  company: CompanyRow;
  isSuperAdmin: boolean;
}) {
  const [companyUsers, projects, allProjects] = await Promise.all([
    listCompanyUsers(company.id),
    listCompanyProjects(company.id),
    listCompanyProjects(company.id, { includeArchived: true }),
  ]);
  const archived = allProjects.filter((p) => p.archivedAt);
  const realUsers = companyUsers.filter((u) => !isGuestEmail(u.email));
  const membersByProject = await Promise.all(
    projects.map(async (p) => ({ project: p, members: await listProjectMembers(p.id) }))
  );

  return (
    <div className="space-y-10 pb-16" style={{ borderBottom: `1px solid ${border}` }}>
      <div>
        <p className="text-[11px] font-medium tracking-wide uppercase mb-1.5" style={{ color: sub }}>
          Company
        </p>
        <h2 className="text-[20px] font-semibold mb-3">{company.name}</h2>
        <form action={renameCompanyAction} className="flex items-center gap-2">
          <input type="hidden" name="companyId" value={company.id} />
          <input
            name="name"
            defaultValue={company.name}
            className="text-[13px] rounded-[6px] px-2.5 py-1.5"
            style={{ border: `1px solid ${border}` }}
          />
          <button
            type="submit"
            className="text-[12px] font-medium rounded-[6px] px-3 py-1.5"
            style={{ border: `1px solid ${border}`, color: sub }}
          >
            Rename
          </button>
        </form>
      </div>

      {/* Add a user */}
      <div>
        <h3 className="text-[14px] font-semibold mb-1">Add a user</h3>
        <p className="text-[12px] mb-3" style={{ color: sub }}>
          Creates a login for a teammate. They can sign in right away with the email and
          password you set here — share those with them. Leave both boxes below unticked for a
          normal member.
        </p>
        <form
          action={createUserInCompanyAction}
          className="grid md:grid-cols-4 gap-2 items-start rounded-[8px] p-4"
          style={{ border: `1px solid ${border}` }}
        >
          <input type="hidden" name="companyId" value={company.id} />
          <input
            name="name"
            placeholder="Name"
            required
            className="text-[13.5px] rounded-[6px] px-3 py-2"
            style={{ border: `1px solid ${border}` }}
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="text-[13.5px] rounded-[6px] px-3 py-2"
            style={{ border: `1px solid ${border}` }}
          />
          <input
            name="password"
            type="password"
            placeholder="Password (8+ chars)"
            required
            minLength={8}
            className="text-[13.5px] rounded-[6px] px-3 py-2"
            style={{ border: `1px solid ${border}` }}
          />
          <button
            type="submit"
            className="text-[13.5px] font-medium rounded-[6px] px-4 py-2"
            style={{ background: accentBg, color: "#fff" }}
          >
            Create user
          </button>
          <label className="flex items-center gap-1.5 text-[12.5px] md:col-span-2" style={{ color: sub }}>
            <input type="checkbox" name="companyAdmin" /> Company admin
          </label>
          {isSuperAdmin && (
            <label className="flex items-center gap-1.5 text-[12.5px] md:col-span-2" style={{ color: sub }}>
              <input type="checkbox" name="superAdmin" /> Super admin
            </label>
          )}
        </form>
      </div>

      {/* Users list */}
      <div>
        <h3 className="text-[14px] font-semibold mb-3">Users ({realUsers.length})</h3>
        <div className="space-y-1.5">
          {realUsers.map((u) => (
            <div
              key={u.userId}
              className="flex items-center justify-between px-4 py-2.5 rounded-[8px]"
              style={{ border: `1px solid ${border}` }}
            >
              <span className="text-[13.5px]">
                <span className="font-medium">{u.name}</span> <span style={{ color: sub }}>{u.email}</span>
                {u.isAdmin && (
                  <span
                    className="ml-2 text-[10.5px] font-medium px-1.5 py-[1px] rounded-full"
                    style={{ border: `1px solid ${border}`, color: sub }}
                  >
                    super admin
                  </span>
                )}
                {u.companyRole === "admin" && (
                  <span
                    className="ml-1 text-[10.5px] font-medium px-1.5 py-[1px] rounded-full"
                    style={{ border: `1px solid ${border}`, color: sub }}
                  >
                    company admin
                  </span>
                )}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <form action={setCompanyMemberRoleAction}>
                  <input type="hidden" name="companyId" value={company.id} />
                  <input type="hidden" name="userId" value={u.userId} />
                  <input type="hidden" name="role" value={u.companyRole === "admin" ? "member" : "admin"} />
                  <button type="submit" className="text-[12px]" style={{ color: sub }}>
                    {u.companyRole === "admin" ? "Revoke admin" : "Make admin"}
                  </button>
                </form>
                <form action={removeCompanyMemberAction}>
                  <input type="hidden" name="companyId" value={company.id} />
                  <input type="hidden" name="userId" value={u.userId} />
                  <ConfirmSubmitButton
                    message={`Remove ${u.name} from ${company.name}? They keep their account but lose access to this company's projects.`}
                    className="text-[12px]"
                    style={{ color: sub }}
                  >
                    Remove from company
                  </ConfirmSubmitButton>
                </form>
                {isSuperAdmin && (
                  <form action={deleteUserAction}>
                    <input type="hidden" name="userId" value={u.userId} />
                    <ConfirmSubmitButton
                      message={`Permanently delete ${u.name}'s account (${u.email})? This cannot be undone.`}
                      className="text-[12px]"
                      style={{ color: danger }}
                    >
                      Delete account
                    </ConfirmSubmitButton>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create a project */}
      <div>
        <h3 className="text-[14px] font-semibold mb-3">Create a project</h3>
        <form
          action={createProjectInCompanyAction}
          className="flex items-center gap-2 rounded-[8px] p-4"
          style={{ border: `1px solid ${border}` }}
        >
          <input type="hidden" name="companyId" value={company.id} />
          <input
            name="name"
            placeholder="Project name"
            required
            maxLength={80}
            className="text-[13.5px] rounded-[6px] px-3 py-2 flex-1"
            style={{ border: `1px solid ${border}` }}
          />
          <button
            type="submit"
            className="text-[13.5px] font-medium rounded-[6px] px-4 py-2 shrink-0"
            style={{ background: accentBg, color: "#fff" }}
          >
            Create project
          </button>
        </form>
        <p className="text-[11.5px] mt-2" style={{ color: sub }}>
          You&apos;ll be set as the owner — reassign it in the project section below.
        </p>
      </div>

      {/* Project assignment */}
      {membersByProject.map(({ project, members }) => {
        const memberIds = new Set(members.map((m) => m.userId));
        const available = realUsers.filter((u) => !memberIds.has(u.userId));
        return (
          <div key={project.id}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold">Project: {project.name}</h3>
              <form action={archiveProjectAction}>
                <input type="hidden" name="projectId" value={project.id} />
                <ConfirmSubmitButton
                  message={`Archive "${project.name}"? It moves to the recycle bin below and everyone loses access until it's restored.`}
                  className="text-[12px]"
                  style={{ color: danger }}
                >
                  Archive
                </ConfirmSubmitButton>
              </form>
            </div>

            {/* Passcode */}
            <form
              action={setPasscodeAction}
              className="flex items-center gap-2 rounded-[8px] p-3 mb-3"
              style={{ border: `1px solid ${border}` }}
            >
              <input type="hidden" name="projectId" value={project.id} />
              <span className="text-[12.5px] shrink-0" style={{ color: sub }}>
                Guest passcode
              </span>
              <input
                name="passcode"
                defaultValue={project.passcode ?? ""}
                placeholder="No passcode set"
                className="text-[13px] rounded-[6px] px-2.5 py-1.5 flex-1"
                style={{ border: `1px solid ${border}` }}
              />
              {project.passcode && (
                <CopyButton
                  value={project.passcode}
                  className="text-[13px] font-medium rounded-[6px] px-3 py-1.5 shrink-0"
                  style={{ border: `1px solid ${border}`, color: sub }}
                />
              )}
              <button
                type="submit"
                className="text-[13px] font-medium rounded-[6px] px-3 py-1.5"
                style={{ background: accentBg, color: "#fff" }}
              >
                Save
              </button>
            </form>
            <p className="text-[11.5px] mb-3" style={{ color: sub }}>
              Anyone with this passcode gets instant view-only access on the landing page — no account needed.
              Clear the field to disable.
            </p>

            <div className="space-y-1.5 mb-3">
              {members.length === 0 && (
                <p className="text-[13px]" style={{ color: sub }}>
                  No one is assigned to this project yet.
                </p>
              )}
              {members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between px-4 py-2.5 rounded-[8px]"
                  style={{ border: `1px solid ${border}` }}
                >
                  <span className="text-[13.5px]">
                    <span className="font-medium">{m.name}</span> <span style={{ color: sub }}>{m.email}</span>{" "}
                    <span
                      className="ml-1 text-[10.5px] font-medium px-1.5 py-[1px] rounded-full"
                      style={{ border: `1px solid ${border}`, color: sub }}
                    >
                      {m.role}
                    </span>
                    {isGuestEmail(m.email) && (
                      <span
                        className="ml-1 text-[10.5px] font-medium px-1.5 py-[1px] rounded-full"
                        style={{ border: `1px solid ${border}`, color: sub }}
                      >
                        via passcode
                      </span>
                    )}
                  </span>
                  <form action={removeMemberAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="userId" value={m.userId} />
                    <ConfirmSubmitButton
                      message={`Remove ${m.name} from "${project.name}"? They'll lose access to this project.`}
                      className="text-[12px]"
                      style={{ color: danger }}
                    >
                      Remove
                    </ConfirmSubmitButton>
                  </form>
                </div>
              ))}
            </div>

            {available.length > 0 && (
              <form
                action={assignMemberAction}
                className="flex items-center gap-2 rounded-[8px] p-3"
                style={{ background: hoverBg }}
              >
                <input type="hidden" name="projectId" value={project.id} />
                <span className="text-[12.5px] shrink-0" style={{ color: sub }}>
                  Give
                </span>
                <select
                  name="userId"
                  required
                  aria-label="Person to give access to"
                  className="text-[13px] rounded-[6px] px-2.5 py-1.5 flex-1"
                  style={{ border: `1px solid ${border}` }}
                >
                  {available.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                <span className="text-[12.5px] shrink-0" style={{ color: sub }}>
                  access as
                </span>
                <select
                  name="role"
                  defaultValue="viewer"
                  aria-label="Access level"
                  className="text-[13px] rounded-[6px] px-2.5 py-1.5"
                  style={{ border: `1px solid ${border}` }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="owner">Owner</option>
                </select>
                <button
                  type="submit"
                  className="text-[13px] font-medium rounded-[6px] px-3 py-1.5"
                  style={{ background: accentBg, color: "#fff" }}
                >
                  Assign
                </button>
              </form>
            )}
          </div>
        );
      })}

      {/* Recycle bin */}
      {archived.length > 0 && (
        <div>
          <h3 className="text-[14px] font-semibold mb-3">Recycle bin ({archived.length})</h3>
          <div className="space-y-1.5">
            {archived.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-2.5 rounded-[8px]"
                style={{ border: `1px solid ${border}` }}
              >
                <span className="text-[13.5px] font-medium">{p.name}</span>
                <form action={restoreProjectAction}>
                  <input type="hidden" name="projectId" value={p.id} />
                  <button
                    type="submit"
                    className="text-[12px] font-medium"
                    style={{ color: sub }}
                  >
                    Restore
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function isGuestEmail(email: string): boolean {
  return email.startsWith("guest+") && email.endsWith("@eventflow.local");
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listUsers, listProjects, listProjectMembers } from "@/lib/auth/queries";
import { SignOutButton } from "@/components/SignOutButton";
import { ink, sub, border, hoverBg, danger } from "@/lib/notionTheme";
import {
  createUserAction,
  createProjectAction,
  deleteUserAction,
  assignMemberAction,
  removeMemberAction,
  setPasscodeAction,
} from "./actions";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/projects");

  const [users, projects] = await Promise.all([listUsers(), listProjects()]);
  const membersByProject = await Promise.all(
    projects.map(async (p) => ({ project: p, members: await listProjectMembers(p.id) }))
  );

  return (
    <div className="min-h-screen font-sans" style={{ background: "#ffffff", color: ink }}>
      <header style={{ borderBottom: `1px solid ${border}` }}>
        <div className="mx-auto max-w-[880px] px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center rounded-[6px] w-5 h-5 text-[11px] font-bold"
              style={{ background: ink, color: "#fff" }}
            >
              E
            </span>
            <span className="text-[14px] font-semibold">EventFlow Production — Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/projects" className="text-[13px] hover:underline" style={{ color: sub }}>
              Projects
            </Link>
            <SignOutButton className="text-[13px] hover:underline" style={{ color: sub }} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[880px] px-6 py-12 space-y-12">
        {/* Create user */}
        <div>
          <h2 className="text-[16px] font-semibold mb-3">Add a user</h2>
          <form
            action={createUserAction}
            className="grid md:grid-cols-4 gap-2 items-start rounded-[8px] p-4"
            style={{ border: `1px solid ${border}` }}
          >
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
              style={{ background: ink, color: "#fff" }}
            >
              Create user
            </button>
            <label className="flex items-center gap-1.5 text-[12.5px] md:col-span-4" style={{ color: sub }}>
              <input type="checkbox" name="isAdmin" /> Grant admin access
            </label>
          </form>
        </div>

        {/* Users list */}
        <div>
          <h2 className="text-[16px] font-semibold mb-3">
            All users ({users.filter((u) => !isGuestEmail(u.email)).length})
          </h2>
          <div className="space-y-1.5">
            {users
              .filter((u) => !isGuestEmail(u.email))
              .map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-[8px]"
                  style={{ border: `1px solid ${border}` }}
                >
                  <span className="text-[13.5px]">
                    <span className="font-medium">{u.name}</span>{" "}
                    <span style={{ color: sub }}>{u.email}</span>
                    {u.isAdmin && (
                      <span
                        className="ml-2 text-[10.5px] font-medium px-1.5 py-[1px] rounded-full"
                        style={{ border: `1px solid ${border}`, color: sub }}
                      >
                        admin
                      </span>
                    )}
                  </span>
                  <form action={deleteUserAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button
                      type="submit"
                      className="text-[12px]"
                      style={{ color: danger }}
                    >
                      Remove
                    </button>
                  </form>
                </div>
              ))}
          </div>
        </div>

        {/* Create a project */}
        <div>
          <h2 className="text-[16px] font-semibold mb-3">Create a project</h2>
          <form
            action={createProjectAction}
            className="flex items-center gap-2 rounded-[8px] p-4"
            style={{ border: `1px solid ${border}` }}
          >
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
              style={{ background: ink, color: "#fff" }}
            >
              Create project
            </button>
          </form>
          <p className="text-[11.5px] mt-2" style={{ color: sub }}>
            You&apos;ll be set as the owner — reassign it in the project section
            below.
          </p>
        </div>

        {/* Project assignment */}
        {membersByProject.map(({ project, members }) => {
          const memberIds = new Set(members.map((m) => m.userId));
          const available = users.filter(
            (u) => !memberIds.has(u.id) && !isGuestEmail(u.email)
          );
          return (
            <div key={project.id}>
              <h2 className="text-[16px] font-semibold mb-3">
                Project: {project.name}
              </h2>

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
                <button
                  type="submit"
                  className="text-[13px] font-medium rounded-[6px] px-3 py-1.5"
                  style={{ background: ink, color: "#fff" }}
                >
                  Save
                </button>
              </form>
              <p className="text-[11.5px] mb-3" style={{ color: sub }}>
                Anyone with this passcode gets instant view-only access on the
                landing page — no account needed. Clear the field to disable.
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
                      <span className="font-medium">{m.name}</span>{" "}
                      <span style={{ color: sub }}>{m.email}</span>{" "}
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
                      <button type="submit" className="text-[12px]" style={{ color: danger }}>
                        Remove
                      </button>
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
                  <select
                    name="userId"
                    required
                    className="text-[13px] rounded-[6px] px-2.5 py-1.5 flex-1"
                    style={{ border: `1px solid ${border}` }}
                  >
                    {available.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  <select
                    name="role"
                    defaultValue="viewer"
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
                    style={{ background: ink, color: "#fff" }}
                  >
                    Assign
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}

function isGuestEmail(email: string): boolean {
  return email.startsWith("guest+") && email.endsWith("@eventflow.local");
}

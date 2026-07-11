import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listUserProjects } from "@/lib/auth/queries";
import { SignOutButton } from "@/components/SignOutButton";
import { ink, sub, border, hoverBg } from "@/lib/notionTheme";
import { createProjectFromTemplateAction, duplicateProjectAction } from "./actions";
import { NewProjectWizard } from "@/components/projects/NewProjectWizard";

export default async function ProjectsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const projects = await listUserProjects(user.id);

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
            <span className="text-[14px] font-semibold">EventFlow Production</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/library" className="text-[13px] hover:underline" style={{ color: sub }}>
              Library
            </Link>
            {user.isAdmin && (
              <Link href="/admin" className="text-[13px] hover:underline" style={{ color: sub }}>
                Admin
              </Link>
            )}
            <SignOutButton className="text-[13px] hover:underline" style={{ color: sub }} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[880px] px-6 py-12">
        <h1 className="text-[22px] font-semibold mb-1">Your projects</h1>
        <p className="text-[13.5px] mb-6" style={{ color: sub }}>
          Signed in as {user.name} ({user.email})
        </p>

        {/* Create a new project — self-serve for any signed-in user, via the
            archetype wizard (pick a shape, answer a short brief). */}
        <NewProjectWizard action={createProjectFromTemplateAction} />

        {projects.length === 0 ? (
          <div
            className="rounded-[8px] px-5 py-6 text-[13.5px]"
            style={{ border: `1px solid ${border}`, color: sub }}
          >
            You don&apos;t have any projects yet. Create one above to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3.5 px-4 py-3.5 rounded-[8px] transition-colors"
                style={{ border: `1px solid ${border}` }}
              >
                <Link href={`/p/${p.slug}/dashboard`} className="flex items-center gap-3.5 flex-1 min-w-0">
                  <span
                    className="w-9 h-9 rounded-[7px] flex items-center justify-center shrink-0 text-[13px] font-semibold"
                    style={{ background: hoverBg, color: ink }}
                  >
                    {p.name.slice(0, 1)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="text-[14.5px] font-semibold block truncate">{p.name}</span>
                    <span className="text-[12px]" style={{ color: sub }}>
                      Your role: {p.role}
                    </span>
                  </span>
                </Link>
                {p.role === "owner" && (
                  <form action={duplicateProjectAction} className="flex items-center gap-1.5 shrink-0">
                    <input type="hidden" name="projectId" value={p.id} />
                    <input
                      name="name"
                      placeholder={`${p.name} (Copy)`}
                      className="hidden sm:block text-[12px] rounded-[6px] px-2 py-1.5 w-36"
                      style={{ border: `1px solid ${border}` }}
                    />
                    <button
                      type="submit"
                      className="text-[12px] font-medium rounded-[6px] px-3 py-1.5 shrink-0"
                      style={{ border: `1px solid ${border}`, color: sub }}
                    >
                      Duplicate
                    </button>
                  </form>
                )}
                <Link href={`/p/${p.slug}/dashboard`} className="text-[13px] shrink-0" style={{ color: sub }}>
                  Open →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

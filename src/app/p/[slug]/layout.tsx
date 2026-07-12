import { redirect } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { CustomActsHydrator } from "@/components/CustomActsHydrator";
import { ProjectProvider } from "@/components/ProjectProvider";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectBySlug, isProjectMember, isCompanyAdmin } from "@/lib/auth/queries";
import { getProjectState } from "@/lib/builder/projectState";
import { deriveDashboardVars } from "@/lib/dashboardTheme";
import { sanitizeEventTheme } from "@/data/theme";

// Every route under /p/[slug] is one project's dashboard. Resolve the project
// from the URL slug and require a signed-in user who's actually a member (or
// an admin). The resolved project is handed to the client tree via
// ProjectProvider so pages read the active slug instead of a hardcoded one.
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  if (!project) redirect("/projects");

  // Archived = a recycle bin, not a read-only view — nobody can open the live
  // dashboard while archived; restoring happens from the admin Recycle Bin,
  // which never needs to load this route.
  if (project.archivedAt) redirect("/projects");

  // Super Admin keeps its existing blanket access; a Company Admin gets the
  // same blanket "owner" access, but only within their own company — mirrors
  // the existing super-admin override, just scoped.
  const role =
    user.isAdmin || (project.companyId && (await isCompanyAdmin(user.id, project.companyId)))
      ? "owner"
      : await isProjectMember(user.id, project.id);
  if (!role) redirect("/projects");

  // A project with a generated AI theme gets its dashboard's colors derived
  // from that theme's palette; a project with none (JW's, unless she opts
  // in) renders with the fixed default vars, completely unchanged. The
  // wrapper below mirrors <body>'s own "min-h-full flex flex-col" so NavBar's
  // sticky positioning and main's flex-1 sizing behave exactly as before,
  // but — unlike a display:contents div — it actually paints `background:
  // var(--bg)` itself, so the space between panels/sections (previously
  // showing <body>'s own un-themed background, since body is this div's
  // parent, not a descendant) now correctly shows the active theme too.
  // Explicitly choosing light mode always wins over a project's theme here
  // — see globals.css's `[data-theme="light"] [data-project-theme]` block.
  // It has to target this div directly (via the data-project-theme
  // attribute below), not just <html>: an !important rule on an ancestor
  // only wins for properties the ancestor itself computes — it can't reach
  // through to override a property this div re-declares locally inline.
  // aiTheme comes back from the DB as `unknown` — both write paths already
  // run it through sanitizeEventTheme before saving, so this is normally a
  // no-op re-validation. It's not decorative, though: it's the only thing
  // standing between a malformed/partial row (hand-edited data, a future
  // schema change, a future write path that forgets to validate) and an
  // unhandled exception in deriveDashboardVars (e.g. `theme.palette.filter`
  // on a row with no `palette`) that would 500 every route under this
  // project — there's no error.tsx boundary in this app to contain it.
  const state = await getProjectState(project.id);
  const aiTheme = sanitizeEventTheme(state.aiTheme);
  const dashboardVars = aiTheme ? deriveDashboardVars(aiTheme) : null;

  return (
    <ProjectProvider
      value={{ slug, projectId: project.id, name: project.name, role }}
    >
      <div
        className="min-h-full flex-1 flex flex-col"
        data-project-theme=""
        style={{ background: "var(--bg)", ...dashboardVars } as React.CSSProperties}
      >
        <CustomActsHydrator slug={slug} />
        <NavBar />
        <main className="flex-1">{children}</main>
      </div>
    </ProjectProvider>
  );
}

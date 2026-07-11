import { redirect } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { CustomActsHydrator } from "@/components/CustomActsHydrator";
import { ProjectProvider } from "@/components/ProjectProvider";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectBySlug, isProjectMember, isCompanyAdmin } from "@/lib/auth/queries";

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

  return (
    <ProjectProvider
      value={{ slug, projectId: project.id, name: project.name, role }}
    >
      <CustomActsHydrator slug={slug} />
      <NavBar />
      <main className="flex-1">{children}</main>
    </ProjectProvider>
  );
}

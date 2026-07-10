import { redirect } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { CustomActsHydrator } from "@/components/CustomActsHydrator";
import { ProjectProvider } from "@/components/ProjectProvider";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectBySlug, isProjectMember } from "@/lib/auth/queries";

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

  const role = user.isAdmin ? "owner" : await isProjectMember(user.id, project.id);
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

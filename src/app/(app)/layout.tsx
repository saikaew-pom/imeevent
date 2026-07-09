import { redirect } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectBySlug, isProjectMember } from "@/lib/auth/queries";

// Every route under this group is the JW Gala Garden Night dashboard —
// require a signed-in user who is actually assigned to that project.
const PROJECT_SLUG = "jw-gala-garden-night";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(PROJECT_SLUG);
  if (!project) redirect("/projects");

  const role = user.isAdmin ? "owner" : await isProjectMember(user.id, project.id);
  if (!role) redirect("/projects");

  return (
    <>
      <NavBar />
      <main className="flex-1">{children}</main>
    </>
  );
}

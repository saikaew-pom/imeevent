import "server-only";
import { getSessionUser, SessionUser } from "@/lib/auth/session";
import { getProjectBySlug, isProjectMember, ProjectRow, Role } from "@/lib/auth/queries";

const CAN_WRITE: Role[] = ["owner", "editor"];

export interface ProjectAccess {
  user: SessionUser;
  project: ProjectRow;
  role: Role;
}

// Resolve the current user's access to a project by slug. Site admins are
// treated as "owner" on every project. Returns null if unauthenticated, the
// project doesn't exist, or the user isn't a member.
export async function getProjectAccess(slug: string): Promise<ProjectAccess | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const project = await getProjectBySlug(slug);
  if (!project) return null;

  const role: Role | null = user.isAdmin ? "owner" : await isProjectMember(user.id, project.id);
  if (!role) return null;

  return { user, project, role };
}

export function canWrite(role: Role): boolean {
  return CAN_WRITE.includes(role);
}

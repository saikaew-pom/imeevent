import "server-only";
import { getSessionUser, SessionUser } from "@/lib/auth/session";
import {
  getPrimaryCompanyId,
  isCompanyMember,
  isCompanyAdmin,
  listCompanies,
  getProjectById,
  isProjectMember,
  Role,
} from "@/lib/auth/queries";
import { getProjectAccess } from "@/lib/builder/access";

export interface LibraryAccess {
  user: SessionUser;
  companyId: string;
  isAdmin: boolean; // can curate (add/edit/delete) the library
}

// Resolves the caller's own company for the Company Library — never accepts
// a client-supplied companyId, so there's no parameter to tamper with. Super
// admins with no company membership of their own fall back to the first
// company that exists, so the library always resolves to something for them.
export async function getLibraryAccess(): Promise<LibraryAccess | null> {
  const user = await getSessionUser();
  if (!user) return null;

  let companyId = await getPrimaryCompanyId(user.id);
  if (!companyId && user.isAdmin) {
    const companies = await listCompanies();
    companyId = companies[0]?.id ?? null;
  }
  if (!companyId) return null;

  const isMember = user.isAdmin || (await isCompanyMember(user.id, companyId));
  if (!isMember) return null;

  const isAdmin = user.isAdmin || (await isCompanyAdmin(user.id, companyId));
  return { user, companyId, isAdmin };
}

// Verifies the caller can copy a library item into the given project: the
// project must belong to the same company as the library (never mix
// content across companies) and the caller must have write access to it.
export async function assertCanCopyToProject(
  access: LibraryAccess,
  projectId: string
): Promise<void> {
  const project = await getProjectById(projectId);
  if (!project || project.companyId !== access.companyId) {
    throw new Error("Project not found.");
  }
  const role = access.user.isAdmin ? "owner" : await isProjectMember(access.user.id, projectId);
  if (role !== "owner" && role !== "editor") {
    throw new Error("You need editor access on that project to copy items into it.");
  }
}

export interface ProjectLibraryAccess {
  companyId: string;
  projectId: string;
  userId: string;
  role: Role;
}

// Resolves the Company Library that a project's OWN pages (Media Library,
// Show & Decor Builder) should browse from — the reverse of
// getLibraryAccess() above, which resolves from the CALLER's own company.
// This resolves from the PROJECT being viewed instead, so a company admin
// or super admin working on a project outside their own primary company
// still sees that project's actual library, not their own. A project with
// no company (JW's, or any project never assigned to one) has no library to
// browse — returns null, same as "not allowed", so callers can treat
// "unavailable" and "unauthorized" the same way (hide the entry point).
export async function getProjectLibraryAccess(slug: string): Promise<ProjectLibraryAccess | null> {
  const access = await getProjectAccess(slug);
  if (!access || !access.project.companyId) return null;
  return {
    companyId: access.project.companyId,
    projectId: access.project.id,
    userId: access.user.id,
    role: access.role,
  };
}

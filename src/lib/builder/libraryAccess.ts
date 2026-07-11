import "server-only";
import { getSessionUser, SessionUser } from "@/lib/auth/session";
import {
  getPrimaryCompanyId,
  isCompanyMember,
  isCompanyAdmin,
  listCompanies,
  getProjectById,
  isProjectMember,
} from "@/lib/auth/queries";

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

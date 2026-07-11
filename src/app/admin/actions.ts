"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import {
  createUser,
  createProject,
  deleteUser,
  addProjectMember,
  removeProjectMember,
  getUserByEmail,
  setProjectPasscode,
  createCompany,
  renameCompany,
  isCompanyAdmin,
  addCompanyMember,
  removeCompanyMember,
  getProjectById,
  archiveProject,
  restoreProject,
  Role,
  CompanyRole,
} from "@/lib/auth/queries";

async function requireSuperAdmin() {
  const user = await getSessionUser();
  if (!user || !user.isAdmin) {
    throw new Error("Forbidden — super admin only.");
  }
  return user;
}

// Any action scoped to one company: a super admin can act on every company;
// a company's own admin can act only on that one. Company Admin never gets
// power outside their own company.
async function requireCompanyAdmin(companyId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Forbidden.");
  if (user.isAdmin) return user;
  if (await isCompanyAdmin(user.id, companyId)) return user;
  throw new Error("Forbidden — company admin only.");
}

// Same check, but for actions keyed by project id — resolves the project's
// own company first.
async function requireProjectCompanyAdmin(projectId: string) {
  const project = await getProjectById(projectId);
  if (!project || !project.companyId) throw new Error("Project not found.");
  await requireCompanyAdmin(project.companyId);
  return project;
}

export async function createCompanyAction(formData: FormData) {
  await requireSuperAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("A company name is required.");
  await createCompany(name);
  revalidatePath("/admin");
}

export async function renameCompanyAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  await requireCompanyAdmin(companyId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("A company name is required.");
  await renameCompany(companyId, name);
  revalidatePath("/admin");
}

export async function createUserInCompanyAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const actor = await requireCompanyAdmin(companyId);

  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const companyRole: CompanyRole = formData.get("companyAdmin") === "on" ? "admin" : "member";
  // Only a super admin can grant global super-admin access, no matter what a
  // tampered form submits — a company admin creating a user can never do this.
  const grantSuperAdmin = actor.isAdmin && formData.get("superAdmin") === "on";

  if (!email || !name || password.length < 8) {
    throw new Error("Email, name, and an 8+ character password are required.");
  }
  if (await getUserByEmail(email)) {
    throw new Error("A user with that email already exists.");
  }

  const user = await createUser({ email, name, password, isAdmin: grantSuperAdmin });
  await addCompanyMember(companyId, user.id, companyRole);
  revalidatePath("/admin");
}

export async function setCompanyMemberRoleAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  await requireCompanyAdmin(companyId);
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "member") as CompanyRole;
  if (!userId) return;
  await addCompanyMember(companyId, userId, role);
  revalidatePath("/admin");
}

export async function removeCompanyMemberAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  await requireCompanyAdmin(companyId);
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  await removeCompanyMember(companyId, userId);
  revalidatePath("/admin");
}

// Full account delete — stays super-admin-only, distinct from "remove from
// company" above (which only drops that one company's membership).
export async function deleteUserAction(formData: FormData) {
  await requireSuperAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  await deleteUser(userId);
  revalidatePath("/admin");
}

export async function createProjectInCompanyAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const actor = await requireCompanyAdmin(companyId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("A project name is required.");
  // The acting admin becomes the initial owner; they can reassign it below.
  await createProject({ name, ownerId: actor.id, companyId });
  revalidatePath("/admin");
}

export async function assignMemberAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectCompanyAdmin(projectId);
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "viewer") as Role;
  if (!userId) return;
  await addProjectMember(projectId, userId, role);
  revalidatePath("/admin");
}

export async function removeMemberAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectCompanyAdmin(projectId);
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  await removeProjectMember(projectId, userId);
  revalidatePath("/admin");
}

export async function setPasscodeAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectCompanyAdmin(projectId);
  const passcode = String(formData.get("passcode") ?? "").trim();
  await setProjectPasscode(projectId, passcode || null);
  revalidatePath("/admin");
}

export async function archiveProjectAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectCompanyAdmin(projectId);
  await archiveProject(projectId);
  revalidatePath("/admin");
}

export async function restoreProjectAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectCompanyAdmin(projectId);
  await restoreProject(projectId);
  revalidatePath("/admin");
}

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
  Role,
} from "@/lib/auth/queries";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || !user.isAdmin) {
    throw new Error("Forbidden — admin only.");
  }
  return user;
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const isAdmin = formData.get("isAdmin") === "on";

  if (!email || !name || password.length < 8) {
    throw new Error("Email, name, and an 8+ character password are required.");
  }
  if (await getUserByEmail(email)) {
    throw new Error("A user with that email already exists.");
  }

  await createUser({ email, name, password, isAdmin });
  revalidatePath("/admin");
}

export async function createProjectAction(formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("A project name is required.");
  // The admin becomes the initial owner; they can reassign ownership below.
  await createProject({ name, ownerId: admin.id });
  revalidatePath("/admin");
}

export async function deleteUserAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  await deleteUser(userId);
  revalidatePath("/admin");
}

export async function assignMemberAction(formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "viewer") as Role;
  if (!projectId || !userId) return;
  await addProjectMember(projectId, userId, role);
  revalidatePath("/admin");
}

export async function removeMemberAction(formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!projectId || !userId) return;
  await removeProjectMember(projectId, userId);
  revalidatePath("/admin");
}

export async function setPasscodeAction(formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const passcode = String(formData.get("passcode") ?? "").trim();
  if (!projectId) return;
  await setProjectPasscode(projectId, passcode || null);
  revalidatePath("/admin");
}

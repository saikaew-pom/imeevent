"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createProject } from "@/lib/auth/queries";

// Self-serve project creation: any signed-in user can create a project and
// becomes its owner. (Step 3 will route the new project to its own dashboard;
// for now it appears in the creator's project list.)
export async function createProjectAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("A project name is required.");

  await createProject({ name, ownerId: user.id });
  revalidatePath("/projects");
}

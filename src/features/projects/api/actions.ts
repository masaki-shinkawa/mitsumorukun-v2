"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createProject, deleteProject } from "./projects-repository";

export async function createProjectAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    throw new Error("案件名は必須です");
  }

  const project = await createProject({ name, description });
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function deleteProjectAction(projectId: string): Promise<void> {
  await deleteProject(projectId);
  revalidatePath("/projects");
  redirect("/projects");
}

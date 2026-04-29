"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { createProject, deleteProject } from "./projects-repository";

const createProjectSchema = z.object({
  name: z.string().min(1, "案件名は必須です").max(200),
  description: z.string().max(2000).default(""),
});

export async function createProjectAction(formData: FormData): Promise<void> {
  const result = createProjectSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  });

  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }

  const project = await createProject(result.data);
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function deleteProjectAction(projectId: string): Promise<void> {
  const id = z.string().uuid().parse(projectId);
  await deleteProject(id);
  revalidatePath("/projects");
  redirect("/projects");
}

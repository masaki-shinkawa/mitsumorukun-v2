import { prisma } from "@/lib/db/client";
import type { Project } from "../types/project";

function toProject(row: {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listProjects(): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toProject);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const row = await prisma.project.findUnique({ where: { id } });
  return row ? toProject(row) : undefined;
}

export async function createProject(input: {
  name: string;
  description: string;
}): Promise<Project> {
  const row = await prisma.project.create({
    data: { name: input.name, description: input.description },
  });
  return toProject(row);
}

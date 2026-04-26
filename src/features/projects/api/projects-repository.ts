import type { Project } from "../types/project";

// POC: in-process memory store. Replaced by Postgres adapter later.
const store = new Map<string, Project>();

function generateId(): string {
  return globalThis.crypto.randomUUID();
}

export function listProjects(): Project[] {
  return Array.from(store.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getProject(id: string): Project | undefined {
  return store.get(id);
}

export function createProject(input: {
  name: string;
  description: string;
}): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: generateId(),
    name: input.name,
    description: input.description,
    createdAt: now,
    updatedAt: now,
  };
  store.set(project.id, project);
  return project;
}

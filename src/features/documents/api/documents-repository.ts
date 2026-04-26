import type { DocumentMeta } from "../types/document";

// POC: in-process memory store. Actual file bytes are not persisted yet —
// only metadata is kept. MinIO storage will be wired in later.
const store = new Map<string, DocumentMeta>();

function generateId(): string {
  return globalThis.crypto.randomUUID();
}

export function listDocuments(projectId: string): DocumentMeta[] {
  return Array.from(store.values())
    .filter((d) => d.projectId === projectId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function addDocument(input: {
  projectId: string;
  fileName: string;
  size: number;
  contentType: string;
}): DocumentMeta {
  const meta: DocumentMeta = {
    id: generateId(),
    projectId: input.projectId,
    fileName: input.fileName,
    size: input.size,
    contentType: input.contentType,
    uploadedAt: new Date().toISOString(),
  };
  store.set(meta.id, meta);
  return meta;
}

export function deleteDocument(id: string): void {
  store.delete(id);
}

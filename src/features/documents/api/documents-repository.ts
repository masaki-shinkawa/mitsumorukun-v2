import { prisma } from "@/lib/db/client";
import { deleteObject, putObject } from "@/lib/storage/client";
import type { DocumentMeta } from "../types/document";

function toMeta(row: {
  id: string;
  projectId: string;
  fileName: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
}): DocumentMeta {
  return {
    id: row.id,
    projectId: row.projectId,
    fileName: row.fileName,
    size: row.size,
    contentType: row.contentType,
    uploadedAt: row.uploadedAt.toISOString(),
  };
}

function buildStorageKey(projectId: string, fileName: string): string {
  const safeName = fileName.replace(/[^\w.\-]+/g, "_");
  return `projects/${projectId}/${globalThis.crypto.randomUUID()}-${safeName}`;
}

export async function listDocuments(projectId: string): Promise<DocumentMeta[]> {
  const rows = await prisma.document.findMany({
    where: { projectId },
    orderBy: { uploadedAt: "desc" },
  });
  return rows.map(toMeta);
}

export async function addDocument(input: {
  projectId: string;
  fileName: string;
  size: number;
  contentType: string;
  body: Buffer | Uint8Array;
}): Promise<DocumentMeta> {
  const storageKey = buildStorageKey(input.projectId, input.fileName);
  await putObject({
    key: storageKey,
    body: input.body,
    contentType: input.contentType,
  });
  const row = await prisma.document.create({
    data: {
      projectId: input.projectId,
      fileName: input.fileName,
      size: input.size,
      contentType: input.contentType,
      storageKey,
    },
  });
  return toMeta(row);
}

export async function deleteDocument(id: string): Promise<void> {
  const row = await prisma.document.findUnique({ where: { id } });
  if (!row) return;
  await prisma.document.delete({ where: { id } });
  try {
    await deleteObject(row.storageKey);
  } catch (err) {
    console.error(`[documents] failed to delete object ${row.storageKey}`, err);
  }
}

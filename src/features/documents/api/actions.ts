"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { addDocument, deleteDocument } from "./documents-repository";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const uploadFileSchema = z.file().max(MAX_FILE_SIZE).mime([
  "text/markdown",
  "text/plain",
  "text/x-markdown",
  "application/octet-stream",
]);

const deleteDocumentSchema = z.object({
  projectId: z.string().uuid(),
  documentId: z.string().uuid(),
});

export async function uploadDocumentsAction(
  projectId: string,
  formData: FormData,
): Promise<{ added: number; skipped: string[] }> {
  z.string().uuid().parse(projectId);

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  const skipped: string[] = [];
  let added = 0;

  for (const file of files) {
    if (!file.name) continue;

    const result = uploadFileSchema.safeParse(file);
    if (!result.success) {
      skipped.push(`${file.name}（${result.error.issues[0].message}）`);
      continue;
    }

    const body = new Uint8Array(await file.arrayBuffer());
    await addDocument({
      projectId,
      fileName: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
      body,
    });
    added += 1;
  }

  revalidatePath(`/projects/${projectId}`);
  return { added, skipped };
}

export async function deleteDocumentAction(input: {
  projectId: string;
  documentId: string;
}): Promise<void> {
  const { projectId, documentId } = deleteDocumentSchema.parse(input);
  await deleteDocument(documentId);
  revalidatePath(`/projects/${projectId}`);
}

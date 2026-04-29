"use server";

import { revalidatePath } from "next/cache";
import {
  addDocument,
  deleteDocument,
} from "./documents-repository";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function uploadDocumentsAction(
  projectId: string,
  formData: FormData,
): Promise<{ added: number; skipped: string[] }> {
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  const skipped: string[] = [];
  let added = 0;
  for (const file of files) {
    if (!file.name) continue;
    if (file.size === 0) {
      skipped.push(`${file.name}（空ファイル）`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      skipped.push(`${file.name}（サイズ上限 20MB 超過）`);
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
  await deleteDocument(input.documentId);
  revalidatePath(`/projects/${input.projectId}`);
}

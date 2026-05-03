import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getModel } from "@/lib/openai/client";
import {
  createExtractionRun,
  hasRunningExtractionRun,
  abandonStaleRuns,
} from "./extraction-repository";
import { runExtractionJob } from "./extraction-job";

const startSchema = z.object({
  projectId: z.string().uuid(),
});

export type StartExtractionResult =
  | { ok: true; runId: string }
  | { ok: false; error: string };

export async function startExtraction(
  projectId: string,
): Promise<StartExtractionResult> {
  const parsed = startSchema.safeParse({ projectId });
  if (!parsed.success) {
    return { ok: false, error: "無効なパラメータです" };
  }

  await abandonStaleRuns(projectId);

  const alreadyRunning = await hasRunningExtractionRun(projectId);
  if (alreadyRunning) {
    return { ok: false, error: "既に抽出ジョブが実行中です。完了後に再実行してください。" };
  }

  const documents = await prisma.document.findMany({
    where: { projectId },
    orderBy: { uploadedAt: "asc" },
    select: {
      id: true,
      fileName: true,
      storageKey: true,
      uploadedAt: true,
      contentType: true,
    },
  });

  if (documents.length === 0) {
    return {
      ok: false,
      error: "ドキュメントがアップロードされていません。先にファイルをアップロードしてください。",
    };
  }

  const mdDocuments = documents.filter(
    (d) => d.contentType === "text/markdown" || d.fileName.endsWith(".md"),
  );

  if (mdDocuments.length === 0) {
    return {
      ok: false,
      error: "Markdownファイルが見つかりません。現在はMarkdown（.md）のみ対応しています。",
    };
  }

  const model = getModel("normal");
  const documentSnapshot = mdDocuments.map((d) => ({
    id: d.id,
    fileName: d.fileName,
    uploadedAt: d.uploadedAt.toISOString(),
  }));

  const run = await createExtractionRun({
    projectId,
    model,
    documentSnapshot,
  });

  try {
    await runExtractionJob({
      runId: run.id,
      projectId,
      documents: mdDocuments,
    });
  } catch {
    // error is already persisted in the run record
  }

  return { ok: true, runId: run.id };
}

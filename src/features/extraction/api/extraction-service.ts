import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getModel } from "@/lib/openai/client";
import {
  createExtractionRun,
  hasRunningExtractionRun,
  abandonStaleRuns,
} from "./extraction-repository";
import { runExtractionJob } from "./extraction-job";
import type { Granularity } from "@/generated/prisma/enums";

const startSchema = z.object({
  projectId: z.string().uuid(),
  granularity: z.enum(["rough", "detail"]),
});

export type StartExtractionResult =
  | { ok: true; runId: string }
  | { ok: false; error: string };

export async function startExtraction(
  projectId: string,
  granularity: Granularity,
): Promise<StartExtractionResult> {
  const parsed = startSchema.safeParse({ projectId, granularity });
  if (!parsed.success) {
    return { ok: false, error: "無効なパラメータです" };
  }

  await abandonStaleRuns(projectId, granularity);

  const alreadyRunning = await hasRunningExtractionRun(projectId, granularity);
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
    granularity,
    model,
    documentSnapshot,
  });

  try {
    await runExtractionJob({
      runId: run.id,
      projectId,
      granularity,
      documents: mdDocuments,
    });
  } catch {
    // error is already persisted in the run record
  }

  return { ok: true, runId: run.id };
}

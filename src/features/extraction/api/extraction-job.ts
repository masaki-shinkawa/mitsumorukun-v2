import { openai, getModel } from "@/lib/openai/client";
import { getObject } from "@/lib/storage/client";
import { parseMarkdownChunks, chunksToSummaryInput } from "@/lib/parsers/markdown";
import {
  ROUGH_SYSTEM_PROMPT,
  ROUGH_USER_TEMPLATE,
} from "@/lib/openai/prompts/extraction/rough";
import {
  DETAIL_SYSTEM_PROMPT,
  DETAIL_USER_TEMPLATE,
} from "@/lib/openai/prompts/extraction/detail";
import { llmOutputSchema } from "./schemas";
import {
  updateExtractionRunStatus,
  saveRequirements,
} from "./extraction-repository";
import type { Granularity } from "@/generated/prisma/enums";

type DocumentInput = {
  id: string;
  fileName: string;
  storageKey: string;
  uploadedAt: Date;
};

export type ExtractionJobInput = {
  runId: string;
  projectId: string;
  granularity: Granularity;
  documents: DocumentInput[];
  projectContext?: string;
};

export async function runExtractionJob(input: ExtractionJobInput): Promise<void> {
  const { runId, projectId, granularity, documents, projectContext = "" } = input;

  await updateExtractionRunStatus(runId, "running");

  try {
    // Step 1: fetch and parse all documents
    const allChunkTexts: string[] = [];

    for (const doc of documents) {
      const { body } = await getObject(doc.storageKey);
      const text = new TextDecoder().decode(body);
      const chunks = parseMarkdownChunks(text);
      const summaryInput = chunksToSummaryInput(
        chunks,
        doc.fileName,
        doc.uploadedAt.toISOString(),
      );
      allChunkTexts.push(summaryInput);
    }

    const documentsText = allChunkTexts.join("\n\n===FILE BOUNDARY===\n\n");

    // Step 2: LLM extraction
    const systemPrompt =
      granularity === "rough" ? ROUGH_SYSTEM_PROMPT : DETAIL_SYSTEM_PROMPT;
    const userPrompt =
      granularity === "rough"
        ? ROUGH_USER_TEMPLATE(documentsText, projectContext)
        : DETAIL_USER_TEMPLATE(documentsText, projectContext);

    const model = getModel("normal");

    const response = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const choice = response.choices[0];
    const rawContent = choice?.message?.content ?? "{}";
    const finishReason = choice?.finish_reason;
    const tokenUsage = {
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
    };

    if (finishReason === "length") {
      throw new Error(
        `token_limit_exceeded: LLM output was truncated (finish_reason=length). ` +
        `total_tokens=${tokenUsage.totalTokens}. ` +
        `ドキュメントが大きすぎます。分割してから再実行してください。`,
      );
    }

    // Step 3: parse and validate
    let parsed: ReturnType<typeof llmOutputSchema.parse>;
    try {
      parsed = llmOutputSchema.parse(JSON.parse(rawContent));
    } catch (zodErr) {
      const raw = rawContent.slice(0, 1000);
      const detail = zodErr instanceof Error ? zodErr.message : String(zodErr);
      throw new Error(
        `schema_validation_error: ${detail} --- Raw (first 1000 chars): ${raw}`,
      );
    }

    // Step 4: save requirements
    // inject documentId from fileName matching
    const docsByName = new Map(documents.map((d) => [d.fileName, d]));
    for (const req of parsed.requirements) {
      for (const ev of [...req.evidence, ...req.supersededEvidence]) {
        if (!ev.documentId) {
          const match = docsByName.get(ev.fileName);
          if (match) ev.documentId = match.id;
        }
      }
    }

    await saveRequirements(runId, projectId, granularity, parsed.requirements);

    await updateExtractionRunStatus(runId, "completed", {
      tokenUsage,
      finishedAt: new Date(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateExtractionRunStatus(runId, "failed", {
      errorMessage: message,
      finishedAt: new Date(),
    });
    throw err;
  }
}

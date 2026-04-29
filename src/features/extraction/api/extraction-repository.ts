import { prisma } from "@/lib/db/client";
import type { Granularity, ExtractionStatus } from "@/generated/prisma/enums";
import type { ExtractionRun, Requirement } from "@/generated/prisma/client";
import type { Evidence, RequirementOutput } from "./schemas";

export type { ExtractionRun, Requirement };

export async function createExtractionRun(input: {
  projectId: string;
  granularity: Granularity;
  model: string;
  documentSnapshot: object;
}): Promise<ExtractionRun> {
  return prisma.extractionRun.create({
    data: {
      projectId: input.projectId,
      granularity: input.granularity,
      model: input.model,
      documentSnapshot: input.documentSnapshot,
      status: "pending",
    },
  });
}

export async function updateExtractionRunStatus(
  id: string,
  status: ExtractionStatus,
  extra?: { errorMessage?: string; tokenUsage?: object; finishedAt?: Date },
): Promise<void> {
  await prisma.extractionRun.update({
    where: { id },
    data: {
      status,
      errorMessage: extra?.errorMessage,
      tokenUsage: extra?.tokenUsage ?? undefined,
      finishedAt: extra?.finishedAt,
    },
  });
}

export async function listExtractionRuns(projectId: string): Promise<ExtractionRun[]> {
  return prisma.extractionRun.findMany({
    where: { projectId },
    orderBy: { startedAt: "desc" },
  });
}

export async function getLatestExtractionRun(
  projectId: string,
  granularity: Granularity,
): Promise<ExtractionRun | null> {
  return prisma.extractionRun.findFirst({
    where: { projectId, granularity, status: "completed" },
    orderBy: { startedAt: "desc" },
  });
}

export async function hasRunningExtractionRun(
  projectId: string,
  granularity: Granularity,
): Promise<boolean> {
  const run = await prisma.extractionRun.findFirst({
    where: { projectId, granularity, status: "running" },
    select: { id: true },
  });
  return run !== null;
}

/** Abandon stale running jobs (started > timeoutMs ago) */
export async function abandonStaleRuns(
  projectId: string,
  granularity: Granularity,
  timeoutMs = 10 * 60 * 1000,
): Promise<void> {
  const cutoff = new Date(Date.now() - timeoutMs);
  await prisma.extractionRun.updateMany({
    where: {
      projectId,
      granularity,
      status: "running",
      startedAt: { lt: cutoff },
    },
    data: {
      status: "failed",
      errorMessage: "timeout/abandoned: job did not complete within the allowed time",
      finishedAt: new Date(),
    },
  });
}

type CategoryPrefixMap = Record<string, string>;
const CATEGORY_PREFIX: CategoryPrefixMap = {
  functional: "R",
  non_functional: "NF",
  constraint: "C",
  assumption: "A",
  out_of_scope: "OS",
};

export async function saveRequirements(
  runId: string,
  projectId: string,
  granularity: Granularity,
  items: RequirementOutput[],
): Promise<void> {
  // delete previous requirements for this project+granularity
  await prisma.requirement.deleteMany({
    where: {
      projectId,
      granularity,
    },
  });

  // assign codes per category
  const counters: Record<string, number> = {};
  function nextCode(category: string): string {
    const prefix = CATEGORY_PREFIX[category] ?? "X";
    counters[prefix] = (counters[prefix] ?? 0) + 1;
    return `${prefix}-${String(counters[prefix]).padStart(3, "0")}`;
  }

  // two-pass: first pass inserts top-level, second pass inserts children
  // build a title→id map after first pass
  const titleToId = new Map<string, string>();

  const topLevel = items.filter((r) => !r.parentTitle);
  const children = items.filter((r) => !!r.parentTitle);

  for (const req of topLevel) {
    const code = nextCode(req.category);
    const created = await prisma.requirement.create({
      data: {
        projectId,
        extractionRunId: runId,
        granularity,
        category: req.category,
        parentId: null,
        code,
        title: req.title,
        description: req.description,
        inputs: req.inputs ?? null,
        outputs: req.outputs ?? null,
        actors: req.actors,
        priority: req.priority,
        confidence: req.confidence,
        evidence: req.evidence as unknown as Evidence[],
        supersededEvidence: req.supersededEvidence as unknown as Evidence[],
        notes: req.notes ?? null,
      },
    });
    titleToId.set(req.title, created.id);
  }

  for (const req of children) {
    const parentId = req.parentTitle ? (titleToId.get(req.parentTitle) ?? null) : null;
    const code = nextCode(req.category);
    const created = await prisma.requirement.create({
      data: {
        projectId,
        extractionRunId: runId,
        granularity,
        category: req.category,
        parentId,
        code,
        title: req.title,
        description: req.description,
        inputs: req.inputs ?? null,
        outputs: req.outputs ?? null,
        actors: req.actors,
        priority: req.priority,
        confidence: req.confidence,
        evidence: req.evidence as unknown as Evidence[],
        supersededEvidence: req.supersededEvidence as unknown as Evidence[],
        notes: req.notes ?? null,
      },
    });
    titleToId.set(req.title, created.id);
  }
}

export async function getRequirements(
  projectId: string,
  granularity: Granularity,
): Promise<Requirement[]> {
  return prisma.requirement.findMany({
    where: { projectId, granularity },
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });
}

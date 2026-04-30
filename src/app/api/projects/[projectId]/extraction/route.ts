import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listExtractionRuns, getRequirements } from "@/features/extraction/api/extraction-repository";
import { startExtraction } from "@/features/extraction/api/extraction-service";
import type { Granularity } from "@/generated/prisma/enums";

const paramsSchema = z.object({ projectId: z.string().uuid() });
const granularitySchema = z.enum(["rough", "detail"]);

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { projectId } = paramsSchema.parse(await params);
  const granularity = granularitySchema.parse(
    req.nextUrl.searchParams.get("granularity") ?? "rough",
  );

  const [runs, requirements] = await Promise.all([
    listExtractionRuns(projectId),
    getRequirements(projectId, granularity as Granularity),
  ]);

  return NextResponse.json({ runs, requirements });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { projectId } = paramsSchema.parse(await params);
  const body = await req.json();
  const granularity = granularitySchema.parse(body.granularity);

  const result = await startExtraction(projectId, granularity as Granularity);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // return updated data after extraction completes
  const [runs, requirements] = await Promise.all([
    listExtractionRuns(projectId),
    getRequirements(projectId, granularity as Granularity),
  ]);

  return NextResponse.json({ runId: result.runId, runs, requirements });
}

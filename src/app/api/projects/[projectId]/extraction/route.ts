import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listExtractionRuns, getRequirements } from "@/features/extraction/api/extraction-repository";
import { startExtraction } from "@/features/extraction/api/extraction-service";

const paramsSchema = z.object({ projectId: z.string().uuid() });

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { projectId } = paramsSchema.parse(await params);

  const [runs, requirements] = await Promise.all([
    listExtractionRuns(projectId),
    getRequirements(projectId),
  ]);

  return NextResponse.json({ runs, requirements });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { projectId } = paramsSchema.parse(await params);
  await req.json();

  const result = await startExtraction(projectId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const [runs, requirements] = await Promise.all([
    listExtractionRuns(projectId),
    getRequirements(projectId),
  ]);

  return NextResponse.json({ runId: result.runId, runs, requirements });
}

-- CreateEnum
CREATE TYPE "Granularity" AS ENUM ('rough', 'detail');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "RequirementCategory" AS ENUM ('functional', 'non_functional', 'constraint', 'assumption', 'out_of_scope');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('must', 'should', 'nice_to_have', 'unknown');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('high', 'medium', 'low');

-- CreateTable
CREATE TABLE "ExtractionRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "granularity" "Granularity" NOT NULL,
    "status" "ExtractionStatus" NOT NULL DEFAULT 'pending',
    "model" TEXT NOT NULL,
    "documentSnapshot" JSONB NOT NULL,
    "tokenUsage" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ExtractionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "extractionRunId" TEXT NOT NULL,
    "granularity" "Granularity" NOT NULL,
    "category" "RequirementCategory" NOT NULL,
    "parentId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "inputs" TEXT,
    "outputs" TEXT,
    "actors" TEXT[],
    "priority" "Priority" NOT NULL DEFAULT 'unknown',
    "confidence" "Confidence" NOT NULL,
    "evidence" JSONB NOT NULL,
    "supersededEvidence" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExtractionRun_projectId_idx" ON "ExtractionRun"("projectId");

-- CreateIndex
CREATE INDEX "Requirement_projectId_idx" ON "Requirement"("projectId");

-- CreateIndex
CREATE INDEX "Requirement_extractionRunId_idx" ON "Requirement"("extractionRunId");

-- AddForeignKey
ALTER TABLE "ExtractionRun" ADD CONSTRAINT "ExtractionRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_extractionRunId_fkey" FOREIGN KEY ("extractionRunId") REFERENCES "ExtractionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Requirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

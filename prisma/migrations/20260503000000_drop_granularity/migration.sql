-- Drop granularity column from ExtractionRun and Requirement.
-- All existing rows have been migrated to 'detail' before this migration runs.

ALTER TABLE "ExtractionRun" DROP COLUMN "granularity";
ALTER TABLE "Requirement" DROP COLUMN "granularity";

DROP TYPE "Granularity";

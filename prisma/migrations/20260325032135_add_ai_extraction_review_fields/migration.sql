-- AlterTable
ALTER TABLE "uploads" ADD COLUMN     "aiAttemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aiErrorMessage" TEXT,
ADD COLUMN     "aiModel" TEXT,
ADD COLUMN     "aiStatus" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "clientType" TEXT,
ADD COLUMN     "reviewFlags" JSONB,
ADD COLUMN     "reviewStatus" TEXT,
ADD COLUMN     "structuredDraft" JSONB,
ADD COLUMN     "tourDuration" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "email" TEXT;

-- CreateTable
CREATE TABLE "canva_share_jobs" (
    "id" TEXT NOT NULL,
    "canvaArtifactId" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "editUrl" TEXT,
    "targetEmails" TEXT[] NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lockedUntil" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canva_share_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "canva_share_jobs_canvaArtifactId_designId_key" ON "canva_share_jobs"("canvaArtifactId", "designId");

-- CreateIndex
CREATE INDEX "canva_share_jobs_status_lockedUntil_idx" ON "canva_share_jobs"("status", "lockedUntil");

-- AddForeignKey
ALTER TABLE "canva_share_jobs" ADD CONSTRAINT "canva_share_jobs_canvaArtifactId_fkey" FOREIGN KEY ("canvaArtifactId") REFERENCES "canva_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

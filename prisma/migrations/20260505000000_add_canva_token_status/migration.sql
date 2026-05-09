ALTER TABLE "canva_tokens"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "lastRefreshAttemptAt" TIMESTAMP(3),
ADD COLUMN "lastRefreshError" TEXT,
ADD COLUMN "refreshLockedUntil" TIMESTAMP(3);

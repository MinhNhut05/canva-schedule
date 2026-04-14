-- CreateTable
CREATE TABLE "canva_tokens" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "cooldownUntil" TIMESTAMP(3),
    "scope" TEXT,
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canva_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canva_artifacts" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "templateId" TEXT,
    "jobId" TEXT,
    "designId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canva_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canva_templates" (
    "id" TEXT NOT NULL,
    "tourDuration" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "fieldMapping" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canva_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "canva_artifacts_uploadId_artifactType_key" ON "canva_artifacts"("uploadId", "artifactType");

-- CreateIndex
CREATE UNIQUE INDEX "canva_templates_tourDuration_artifactType_key" ON "canva_templates"("tourDuration", "artifactType");

-- AddForeignKey
ALTER TABLE "canva_artifacts" ADD CONSTRAINT "canva_artifacts_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

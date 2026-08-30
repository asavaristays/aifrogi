ALTER TABLE "BotProfile"
ADD COLUMN "installationKey" TEXT,
ADD COLUMN "installationDetectedAt" TIMESTAMP(3),
ADD COLUMN "liveAt" TIMESTAMP(3),
ADD COLUMN "pausedAt" TIMESTAMP(3),
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "lifecycleUpdatedBy" TEXT;

CREATE UNIQUE INDEX "BotProfile_installationKey_key" ON "BotProfile"("installationKey");

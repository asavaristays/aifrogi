ALTER TABLE "BotConnectorCredential"
  ADD COLUMN "keyVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "revokedBy" TEXT,
  ADD COLUMN "lastUsedAt" TIMESTAMP(3);

CREATE INDEX "BotConnectorCredential_expiresAt_revokedAt_idx"
  ON "BotConnectorCredential"("expiresAt", "revokedAt");

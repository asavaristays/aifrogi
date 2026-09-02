ALTER TABLE "Subscription"
  ADD COLUMN "messageLimitOverride" INTEGER,
  ADD COLUMN "aiReplyLimitOverride" INTEGER,
  ADD COLUMN "messageOveragePaisa" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "aiReplyOveragePaisa" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "overageApproved" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "SupportTicket"
ADD COLUMN "lastActivityBy" TEXT NOT NULL DEFAULT 'CUSTOMER',
ADD COLUMN "lastClientViewedAt" TIMESTAMP(3),
ADD COLUMN "lastAdminViewedAt" TIMESTAMP(3);

UPDATE "SupportTicket"
SET "lastClientViewedAt" = "createdAt",
    "lastActivityBy" = CASE
      WHEN "status" IN ('WAITING_FOR_CLIENT', 'RESOLVED') THEN 'ADMIN'
      ELSE 'CUSTOMER'
    END;

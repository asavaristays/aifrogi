ALTER TABLE "BotProfile"
ADD COLUMN "responseSlaMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN "reminderPercent" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "fallbackEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "safeFallbackMessage" TEXT;

UPDATE "BotProfile"
SET "safeFallbackMessage" = 'Thank you for waiting. Our team has your request and will respond as soon as possible. No booking, price, availability, or commercial commitment is confirmed by this message.'
WHERE "safeFallbackMessage" IS NULL;

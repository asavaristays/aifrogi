ALTER TABLE "OnboardingProfile"
  ADD COLUMN "googleMapsUrl" TEXT,
  ADD COLUMN "googleBusinessProfileUrl" TEXT,
  ADD COLUMN "instagramUrl" TEXT,
  ADD COLUMN "photoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Repairs legacy live tenants that predate the client onboarding lifecycle.
-- This migration touches only the three named existing tenants and does not
-- alter bot configuration, connectors, knowledge, subscriptions, or RLS.
BEGIN;

SELECT set_config('app.organization_id', '', true);
SELECT set_config('app.platform_authority', 'true', true);
SELECT set_config('app.security_actor', 'system:live-onboarding-migration', true);
SELECT set_config('app.system_purpose', 'repair-legacy-live-tenant-lifecycle', true);

WITH target AS (
  SELECT o.id, o.name, o.industry
  FROM "Organization" o
  JOIN "Property" p ON p."organizationId" = o.id
  JOIN "BotProfile" b ON b."organizationId" = o.id
  WHERE b.status = 'LIVE'
    AND p.slug IN ('asavaristays-703624', 'castle-mandawa-e40850', 'webtechnosys-ai-agency-e5da22')
)
UPDATE "Organization" o
SET status = 'ACTIVE', "updatedAt" = now()
FROM target t
WHERE o.id = t.id;

WITH target AS (
  SELECT o.id, o.name, o.industry
  FROM "Organization" o
  JOIN "Property" p ON p."organizationId" = o.id
  JOIN "BotProfile" b ON b."organizationId" = o.id
  WHERE b.status = 'LIVE'
    AND p.slug IN ('asavaristays-703624', 'castle-mandawa-e40850', 'webtechnosys-ai-agency-e5da22')
)
INSERT INTO "OnboardingProfile" (
  id, "organizationId", "currentStep", "progressPercent", "lifecycleStatus",
  "legalName", "businessCategory", "kycStatus", "completedAt", "updatedAt"
)
SELECT
  'migration-live-onboarding-' || t.id, t.id, 6, 100, 'LIVE',
  t.name, COALESCE(NULLIF(t.industry, ''), 'Business'), 'MIGRATED_LEGACY_LIVE', now(), now()
FROM target t
ON CONFLICT ("organizationId") DO UPDATE SET
  "currentStep" = 6,
  "progressPercent" = 100,
  "lifecycleStatus" = 'LIVE',
  "legalName" = COALESCE("OnboardingProfile"."legalName", EXCLUDED."legalName"),
  "businessCategory" = COALESCE("OnboardingProfile"."businessCategory", EXCLUDED."businessCategory"),
  "kycStatus" = CASE WHEN "OnboardingProfile"."kycStatus" = 'NOT_SUBMITTED' THEN 'MIGRATED_LEGACY_LIVE' ELSE "OnboardingProfile"."kycStatus" END,
  "completedAt" = COALESCE("OnboardingProfile"."completedAt", now()),
  "updatedAt" = now();

WITH target AS (
  SELECT o.id FROM "Organization" o
  JOIN "Property" p ON p."organizationId" = o.id
  WHERE p.slug IN ('asavaristays-703624', 'castle-mandawa-e40850', 'webtechnosys-ai-agency-e5da22')
)
INSERT INTO "OnboardingActivity" (id, "organizationId", "actorEmail", action, detail, "createdAt")
SELECT
  'migration-live-onboarding-' || t.id, t.id, 'system@aifrogi.com',
  'LIVE_TENANT_LIFECYCLE_MIGRATED',
  'Legacy live bot migrated to the completed client-workspace lifecycle.', now()
FROM target t
WHERE NOT EXISTS (
  SELECT 1 FROM "OnboardingActivity" a
  WHERE a.id = 'migration-live-onboarding-' || t.id
);

COMMIT;

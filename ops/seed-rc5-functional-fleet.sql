INSERT INTO "Property" (
  id, name, slug, city, state, timezone, "createdAt", "updatedAt",
  "organizationId", "websiteConsentEnforcedAt"
)
SELECT
  'rc5-functional-property-' || lpad(i::text, 4, '0'),
  'RC5 Functional Bot ' || lpad(i::text, 4, '0'),
  'rc5-load-bot-' || lpad(i::text, 4, '0'),
  source.city,
  source.state,
  source.timezone,
  now(),
  now(),
  source."organizationId",
  source."websiteConsentEnforcedAt"
FROM generate_series(1, 1000) AS i
CROSS JOIN LATERAL (
  SELECT * FROM "Property"
  WHERE slug = 'webtechnosys-fresh-ai-bot-03e89f'
) AS source
ON CONFLICT (slug) DO NOTHING;

UPDATE "Subscription"
SET "overageApproved" = true, "updatedAt" = now()
WHERE "organizationId" = (
  SELECT "organizationId" FROM "Property"
  WHERE slug = 'webtechnosys-fresh-ai-bot-03e89f'
);

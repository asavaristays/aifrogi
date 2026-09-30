\pset tuples_only on
\pset format unaligned
\pset fieldsep '|'
SELECT o.id,o.slug,o.status,p.id,p.slug,b.status,b.category
FROM "Organization" o
JOIN "Property" p ON p."organizationId"=o.id
JOIN "BotProfile" b ON b."organizationId"=o.id
WHERE o."ownerEmail"='info@webtechnosys.com' AND o.name='Webtechnosys Fresh AI Bot';
SELECT c.status,c."sourceUrl",c."sourceId",c."authorityScope",c."audienceCeiling",c."trialExpiresAt"
FROM "WebsiteSourceConsent" c
JOIN "Property" p ON p.id=c."propertyId"
JOIN "Organization" o ON o.id=p."organizationId"
WHERE o."ownerEmail"='info@webtechnosys.com' AND o.name='Webtechnosys Fresh AI Bot';
SELECT a.action,a.detail,a."createdAt"
FROM "OnboardingActivity" a
JOIN "Organization" o ON o.id=a."organizationId"
WHERE o."ownerEmail"='info@webtechnosys.com' AND o.name='Webtechnosys Fresh AI Bot'
ORDER BY a."createdAt" DESC LIMIT 8;

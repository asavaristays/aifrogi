UPDATE "BillingPlan"
SET "name" = '15-Day Trial', "trialDays" = 15, "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'TRIAL';

UPDATE "Subscription" AS subscription
SET
  "trialEndsAt" = organization."createdAt" + INTERVAL '15 days',
  "currentPeriodEnd" = organization."createdAt" + INTERVAL '15 days',
  "updatedAt" = CURRENT_TIMESTAMP
FROM "Organization" AS organization, "BillingPlan" AS plan
WHERE subscription."organizationId" = organization."id"
  AND subscription."planId" = plan."id"
  AND plan."code" = 'TRIAL'
  AND subscription."status" = 'TRIALING';

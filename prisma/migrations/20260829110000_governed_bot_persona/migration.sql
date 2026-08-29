ALTER TABLE "BotProfile"
ADD COLUMN "personaName" TEXT,
ADD COLUMN "businessObjective" TEXT,
ADD COLUMN "tone" TEXT NOT NULL DEFAULT 'Professional, clear and helpful',
ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY['English']::TEXT[],
ADD COLUMN "prohibitedClaims" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "escalationTriggers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "BotProfile" AS bot
SET
  "personaName" = CASE
    WHEN LOWER(org."name") = 'webtechnosys' THEN 'Webtechnosys team'
    WHEN bot."category" = 'STAY' THEN 'HotelGPT Assistant'
    WHEN bot."category" = 'PINGBOOK' THEN 'PingBook Assistant'
    WHEN bot."category" = 'RESTAURANT' THEN 'DineGPT Assistant'
    WHEN bot."category" = 'REAL_ESTATE' THEN 'PropertyGPT Assistant'
    WHEN bot."category" = 'FLOWCART' THEN 'FlowCart Assistant'
    ELSE 'Business Assistant'
  END,
  "businessObjective" = CASE
    WHEN bot."category" = 'PINGBOOK' THEN 'Answer approved service questions, identify valid appointment options, and create appointments only through approved verified workflows.'
    WHEN bot."category" = 'STAY' THEN 'Answer approved hotel questions, qualify stay enquiries, and escalate availability or commercial commitments unless a verified system connector is active.'
    ELSE 'Answer approved business questions, qualify genuine enquiries, and arrange human follow-up when required.'
  END,
  "prohibitedClaims" = ARRAY['Do not invent prices, availability, guarantees, certifications, or commercial commitments']::TEXT[],
  "escalationTriggers" = ARRAY['Complaint', 'Billing dispute', 'Legal question', 'Sensitive personal data', 'Low-confidence commercial answer']::TEXT[]
FROM "Organization" AS org
WHERE bot."organizationId" = org."id";

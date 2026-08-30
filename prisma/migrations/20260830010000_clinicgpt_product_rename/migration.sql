-- Public product rename only. The PINGBOOK enum and plan code remain stable
-- compatibility identifiers so existing tenants and subscriptions are not broken.
UPDATE "BotProfile"
SET "personaName" = 'ClinicGPT Assistant'
WHERE "category" = 'PINGBOOK'
  AND ("personaName" IS NULL OR "personaName" = 'PingBook Assistant');

ALTER TABLE "BotProfile"
  ALTER COLUMN "capabilities" SET DEFAULT ARRAY['ANSWER_QUESTIONS', 'CAPTURE_LEADS', 'QUALIFY_LEADS']::TEXT[];

UPDATE "BotProfile"
SET "capabilities" = array_append("capabilities", 'QUALIFY_LEADS')
WHERE "category" = 'BUSINESS_AI'
  AND NOT ('QUALIFY_LEADS' = ANY("capabilities"));

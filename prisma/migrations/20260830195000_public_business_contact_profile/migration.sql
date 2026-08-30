ALTER TABLE "Organization"
ADD COLUMN "publicPhone" TEXT,
ADD COLUMN "publicEmail" TEXT,
ADD COLUMN "publicAddress" TEXT,
ADD COLUMN "publicBusinessHours" TEXT;

UPDATE "Organization"
SET
  "publicPhone" = '+91-7410582898',
  "publicEmail" = 'info@webtechnosys.com',
  "publicAddress" = 'H.No 746-TF, New Wada, Morjim, Goa 403512, India'
WHERE lower("name") = 'webtechnosys';

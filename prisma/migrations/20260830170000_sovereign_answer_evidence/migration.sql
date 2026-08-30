CREATE TABLE "SovereignAnswerEvidence" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "leadId" TEXT,
    "sessionIdHash" TEXT NOT NULL,
    "constitutionVersion" TEXT NOT NULL,
    "blueprintVersion" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "disposition" TEXT NOT NULL,
    "contextUsed" BOOLEAN NOT NULL DEFAULT false,
    "decisionReason" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "resolvedQuestion" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "grounded" BOOLEAN NOT NULL DEFAULT false,
    "model" TEXT NOT NULL,
    "sources" JSONB NOT NULL,
    "knowledgeAsOf" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SovereignAnswerEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SovereignAnswerEvidence_propertyId_createdAt_idx" ON "SovereignAnswerEvidence"("propertyId", "createdAt");
CREATE INDEX "SovereignAnswerEvidence_propertyId_intent_disposition_idx" ON "SovereignAnswerEvidence"("propertyId", "intent", "disposition");
CREATE INDEX "SovereignAnswerEvidence_leadId_createdAt_idx" ON "SovereignAnswerEvidence"("leadId", "createdAt");
ALTER TABLE "SovereignAnswerEvidence" ADD CONSTRAINT "SovereignAnswerEvidence_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

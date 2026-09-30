\set ON_ERROR_STOP on
INSERT INTO "Organization"(id,name,slug,"ownerName","ownerEmail","updatedAt") VALUES
 ('p2b-org-a','P2B Org A','p2b-org-a','Owner A','owner-a@example.test',clock_timestamp()),
 ('p2b-org-b','P2B Org B','p2b-org-b','Owner B','owner-b@example.test',clock_timestamp());
INSERT INTO "Property"(id,"organizationId",name,slug,"updatedAt") VALUES
 ('p2b-property-a','p2b-org-a','P2B Property A','p2b-property-a',clock_timestamp()),
 ('p2b-property-b','p2b-org-b','P2B Property B','p2b-property-b',clock_timestamp());
INSERT INTO "Conversation"(id,"propertyId","updatedAt") VALUES
 ('p2b-conversation-a','p2b-property-a',clock_timestamp()),
 ('p2b-conversation-b','p2b-property-b',clock_timestamp());
INSERT INTO "KnowledgeRuntimePrincipalGrant"(id,"propertyId","principalId","databaseRole",purpose) VALUES
 ('p2b-grant-web-a','p2b-property-a','public-bot:p2b-property-a','aifrogi_web','PUBLIC_GUEST');

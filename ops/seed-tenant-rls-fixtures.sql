BEGIN;

INSERT INTO "Organization" (id,name,slug,industry,"ownerName","ownerEmail",status,"updatedAt") VALUES
  ('rls-org-a','RLS Tenant A','security-rls-tenant-a','Testing','Tenant A Owner','tenant-a@security.invalid','ACTIVE',now()),
  ('rls-org-b','RLS Tenant B','security-rls-tenant-b','Testing','Tenant B Owner','tenant-b@security.invalid','ACTIVE',now());

INSERT INTO "Property" (id,"organizationId",name,slug,"updatedAt") VALUES
  ('rls-property-a','rls-org-a','RLS Property A','security-rls-property-a',now()),
  ('rls-property-b','rls-org-b','RLS Property B','security-rls-property-b',now());

INSERT INTO "KnowledgeEntry" (id,"propertyId",question,answer,category,status,"createdBy","updatedAt") VALUES
  ('rls-knowledge-a','rls-property-a','Tenant A private test question','Tenant A private test answer','Security','PUBLISHED','security-fixture',now()),
  ('rls-knowledge-b','rls-property-b','Tenant B private test question','Tenant B private test answer','Security','PUBLISHED','security-fixture',now());

INSERT INTO "Lead" (id,"propertyId",name,initials,score,source,stage,intent,"stayLabel","partyLabel","budgetLabel",phone,"updatedAt") VALUES
  ('rls-lead-a','rls-property-a','Tenant A Guest','TA',50,'SECURITY_TEST','NEW','Isolation test','Test stay','1 guest','Test budget','+910000000001',now()),
  ('rls-lead-b','rls-property-b','Tenant B Guest','TB',50,'SECURITY_TEST','NEW','Isolation test','Test stay','1 guest','Test budget','+910000000002',now());

INSERT INTO "Conversation" (id,"propertyId",status,"updatedAt") VALUES
  ('rls-conversation-a','rls-property-a','OPEN',now()),
  ('rls-conversation-b','rls-property-b','OPEN',now());

INSERT INTO "Message" (id,"propertyId","conversationId","idempotencyKey",direction,body,"occurredAt","updatedAt") VALUES
  ('rls-message-a','rls-property-a','rls-conversation-a','rls-message-a','INBOUND','Tenant A confidential fixture',now(),now()),
  ('rls-message-b','rls-property-b','rls-conversation-b','rls-message-b','INBOUND','Tenant B confidential fixture',now(),now());

COMMIT;

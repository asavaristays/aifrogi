BEGIN;

CREATE SCHEMA IF NOT EXISTS aifrogi_security;
REVOKE ALL ON SCHEMA aifrogi_security FROM PUBLIC;

CREATE OR REPLACE FUNCTION aifrogi_security.current_organization_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.organization_id', true), '')
$$;

CREATE OR REPLACE FUNCTION aifrogi_security.has_platform_authority()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('app.platform_authority', true), '')::boolean, false)
$$;

REVOKE ALL ON FUNCTION aifrogi_security.current_organization_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION aifrogi_security.has_platform_authority() FROM PUBLIC;

DO $rls$
DECLARE
  table_name text;
  direct_organization_tables text[] := ARRAY[
    'DemoSandbox','UserSession','WhatsAppBotConfiguration','BotProfile','BotConnectorConfiguration',
    'OrganizationMember','OnboardingProfile','OnboardingCredential','OnboardingDocument','OnboardingActivity',
    'Subscription','BillingAddon','BillingInvoice','UsageRecord','AiCreditTransaction','SupportTicket'
  ];
  property_tables text[] := ARRAY[
    'KnowledgeDocument','KnowledgeEntry','KnowledgePreview','KnowledgeAnswerFlag','KnowledgeGap','Lead',
    'WebsiteVisitorSession','SovereignAnswerEvidence','SovereignAnswerFeedback','SovereignReplayCase',
    'ChannelConnection','Participant','Conversation','Message','AiOperation','MetricDaily','Campaign',
    'AutomationJob','Asset','WhatsAppIntegration','AppointmentTenant','CommerceTenant'
  ];
BEGIN
  EXECUTE 'ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE "Organization" FORCE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS aifrogi_tenant_isolation ON "Organization"';
  EXECUTE 'CREATE POLICY aifrogi_tenant_isolation ON "Organization" USING (aifrogi_security.has_platform_authority() OR id = aifrogi_security.current_organization_id()) WITH CHECK (aifrogi_security.has_platform_authority() OR id = aifrogi_security.current_organization_id())';

  EXECUTE 'ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE "Property" FORCE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS aifrogi_tenant_isolation ON "Property"';
  EXECUTE 'CREATE POLICY aifrogi_tenant_isolation ON "Property" USING (aifrogi_security.has_platform_authority() OR "organizationId" = aifrogi_security.current_organization_id()) WITH CHECK (aifrogi_security.has_platform_authority() OR "organizationId" = aifrogi_security.current_organization_id())';

  FOREACH table_name IN ARRAY direct_organization_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS aifrogi_tenant_isolation ON %I', table_name);
    EXECUTE format('CREATE POLICY aifrogi_tenant_isolation ON %I USING (aifrogi_security.has_platform_authority() OR "organizationId" = aifrogi_security.current_organization_id()) WITH CHECK (aifrogi_security.has_platform_authority() OR "organizationId" = aifrogi_security.current_organization_id())', table_name);
  END LOOP;

  FOREACH table_name IN ARRAY property_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS aifrogi_tenant_isolation ON %I', table_name);
    EXECUTE format('CREATE POLICY aifrogi_tenant_isolation ON %I USING (aifrogi_security.has_platform_authority() OR EXISTS (SELECT 1 FROM "Property" p WHERE p.id = %I."propertyId" AND p."organizationId" = aifrogi_security.current_organization_id())) WITH CHECK (aifrogi_security.has_platform_authority() OR EXISTS (SELECT 1 FROM "Property" p WHERE p.id = %I."propertyId" AND p."organizationId" = aifrogi_security.current_organization_id()))', table_name, table_name, table_name);
  END LOOP;

  FOREACH table_name IN ARRAY ARRAY['PlatformIncident','PlatformAuditLog'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS aifrogi_tenant_isolation ON %I', table_name);
    EXECUTE format('CREATE POLICY aifrogi_tenant_isolation ON %I USING (aifrogi_security.has_platform_authority() OR "organizationId" = aifrogi_security.current_organization_id()) WITH CHECK (aifrogi_security.has_platform_authority() OR "organizationId" = aifrogi_security.current_organization_id())', table_name);
  END LOOP;
END
$rls$;

-- Indirect ownership paths are intentionally explicit and auditable.
DO $indirect$
DECLARE policy_spec record;
BEGIN
  FOR policy_spec IN SELECT * FROM (VALUES
    ('BotConnectorCredential','EXISTS (SELECT 1 FROM "BotConnectorConfiguration" c WHERE c.id = "BotConnectorCredential"."connectorId" AND c."organizationId" = aifrogi_security.current_organization_id())'),
    ('DemoConnectorEvent','EXISTS (SELECT 1 FROM "DemoSandbox" s WHERE s.id = "DemoConnectorEvent"."sandboxId" AND s."organizationId" = aifrogi_security.current_organization_id())'),
    ('LeadTag','EXISTS (SELECT 1 FROM "Lead" l JOIN "Property" p ON p.id=l."propertyId" WHERE l.id="LeadTag"."leadId" AND p."organizationId"=aifrogi_security.current_organization_id())'),
    ('LeadMessage','EXISTS (SELECT 1 FROM "Lead" l JOIN "Property" p ON p.id=l."propertyId" WHERE l.id="LeadMessage"."leadId" AND p."organizationId"=aifrogi_security.current_organization_id())'),
    ('ConversationParticipant','EXISTS (SELECT 1 FROM "Conversation" c JOIN "Property" p ON p.id=c."propertyId" WHERE c.id="ConversationParticipant"."conversationId" AND p."organizationId"=aifrogi_security.current_organization_id())'),
    ('CampaignRecipient','EXISTS (SELECT 1 FROM "Campaign" c JOIN "Property" p ON p.id=c."propertyId" WHERE c.id="CampaignRecipient"."campaignId" AND p."organizationId"=aifrogi_security.current_organization_id())'),
    ('SupportTicketMessage','EXISTS (SELECT 1 FROM "SupportTicket" t WHERE t.id="SupportTicketMessage"."ticketId" AND t."organizationId"=aifrogi_security.current_organization_id())'),
    ('LeadAssetShare','EXISTS (SELECT 1 FROM "Lead" l JOIN "Property" p ON p.id=l."propertyId" WHERE l.id="LeadAssetShare"."leadId" AND p."organizationId"=aifrogi_security.current_organization_id())')
  ) AS specs(table_name, predicate)
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', policy_spec.table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', policy_spec.table_name);
    EXECUTE format('DROP POLICY IF EXISTS aifrogi_tenant_isolation ON %I', policy_spec.table_name);
    EXECUTE format('CREATE POLICY aifrogi_tenant_isolation ON %I USING (aifrogi_security.has_platform_authority() OR %s) WITH CHECK (aifrogi_security.has_platform_authority() OR %s)', policy_spec.table_name, policy_spec.predicate, policy_spec.predicate);
  END LOOP;
END
$indirect$;

DO $verticals$
DECLARE policy_spec record;
BEGIN
  FOR policy_spec IN SELECT * FROM (VALUES
    ('AppointmentService'),('AppointmentBooking'),('AppointmentSession'),('AppointmentMessageLog'),
    ('AppointmentPayment'),('AppointmentJob'),('AppointmentSheetSyncState')
  ) AS specs(table_name)
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', policy_spec.table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', policy_spec.table_name);
    EXECUTE format('DROP POLICY IF EXISTS aifrogi_tenant_isolation ON %I', policy_spec.table_name);
    EXECUTE format('CREATE POLICY aifrogi_tenant_isolation ON %I USING (aifrogi_security.has_platform_authority() OR EXISTS (SELECT 1 FROM "AppointmentTenant" t JOIN "Property" p ON p.id=t."propertyId" WHERE t.id=%I."tenantId" AND p."organizationId"=aifrogi_security.current_organization_id())) WITH CHECK (aifrogi_security.has_platform_authority() OR EXISTS (SELECT 1 FROM "AppointmentTenant" t JOIN "Property" p ON p.id=t."propertyId" WHERE t.id=%I."tenantId" AND p."organizationId"=aifrogi_security.current_organization_id()))', policy_spec.table_name, policy_spec.table_name, policy_spec.table_name);
  END LOOP;

  FOR policy_spec IN SELECT * FROM (VALUES
    ('CommerceProduct'),('CommerceAddon'),('CommerceCustomer'),('CommerceOrder'),('CommercePayment'),
    ('CommerceFlowSession'),('CommerceConversation')
  ) AS specs(table_name)
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', policy_spec.table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', policy_spec.table_name);
    EXECUTE format('DROP POLICY IF EXISTS aifrogi_tenant_isolation ON %I', policy_spec.table_name);
    EXECUTE format('CREATE POLICY aifrogi_tenant_isolation ON %I USING (aifrogi_security.has_platform_authority() OR EXISTS (SELECT 1 FROM "CommerceTenant" t JOIN "Property" p ON p.id=t."propertyId" WHERE t.id=%I."tenantId" AND p."organizationId"=aifrogi_security.current_organization_id())) WITH CHECK (aifrogi_security.has_platform_authority() OR EXISTS (SELECT 1 FROM "CommerceTenant" t JOIN "Property" p ON p.id=t."propertyId" WHERE t.id=%I."tenantId" AND p."organizationId"=aifrogi_security.current_organization_id()))', policy_spec.table_name, policy_spec.table_name, policy_spec.table_name);
  END LOOP;

  FOR policy_spec IN SELECT * FROM (VALUES
    ('CommerceProductVariant','EXISTS (SELECT 1 FROM "CommerceProduct" x JOIN "CommerceTenant" t ON t.id=x."tenantId" JOIN "Property" p ON p.id=t."propertyId" WHERE x.id="CommerceProductVariant"."productId" AND p."organizationId"=aifrogi_security.current_organization_id())'),
    ('CommerceOrderItem','EXISTS (SELECT 1 FROM "CommerceOrder" x JOIN "CommerceTenant" t ON t.id=x."tenantId" JOIN "Property" p ON p.id=t."propertyId" WHERE x.id="CommerceOrderItem"."orderId" AND p."organizationId"=aifrogi_security.current_organization_id())')
  ) AS specs(table_name, predicate)
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', policy_spec.table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', policy_spec.table_name);
    EXECUTE format('DROP POLICY IF EXISTS aifrogi_tenant_isolation ON %I', policy_spec.table_name);
    EXECUTE format('CREATE POLICY aifrogi_tenant_isolation ON %I USING (aifrogi_security.has_platform_authority() OR %s) WITH CHECK (aifrogi_security.has_platform_authority() OR %s)', policy_spec.table_name, policy_spec.predicate, policy_spec.predicate);
  END LOOP;
END
$verticals$;

COMMIT;

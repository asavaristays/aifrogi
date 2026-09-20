import { Client } from "pg";

const required = [
  "Organization","Property","KnowledgeDocument","KnowledgeEntry","Lead","Conversation","Message",
  "BotProfile","BotConnectorConfiguration","BotConnectorCredential","AgentGatewayClient","OrganizationMember","Subscription",
  "BillingInvoice","UsageRecord","SupportTicket","AppointmentTenant","CommerceTenant"
  ,"AppointmentBooking","AppointmentPayment","CommerceOrder","CommercePayment","CommerceOrderItem",
  "ReadinessScan","ReadinessEvidence","ReadinessIssue","ReadinessWorkItem","ReadinessVerification"
];
const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
await client.connect();
try {
  const result = await client.query(`
    SELECT c.relname AS table_name, c.relrowsecurity AS enabled, c.relforcerowsecurity AS forced,
      EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid AND p.polname='aifrogi_tenant_isolation') AS policy
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname = ANY($1::text[])
  `, [required]);
  const found = new Map(result.rows.map(row => [row.table_name, row]));
  const failures = required.filter(name => !found.get(name)?.enabled || !found.get(name)?.forced || !found.get(name)?.policy);
  if (failures.length) throw new Error(`RLS coverage missing: ${failures.join(", ")}`);
  console.log(JSON.stringify({ ok: true, checked: required.length }));
} finally {
  await client.end();
}

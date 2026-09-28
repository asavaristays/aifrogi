#!/usr/bin/env node
// Read-only launch inventory. Outputs configuration and aggregate counts only.
import { execFileSync } from 'node:child_process';
import pg from 'pg';

const apps = JSON.parse(execFileSync('pm2', ['jlist'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
const app = apps.find(item => item.name === 'lead-os-ai' && item.pm2_env?.status === 'online');
if (!app?.pm2_env?.DATABASE_URL) throw new Error('Online Core database configuration unavailable');
const db = new pg.Client({ connectionString: app.pm2_env.DATABASE_URL, connectionTimeoutMillis: 5000 });
await db.connect();
try {
  await db.query('BEGIN READ ONLY');
  await db.query("SELECT set_config('app.organization_id', '', true), set_config('app.platform_authority', 'true', true), set_config('app.security_actor', 'commercial-launch-audit', true), set_config('app.system_purpose', 'first-ten-commercial-inventory', true)");
  const tenants = await db.query(`SELECT o.slug, b.status, b.category,
    b."humanHandoffEnabled", b."responseSlaMinutes", b."installationDetectedAt", b."liveAt",
    s.status AS "subscriptionStatus", bp.code AS "planCode", s."paymentProvider",
    s."trialEndsAt", s."currentPeriodEnd", s."complimentaryEndsAt", s."graceEndsAt",
    (SELECT count(*)::int FROM "OrganizationMember" m WHERE m."organizationId"=o.id AND m.status='ACTIVE') AS "activeMembers",
    (SELECT count(*)::int FROM "KnowledgeEntry" k JOIN "Property" p ON p.id=k."propertyId" WHERE p."organizationId"=o.id AND k.status='PUBLISHED' AND k."validationStatus"='VALID' AND (k."expiresAt" IS NULL OR k."expiresAt">now())) AS "validPublishedEntries",
    (SELECT count(*)::int FROM "BillingInvoice" i WHERE i."organizationId"=o.id AND i.status='PAID') AS "paidInvoices",
    (SELECT count(*)::int FROM "AutomationJob" j JOIN "Property" p ON p.id=j."propertyId" WHERE p."organizationId"=o.id AND j.status='DEAD') AS "deadJobs"
    FROM "Organization" o JOIN "BotProfile" b ON b."organizationId"=o.id
    LEFT JOIN "Subscription" s ON s."organizationId"=o.id LEFT JOIN "BillingPlan" bp ON bp.id=s."planId"
    WHERE o."isDemo"=false ORDER BY o.slug`);
  const incidents = await db.query(`SELECT severity, status, count(*)::int AS count FROM "PlatformIncident" WHERE status NOT IN ('RESOLVED','CLOSED') GROUP BY severity,status`);
  await db.query('COMMIT');
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), release: app.pm2_env.AIFROGI_RELEASE || null, tenants: tenants.rows, incidents: incidents.rows }, null, 2));
} finally { await db.end(); }

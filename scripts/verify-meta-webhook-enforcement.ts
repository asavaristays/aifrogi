const baseUrl = (process.env.AIFROGI_MONITOR_URL || process.env.NEXT_PUBLIC_MARKETING_URL || "https://aifrogi.com")
  .replace(/\/+$/, "");

type ReadyResponse = {
  status?: string;
  release?: string;
  checks?: {
    database?: string;
    sessionSecret?: string;
    publicUrl?: string;
    metaWebhookSignature?: string;
    legacyInboundToken?: string;
  };
};

async function readReady() {
  const response = await fetch(`${baseUrl}/api/health/ready`, { cache: "no-store" });
  const body = await response.text();
  let data: ReadyResponse = {};
  try {
    data = JSON.parse(body) as ReadyResponse;
  } catch {
    throw new Error(`Readiness endpoint did not return JSON. status=${response.status} body=${body.slice(0, 240)}`);
  }

  return { response, data };
}

async function postUnsignedWebhook() {
  const response = await fetch(`${baseUrl}/api/integrations/whatsapp/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ object: "whatsapp_business_account", entry: [] })
  });
  const body = await response.text();
  return { response, body };
}

async function main() {
  console.log(`Checking Meta webhook enforcement at ${baseUrl}`);

  const ready = await readReady();
  const checks = ready.data.checks || {};
  console.log(`release: ${ready.data.release || "unknown"}`);
  console.log(`readiness status: ${ready.response.status} / ${ready.data.status || "unknown"}`);
  console.log(`database: ${checks.database || "unknown"}`);
  console.log(`sessionSecret: ${checks.sessionSecret || "unknown"}`);
  console.log(`publicUrl: ${checks.publicUrl || "unknown"}`);
  console.log(`legacyInboundToken: ${checks.legacyInboundToken || "unknown"}`);
  console.log(`metaWebhookSignature: ${checks.metaWebhookSignature || "unknown"}`);

  const unsigned = await postUnsignedWebhook();
  console.log(`unsigned webhook rejection: ${unsigned.response.status}`);

  if (checks.metaWebhookSignature === "ok") {
    if (unsigned.response.status !== 403) {
      throw new Error("Expected unsigned webhook to return 403 after META_APP_SECRET is configured.");
    }
    console.log("PASS: Meta app secret is configured and unsigned webhooks are rejected.");
    return;
  }

  if (checks.metaWebhookSignature === "not_enforced") {
    if (unsigned.response.status !== 503) {
      throw new Error("Expected unsigned webhook to return 503 while META_APP_SECRET is missing.");
    }
    console.log("PENDING: System is fail-closed. Add META_APP_SECRET, restart PM2, then rerun this verifier.");
    return;
  }

  throw new Error("Meta webhook signature readiness is unknown. Review /api/health/ready output.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});


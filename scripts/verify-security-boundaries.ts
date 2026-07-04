type HttpMethod = "GET" | "POST" | "PATCH";

type Session = {
  label: string;
  cookie: string;
};

type TestResult = {
  name: string;
  expected: string;
  actual: string;
  ok: boolean;
};

const baseUrl = (process.env.AIFROGI_SECURITY_TEST_BASE_URL || process.env.AIFROGI_MONITOR_URL || "https://aifrogi.com")
  .replace(/\/+$/, "");

const config = {
  adminAUser: process.env.AIFROGI_TEST_WORKSPACE_A_ADMIN_USER || "",
  adminAPassword: process.env.AIFROGI_TEST_WORKSPACE_A_ADMIN_PASSWORD || "",
  limitedAUser: process.env.AIFROGI_TEST_WORKSPACE_A_LIMITED_USER ||
    process.env.AIFROGI_TEST_WORKSPACE_A_AGENT_USER ||
    process.env.AIFROGI_TEST_WORKSPACE_A_VIEWER_USER ||
    "",
  limitedAPassword: process.env.AIFROGI_TEST_WORKSPACE_A_LIMITED_PASSWORD ||
    process.env.AIFROGI_TEST_WORKSPACE_A_AGENT_PASSWORD ||
    process.env.AIFROGI_TEST_WORKSPACE_A_VIEWER_PASSWORD ||
    "",
  foreignPropertySlug: process.env.AIFROGI_TEST_WORKSPACE_B_SLUG || ""
};

function requiredConfigMissing() {
  return [
    ["AIFROGI_TEST_WORKSPACE_A_ADMIN_USER", config.adminAUser],
    ["AIFROGI_TEST_WORKSPACE_A_ADMIN_PASSWORD", config.adminAPassword],
    ["AIFROGI_TEST_WORKSPACE_A_LIMITED_USER", config.limitedAUser],
    ["AIFROGI_TEST_WORKSPACE_A_LIMITED_PASSWORD", config.limitedAPassword],
    ["AIFROGI_TEST_WORKSPACE_B_SLUG", config.foreignPropertySlug]
  ].filter(([, value]) => !value);
}

function cookieHeader(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = headers.getSetCookie?.() || (response.headers.get("set-cookie") ? [response.headers.get("set-cookie") as string] : []);
  return setCookies
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function request(path: string, input?: {
  method?: HttpMethod;
  session?: Session;
  body?: unknown;
}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: input?.method || "GET",
    headers: {
      ...(input?.body ? { "content-type": "application/json" } : {}),
      ...(input?.session ? { cookie: input.session.cookie } : {})
    },
    body: input?.body ? JSON.stringify(input.body) : undefined,
    cache: "no-store",
    redirect: "manual"
  });
  const text = await response.text();
  return { response, text };
}

async function login(label: string, username: string, password: string): Promise<Session> {
  const { response, text } = await request("/api/auth/login", {
    method: "POST",
    body: { username, password }
  });

  const cookie = cookieHeader(response);
  if (!response.ok || !cookie) {
    throw new Error(`Could not sign in ${label}. status=${response.status} body=${text.slice(0, 160)}`);
  }

  return { label, cookie };
}

async function expectStatus(name: string, expected: string, statuses: number[], path: string, input?: {
  method?: HttpMethod;
  session?: Session;
  body?: unknown;
}): Promise<TestResult> {
  const { response, text } = await request(path, input);
  const ok = statuses.includes(response.status);
  return {
    name,
    expected,
    actual: `HTTP ${response.status}${ok ? "" : ` body=${text.slice(0, 220)}`}`,
    ok
  };
}

function printResult(result: TestResult) {
  const label = result.ok ? "PASS" : "FAIL";
  console.log(`${label}: ${result.name}`);
  console.log(`      expected: ${result.expected}`);
  console.log(`      actual:   ${result.actual}`);
}

async function main() {
  console.log("AiFrogi security-boundary verifier");
  console.log(`Target: ${baseUrl}`);
  console.log("Important: PASS means the attack attempt was correctly refused. This proves the covered checks, not every possible endpoint.");
  console.log("");

  const publicChecks = [
    await expectStatus(
      "Unauthenticated integration read is blocked",
      "401 Unauthorized",
      [401],
      "/api/integrations/whatsapp"
    ),
    await expectStatus(
      "Unauthenticated template send is blocked before any WhatsApp send",
      "401 Unauthorized",
      [401],
      "/api/integrations/whatsapp/template-message",
      {
        method: "POST",
        body: { to: "+919999999999", templateName: "security_probe", propertySlug: "security-probe" }
      }
    )
  ];

  for (const result of publicChecks) printResult(result);

  const missing = requiredConfigMissing();
  if (missing.length) {
    console.log("");
    console.log("CONFIG REQUIRED: deeper tenant/role tests were not run because test credentials are missing.");
    console.log("Set these environment variables for a staging run:");
    for (const [key] of missing) console.log(`  - ${key}`);
    console.log("");
    console.log("Use a Workspace A admin, a Workspace A non-admin user, and a Workspace B property slug.");
    process.exit(publicChecks.every((result) => result.ok) ? 2 : 1);
  }

  const [adminA, limitedA] = await Promise.all([
    login("Workspace A admin", config.adminAUser, config.adminAPassword),
    login("Workspace A limited user", config.limitedAUser, config.limitedAPassword)
  ]);

  const boundaryChecks: TestResult[] = [];

  boundaryChecks.push(await expectStatus(
    "Workspace A admin cannot use Workspace B propertySlug in template endpoint",
    "403 Forbidden before send/config access",
    [403],
    "/api/integrations/whatsapp/template-message",
    {
      method: "POST",
      session: adminA,
      body: {
        to: "+919999999999",
        templateName: "security_probe",
        languageCode: "en_US",
        propertySlug: config.foreignPropertySlug
      }
    }
  ));

  boundaryChecks.push(await expectStatus(
    "Workspace A admin cannot query Workspace B knowledge context by propertySlug",
    "403 Forbidden",
    [403],
    "/api/integrations/whatsapp/kb/answer",
    {
      method: "POST",
      session: adminA,
      body: {
        question: "security boundary probe",
        propertySlug: config.foreignPropertySlug
      }
    }
  ));

  boundaryChecks.push(await expectStatus(
    "Limited user cannot run bulk campaign API directly",
    "403 Forbidden before campaign/send work",
    [403],
    "/api/integrations/whatsapp/bulk-message",
    {
      method: "POST",
      session: limitedA,
      body: {
        mode: "text",
        message: "security boundary probe",
        recipients: ["+919999999999"],
        testMode: true
      }
    }
  ));

  boundaryChecks.push(await expectStatus(
    "Limited user cannot save WhatsApp integration settings",
    "403 Forbidden before config mutation",
    [403],
    "/api/integrations/whatsapp",
    {
      method: "POST",
      session: limitedA,
      body: {}
    }
  ));

  boundaryChecks.push(await expectStatus(
    "Limited user cannot run WhatsApp integration test send",
    "403 Forbidden before send",
    [403],
    "/api/integrations/whatsapp/test",
    {
      method: "POST",
      session: limitedA,
      body: { to: "+919999999999", message: "security boundary probe" }
    }
  ));

  boundaryChecks.push(await expectStatus(
    "Limited user cannot validate WhatsApp integration",
    "403 Forbidden",
    [403],
    "/api/integrations/whatsapp/validate",
    {
      method: "POST",
      session: limitedA
    }
  ));

  boundaryChecks.push(await expectStatus(
    "Limited user cannot refresh knowledge crawl",
    "403 Forbidden",
    [403],
    "/api/integrations/whatsapp/kb/refresh",
    {
      method: "POST",
      session: limitedA
    }
  ));

  for (const result of boundaryChecks) printResult(result);

  const all = [...publicChecks, ...boundaryChecks];
  const failures = all.filter((result) => !result.ok);
  console.log("");
  if (failures.length) {
    console.error(`FAIL: ${failures.length} covered security boundary check(s) failed.`);
    process.exit(1);
  }

  console.log("PASS: Covered unauthenticated, cross-workspace propertySlug, and role-gated API boundary checks were correctly refused.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

export {};

import { spawnSync } from "child_process";
import { randomBytes } from "crypto";
import { existsSync, readFileSync } from "fs";

const CONFIRM_VALUE = "create-temporary-security-fixtures";
const baseUrl = (process.env.AIFROGI_SECURITY_TEST_BASE_URL || process.env.AIFROGI_MONITOR_URL || "https://aifrogi.com")
  .replace(/\/+$/, "");
const confirmed = process.env.AIFROGI_SECURITY_FIXTURE_CONFIRM === CONFIRM_VALUE;

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    const value = rawValue
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1");
    process.env[key] = value;
  }
}

async function getDbClient() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");
  const { getDb } = await import("@/lib/db");
  return getDb();
}

async function hashPassword(value: string) {
  const { hashCredentialPassword } = await import("@/lib/credential-store");
  return hashCredentialPassword(value);
}

function suffix() {
  return randomBytes(5).toString("hex");
}

function password() {
  return `S3curity-${randomBytes(12).toString("base64url")}!`;
}

async function cleanup(slugs: string[]) {
  const db = await getDbClient();
  if (!db) return;
  await db.organization.deleteMany({
    where: {
      slug: { in: slugs }
    }
  });
}

async function createFixture() {
  const db = await getDbClient();
  if (!db) throw new Error("Database unavailable. Run this on the environment that owns the target app database.");

  const id = suffix();
  const orgASlug = `security-verify-a-${id}`;
  const orgBSlug = `security-verify-b-${id}`;
  const userAEmail = `security.verify.user.${id}@example.invalid`;
  const limitedAEmail = `security.verify.limited.${id}@example.invalid`;
  const userAPassword = password();
  const limitedAPassword = password();

  await cleanup([orgASlug, orgBSlug]);

  await db.organization.create({
    data: {
      name: `Security Verify A ${id}`,
      slug: orgASlug,
      industry: "Security Verification",
      website: "https://aifrogi.com",
      country: "India",
      timezone: "Asia/Kolkata",
      ownerName: "Security Verifier",
      ownerEmail: userAEmail,
      status: "ONBOARDING",
      members: {
        create: [
          {
            email: userAEmail,
            name: "Security Workspace User",
            role: "AGENT",
            status: "ACTIVE",
            passwordHash: await hashPassword(userAPassword),
            joinedAt: new Date()
          },
          {
            email: limitedAEmail,
            name: "Security Limited User",
            role: "VIEWER",
            status: "ACTIVE",
            passwordHash: await hashPassword(limitedAPassword),
            joinedAt: new Date()
          }
        ]
      },
      properties: {
        create: {
          name: `Security Verify A ${id}`,
          slug: orgASlug,
          timezone: "Asia/Kolkata"
        }
      },
      onboarding: {
        create: {
          currentStep: 1,
          progressPercent: 10,
          lifecycleStatus: "SECURITY_TEST"
        }
      }
    }
  });

  await db.organization.create({
    data: {
      name: `Security Verify B ${id}`,
      slug: orgBSlug,
      industry: "Security Verification",
      website: "https://aifrogi.com",
      country: "India",
      timezone: "Asia/Kolkata",
      ownerName: "Security Verifier B",
      ownerEmail: `security.verify.owner.b.${id}@example.invalid`,
      status: "ONBOARDING",
      members: {
        create: {
          email: `security.verify.owner.b.${id}@example.invalid`,
          name: "Security Workspace B Owner",
          role: "OWNER",
          status: "ACTIVE",
          passwordHash: await hashPassword(password()),
          joinedAt: new Date()
        }
      },
      properties: {
        create: {
          name: `Security Verify B ${id}`,
          slug: orgBSlug,
          timezone: "Asia/Kolkata"
        }
      },
      onboarding: {
        create: {
          currentStep: 1,
          progressPercent: 10,
          lifecycleStatus: "SECURITY_TEST"
        }
      }
    }
  });

  return {
    slugs: [orgASlug, orgBSlug],
    env: {
      AIFROGI_SECURITY_TEST_BASE_URL: baseUrl,
      AIFROGI_TEST_WORKSPACE_A_USER: userAEmail,
      AIFROGI_TEST_WORKSPACE_A_PASSWORD: userAPassword,
      AIFROGI_TEST_WORKSPACE_A_LIMITED_USER: limitedAEmail,
      AIFROGI_TEST_WORKSPACE_A_LIMITED_PASSWORD: limitedAPassword,
      AIFROGI_TEST_WORKSPACE_B_SLUG: orgBSlug
    }
  };
}

async function main() {
  console.log("AiFrogi temporary-fixture security verifier");
  console.log(`Target: ${baseUrl}`);
  console.log("This script creates temporary SECURITY_TEST workspaces, runs the deep verifier, and deletes the fixtures.");

  if (process.env.AIFROGI_SECURITY_FIXTURE_COUNT_ONLY === "true") {
    const db = await getDbClient();
    if (!db) throw new Error("Database unavailable.");
    const count = await db.organization.count({ where: { slug: { startsWith: "security-verify-" } } });
    console.log(`remaining security fixtures: ${count}`);
    process.exit(count === 0 ? 0 : 1);
  }

  if (!confirmed) {
    console.error(`Refusing to create fixtures without AIFROGI_SECURITY_FIXTURE_CONFIRM=${CONFIRM_VALUE}`);
    process.exit(2);
  }

  const fixture = await createFixture();
  try {
    console.log(`Created temporary workspaces: ${fixture.slugs.join(", ")}`);
    const result = spawnSync("npm", ["run", "verify:security-boundaries"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...fixture.env
      },
      stdio: "inherit"
    });

    if (result.status !== 0) {
      throw new Error(`Deep security-boundary verifier failed with status ${result.status ?? "unknown"}.`);
    }

    console.log("PASS: Deep security-boundary verifier passed with temporary fixtures.");
  } finally {
    await cleanup(fixture.slugs);
    console.log("Temporary security fixtures cleaned up.");
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

export {};

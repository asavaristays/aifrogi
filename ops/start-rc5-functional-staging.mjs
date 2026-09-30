import { execFileSync, spawnSync } from "node:child_process";

const processName = "aifrogi-rc5-functional";
const cwd = "/root/aifrogi-p2b-v6-20260930-rc5/source-final";
const applications = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8" }));
const production = applications.find((application) => application.name === "lead-os-ai");
if (!production?.pm2_env?.DATABASE_URL || !production.pm2_env.OPENAI_API_KEY) {
  throw new Error("Production runtime environment is unavailable.");
}

const databaseUrl = new URL(production.pm2_env.DATABASE_URL);
databaseUrl.pathname = "/aifrogi_rc5_functional";
const allowedSecrets = [
  "OPENAI_API_KEY",
  "SESSION_SECRET",
  "AUTH_SECRET",
  "AUTH_SESSION_SECRET",
  "WEBSITE_VISITOR_SESSION_SECRET",
  "WEBSITE_VISITOR_TOKEN_SECRET",
  "FIELD_ENCRYPTION_KEY",
  "FIELD_ENCRYPTION_KEYS",
  "FIELD_ENCRYPTION_ACTIVE_KEY_ID"
];
const secrets = Object.fromEntries(allowedSecrets.flatMap((key) => {
  const value = production.pm2_env[key];
  return typeof value === "string" && value ? [[key, value]] : [];
}));
const env = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  NODE_ENV: "production",
  ...secrets,
  DATABASE_URL: databaseUrl.toString(),
  NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3021",
  OPENAI_MODEL: "gpt-4.1-mini",
  OPENAI_SERVICE_TIER: "default",
  AIFROGI_DATABASE_POOL_MAX: "10",
  AIFROGI_CANONICAL_SERVING_REQUIRED: "0",
  AIFROGI_SIGNED_BOT_RELEASE_REQUIRED: "0",
  AIFROGI_ALLOW_LEGACY_FACTUAL_FALLBACK: "1",
  PORT: "3021"
};

spawnSync("pm2", ["delete", processName], { stdio: "ignore" });
const started = spawnSync("pm2", ["start", "npm", "--name", processName, "--cwd", cwd, "--", "start", "--", "-p", "3021"], {
  env,
  stdio: "inherit"
});
if (started.status !== 0) process.exit(started.status ?? 1);

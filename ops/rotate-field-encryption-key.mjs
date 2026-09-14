#!/usr/bin/env node
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import pg from "pg";

const oldSecret = String(process.env.OLD_FIELD_ENCRYPTION_SECRET || "").trim();
const newSecret = String(process.env.NEW_FIELD_ENCRYPTION_SECRET || "").trim();
if (oldSecret.length < 24 || newSecret.length < 24 || oldSecret === newSecret) throw new Error("Provide distinct OLD_FIELD_ENCRYPTION_SECRET and NEW_FIELD_ENCRYPTION_SECRET values of at least 24 characters.");
const key = (secret) => createHash("sha256").update(secret).digest();
const decrypt = (value) => {
  if (!value || !String(value).startsWith("enc:v1:")) return value;
  const payload = Buffer.from(String(value).slice(7), "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key(oldSecret), payload.subarray(0, 12));
  decipher.setAuthTag(payload.subarray(12, 28));
  return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString("utf8");
};
const encrypt = (value) => {
  if (!value) return value;
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(newSecret), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  return `enc:v1:${Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url")}`;
};

const apps = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
const app = apps.find((item) => item.name === "lead-os-ai");
if (!app?.pm2_env?.DATABASE_URL) throw new Error("Protected production database configuration is unavailable.");
const client = new pg.Client({ connectionString: app.pm2_env.DATABASE_URL, connectionTimeoutMillis: 5000 });
const targets = [
  ["BotConnectorCredential", "id", "secretEncrypted"],
  ["OnboardingCredential", "id", "registrationPin"],
  ["WhatsAppIntegration", "id", "webhookVerifyToken"],
  ["WhatsAppIntegration", "id", "accessToken"],
  ["AppointmentTenant", "id", "googleRefreshTokenEnc"]
];
await client.connect();
let changed = 0;
try {
  await client.query("BEGIN");
  for (const [table, idColumn, valueColumn] of targets) {
    const rows = await client.query(`SELECT "${idColumn}", "${valueColumn}" FROM "${table}" WHERE "${valueColumn}" LIKE 'enc:v1:%'`);
    for (const row of rows.rows) {
      const plain = decrypt(row[valueColumn]);
      const rotated = encrypt(plain);
      await client.query(`UPDATE "${table}" SET "${valueColumn}" = $1 WHERE "${idColumn}" = $2`, [rotated, row[idColumn]]);
      changed += 1;
    }
  }
  await client.query("COMMIT");
  console.log(`Field encryption rotation completed for ${changed} encrypted values. Update LEADOS_FIELD_ENCRYPTION_SECRET and restart immediately.`);
} catch (error) { await client.query("ROLLBACK"); throw error; }
finally { await client.end(); }

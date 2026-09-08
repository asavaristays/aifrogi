import fs from "node:fs";
import cp from "node:child_process";

const csvPath = "/tmp/rzp-key-2.csv";
const envPath = "/var/www/lead-os-ai/.env.local";
const rows = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "").trim().split(/\r?\n/).map(line => line.split(",").map(value => value.trim().replace(/^"|"$/g, "")));
const headers = rows[0].map(value => value.toLowerCase());
const keyIdIndex = headers.indexOf("key_id");
const keySecretIndex = headers.indexOf("key_secret");
const keyId = rows[1]?.[keyIdIndex]?.trim();
const keySecret = rows[1]?.[keySecretIndex]?.trim();
if (!keyId?.startsWith("rzp_live_") || !keySecret || rows.length !== 2) throw new Error("CSV must contain exactly one live key pair.");

const original = fs.readFileSync(envPath, "utf8");
const timestamp = new Date().toISOString().replaceAll(":", "").replaceAll("-", "").replace(/\.\d{3}Z$/, "Z");
const backup = `${envPath}.bak-razorpay-${timestamp}`;
fs.copyFileSync(envPath, backup);
fs.chmodSync(backup, 0o600);

function replaceSetting(source, name, value) {
  const filtered = source.split(/\r?\n/).filter(line => !line.startsWith(`${name}=`));
  filtered.push(`${name}=${value}`);
  return `${filtered.join("\n").replace(/\n+$/, "")}\n`;
}

let updated = replaceSetting(original, "RAZORPAY_KEY_ID", keyId);
updated = replaceSetting(updated, "RAZORPAY_KEY_SECRET", keySecret);
fs.writeFileSync(envPath, updated, { mode: 0o600 });

try {
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 39900, currency: "INR", receipt: `aif-key-check-${Date.now()}`, notes: { purpose: "UNPAID_CONFIGURATION_CHECK" } })
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.id) throw new Error(`Razorpay authentication failed (${response.status}): ${body?.error?.description || "Unknown response"}`);

  cp.execFileSync("pm2", ["restart", "lead-os-ai", "--update-env"], { stdio: "inherit", env: { ...process.env, RAZORPAY_KEY_ID: keyId, RAZORPAY_KEY_SECRET: keySecret } });
  let health;
  for (let index = 0; index < 40; index += 1) {
    try { const result = await fetch("http://127.0.0.1:3011/api/health/ready"); health = await result.json(); if (result.ok && health.status === "ok") break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (health?.status !== "ok") throw new Error("AiFrogi health failed after Razorpay configuration.");
  console.log(JSON.stringify({ configured: true, mode: "live", unpaidOrderCreated: true, charged: false, backup, release: health.release }));
} catch (error) {
  fs.copyFileSync(backup, envPath);
  throw error;
} finally {
  fs.rmSync(csvPath, { force: true });
}

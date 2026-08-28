import "server-only";

import { createHash, randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { isAllowedCredentialIdentity, writeCredentialSettings } from "@/lib/credential-store";
import { sendBookingMail } from "@/lib/services/mailbox-service";
import {
  createTeamPasswordReset,
  getTeamPasswordReset,
  resetTeamMemberPassword
} from "@/lib/repositories/team-repository";

type PlatformResetRecord = {
  email: string;
  tokenHash: string;
  expiresAt: string;
};

const runtimeDir = path.join(process.cwd(), "data", "runtime");
const platformResetFile = path.join(runtimeDir, "password-resets.json");
const RESET_TTL_MS = 60 * 60 * 1000;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function appUrl() {
  return (process.env.AIFROGI_APP_URL || process.env.PUBLIC_BASE_URL || "https://app.aifrogi.com").replace(/\/+$/, "");
}

function resetUrl(token: string) {
  return `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

async function readPlatformResets() {
  try {
    const parsed = JSON.parse(await fs.readFile(platformResetFile, "utf8")) as PlatformResetRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePlatformResets(records: PlatformResetRecord[]) {
  await fs.mkdir(runtimeDir, { recursive: true });
  const now = Date.now();
  const active = records.filter((record) => Date.parse(record.expiresAt) > now);
  await fs.writeFile(platformResetFile, JSON.stringify(active, null, 2), "utf8");
}

async function createPlatformPasswordReset(email: string, token: string, expiresAt: Date) {
  if (!(await isAllowedCredentialIdentity(email))) return false;
  const records = (await readPlatformResets()).filter((record) => record.email !== email);
  records.push({ email, tokenHash: hashToken(token), expiresAt: expiresAt.toISOString() });
  await writePlatformResets(records);
  return true;
}

async function getPlatformPasswordReset(token: string) {
  const tokenHash = hashToken(token);
  const records = await readPlatformResets();
  const record = records.find((item) => item.tokenHash === tokenHash);
  if (!record || Date.parse(record.expiresAt) <= Date.now()) return null;
  return record;
}

async function resetPlatformPassword(token: string, password: string) {
  const record = await getPlatformPasswordReset(token);
  if (!record) throw new Error("This password reset link is invalid or has expired.");
  if (password.length < 10) throw new Error("Use at least 10 characters for your password.");
  await writeCredentialSettings({ username: record.email, label: "AiFrogi Administrator", password });
  await writePlatformResets((await readPlatformResets()).filter((item) => item.tokenHash !== record.tokenHash));
  return { email: record.email };
}

async function sendResetEmail(email: string, link: string, expiresAt: Date) {
  try {
    const result = await sendBookingMail({
      to: email,
      subject: "Reset your AiFrogi password",
      body: `Hello,\n\nUse this secure link to reset your AiFrogi password:\n${link}\n\nThis link expires at ${expiresAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST.\n\nIf you did not request this, ignore this email. Never share passwords, OTPs, or Meta credentials.\n\nAiFrogi`
    });
    return !result.error;
  } catch {
    return false;
  }
}

export async function requestPasswordReset(emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (!email || !email.includes("@")) return { ok: true, emailSent: false };

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  const platformIssued = await createPlatformPasswordReset(email, token, expiresAt);
  const teamIssued = platformIssued ? false : await createTeamPasswordReset(email, token, expiresAt);
  const issued = platformIssued || teamIssued;
  const link = resetUrl(token);
  const emailSent = issued ? await sendResetEmail(email, link, expiresAt) : false;

  return {
    ok: true,
    emailSent,
    resetUrl: issued && process.env.AIFROGI_PASSWORD_RESET_RETURN_LINK === "true" ? link : undefined
  };
}

export async function inspectPasswordReset(token: string) {
  const platform = await getPlatformPasswordReset(token);
  if (platform) return { email: platform.email, accountType: "platform", expiresAt: platform.expiresAt };
  const member = await getTeamPasswordReset(token);
  if (member) {
    return {
      email: member.email,
      accountType: "workspace",
      organizationName: member.organization.name,
      expiresAt: member.invitationExpiresAt?.toISOString()
    };
  }
  return null;
}

export async function completePasswordReset(token: string, password: string) {
  const platform = await getPlatformPasswordReset(token);
  if (platform) return resetPlatformPassword(token, password);
  return resetTeamMemberPassword(token, password);
}

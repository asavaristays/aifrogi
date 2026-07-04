import "server-only";

import { createHash, randomInt, randomUUID } from "crypto";
import { sendBookingMail } from "@/lib/services/mailbox-service";

type OtpRecord = {
  username: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
};

declare global {
  var __aifrogiLoginOtpChallenges__: Map<string, OtpRecord> | undefined;
}

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const store = globalThis.__aifrogiLoginOtpChallenges__ ?? new Map<string, OtpRecord>();
globalThis.__aifrogiLoginOtpChallenges__ = store;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function hashCode(challengeId: string, username: string, code: string) {
  return createHash("sha256")
    .update(`${challengeId}:${normalizeEmail(username)}:${code}`)
    .digest("hex");
}

function cleanExpiredChallenges() {
  const now = Date.now();
  for (const [challengeId, record] of store.entries()) {
    if (record.expiresAt <= now) {
      store.delete(challengeId);
    }
  }
}

function generateOtpCode() {
  return String(randomInt(100000, 1000000));
}

export function shouldRequireLoginOtp(input: {
  appRole: "admin" | "hotel_owner";
  workspaceRole?: string;
}) {
  if (process.env.AIFROGI_LOGIN_OTP_DISABLED === "true") return false;
  if (input.appRole === "admin") return true;
  const role = input.workspaceRole?.toUpperCase();
  return role === "OWNER" || role === "ADMIN";
}

export async function createLoginOtpChallenge(input: {
  username: string;
  label?: string;
}) {
  cleanExpiredChallenges();
  const username = normalizeEmail(input.username);
  const code = generateOtpCode();
  const challengeId = randomUUID();
  const expiresAt = Date.now() + OTP_TTL_MS;

  store.set(challengeId, {
    username,
    codeHash: hashCode(challengeId, username, code),
    expiresAt,
    attempts: 0,
    createdAt: Date.now()
  });

  const mail = await sendBookingMail({
    to: username,
    subject: "Your AiFrogi sign-in code",
    body: `Hello${input.label ? ` ${input.label}` : ""},\n\nYour AiFrogi sign-in code is ${code}.\n\nThis code expires in 10 minutes. If you did not try to sign in, change your password and contact support immediately.\n\nNever share OTPs, passwords, Meta credentials, or access tokens with anyone.\n\nAiFrogi`
  });

  if (mail.error) {
    store.delete(challengeId);
    return { error: mail.error, challengeId: null, expiresAt: null };
  }

  return { error: null, challengeId, expiresAt: new Date(expiresAt).toISOString() };
}

export function verifyLoginOtpChallenge(input: {
  username: string;
  challengeId?: string | null;
  code?: string | null;
}) {
  cleanExpiredChallenges();
  const challengeId = input.challengeId?.trim() || "";
  const code = String(input.code || "").replace(/[^\d]/g, "");
  const username = normalizeEmail(input.username);
  const record = challengeId ? store.get(challengeId) : null;

  if (!record || record.username !== username) {
    return { ok: false, error: "The sign-in code is invalid or expired." };
  }

  if (record.expiresAt <= Date.now()) {
    store.delete(challengeId);
    return { ok: false, error: "The sign-in code has expired. Sign in again to receive a new code." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    store.delete(challengeId);
    return { ok: false, error: "Too many incorrect code attempts. Sign in again to receive a new code." };
  }

  record.attempts += 1;
  if (!/^\d{6}$/.test(code) || hashCode(challengeId, username, code) !== record.codeHash) {
    return { ok: false, error: "The sign-in code is incorrect." };
  }

  store.delete(challengeId);
  return { ok: true, error: null };
}


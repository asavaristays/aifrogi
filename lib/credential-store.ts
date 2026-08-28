import { promises as fs } from "fs";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import path from "path";

export type CredentialSettings = {
  username: string;
  password: string;
  label: string;
};

type StoredCredentialSettings = {
  username?: string;
  label?: string;
  password?: string;
  passwordHash?: string;
};

const runtimeDir = path.join(process.cwd(), "data", "runtime");
const runtimeFile = path.join(runtimeDir, "credentials.json");
const HASH_PREFIX = "scrypt";
const DEFAULT_LOGIN_IDENTITIES = ["info@aifrogi.com", "support@hotelradar.in"];

function allowedLoginIdentities(primaryUsername: string) {
  const configured = process.env.AIFROGI_LOGIN_IDENTITIES
    ?.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean) ?? [];

  return new Set([
    primaryUsername.trim().toLowerCase(),
    ...DEFAULT_LOGIN_IDENTITIES,
    ...configured
  ].filter(Boolean));
}

export async function isAllowedCredentialIdentity(username: string) {
  const settings = await readCredentialSettings();
  const normalizedUsername = username.trim().toLowerCase();
  return Boolean(normalizedUsername && allowedLoginIdentities(settings.username).has(normalizedUsername));
}

function defaultCredentialSettings(): CredentialSettings {
  return {
    username: process.env.LEADOS_LOGIN_USERNAME ?? "",
    password: process.env.LEADOS_LOGIN_PASSWORD ?? "",
    label: process.env.LEADOS_LOGIN_LABEL ?? ""
  };
}

export function hashCredentialPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${HASH_PREFIX}$${salt}$${derived}`;
}

export function verifyCredentialPassword(password: string, hashed: string) {
  const parts = hashed.split("$");
  if (parts.length !== 3 || parts[0] !== HASH_PREFIX) return false;
  const [, salt, derived] = parts;
  const candidate = scryptSync(password, salt, 64).toString("hex");
  const candidateBuffer = Buffer.from(candidate);
  const derivedBuffer = Buffer.from(derived);
  return candidateBuffer.length === derivedBuffer.length && timingSafeEqual(candidateBuffer, derivedBuffer);
}

async function persistCredentialSettings(settings: Record<string, unknown>) {
  await fs.mkdir(runtimeDir, { recursive: true });
  await fs.writeFile(runtimeFile, JSON.stringify(settings, null, 2), "utf8");
}

export async function readCredentialSettings(): Promise<CredentialSettings> {
  try {
    const raw = await fs.readFile(runtimeFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<CredentialSettings> & Record<string, unknown>;
    const legacy = parsed as Record<string, unknown>;
    const username = typeof parsed.username === "string"
      ? parsed.username
      : typeof legacy.hotelUsername === "string"
        ? legacy.hotelUsername
        : defaultCredentialSettings().username;
    const label = typeof parsed.label === "string" ? parsed.label : defaultCredentialSettings().label;

    if (typeof legacy.passwordHash === "string" && legacy.passwordHash) {
      return {
        username,
        password: "",
        label
      };
    }

    if ("hotelUsername" in legacy || "adminUsername" in legacy) {
      const password = typeof parsed.password === "string"
        ? parsed.password
        : typeof legacy.hotelPassword === "string"
          ? legacy.hotelPassword
          : defaultCredentialSettings().password;
      if (password) {
        await persistCredentialSettings({
          username,
          label,
          passwordHash: hashCredentialPassword(password),
        });
      }
      return { username, password: "", label };
    }
    if (typeof parsed.password === "string" && parsed.password) {
      await persistCredentialSettings({
        username,
        label,
        passwordHash: hashCredentialPassword(parsed.password)
      });
      return { username, password: "", label };
    }

    return { ...defaultCredentialSettings(), username, label, password: "" };
  } catch {
    const defaults = defaultCredentialSettings();
    return { ...defaults, password: "" };
  }
}

export async function writeCredentialSettings(next: Partial<CredentialSettings>) {
  const current = await readCredentialSettings();
  let stored: StoredCredentialSettings = {};
  try {
    stored = JSON.parse(await fs.readFile(runtimeFile, "utf8")) as StoredCredentialSettings;
  } catch {
    // The environment-backed credential is used until the first saved update.
  }
  const password = typeof next.password === "string" ? next.password.trim() : "";
  const merged: Record<string, unknown> = {
    username: typeof next.username === "string" ? next.username.trim() || current.username : current.username,
    label: typeof next.label === "string" ? next.label.trim() || current.label : current.label,
  };

  if (password) {
    merged.passwordHash = hashCredentialPassword(password);
  } else if (stored.passwordHash) {
    merged.passwordHash = stored.passwordHash;
  }

  await persistCredentialSettings(merged);
  return {
    username: String(merged.username || ""),
    password: "",
    label: String(merged.label || "")
  } satisfies CredentialSettings;
}

export async function verifyCredential(username: string, password: string) {
  const settings = await readCredentialSettings();
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername || !password || !allowedLoginIdentities(settings.username).has(normalizedUsername)) {
    return null;
  }

  let stored: StoredCredentialSettings = {};
  try {
    stored = JSON.parse(await fs.readFile(runtimeFile, "utf8")) as StoredCredentialSettings;
  } catch {
    // Fall through to the initial environment-backed password.
  }

  const valid = stored.passwordHash
    ? verifyCredentialPassword(password, stored.passwordHash)
    : Boolean(process.env.LEADOS_LOGIN_PASSWORD) && password === process.env.LEADOS_LOGIN_PASSWORD;

  if (!valid) return null;
  return {
    username: normalizedUsername,
    label: settings.label || "AiFrogi Administrator"
  };
}

import { createHash } from "node:crypto";

const SECRET_PATTERNS: Array<[string, RegExp]> = [
  ["PASSWORD", /\b(password|passwd|pwd)\s*[:=]\s*([^\s,;]+)/gi],
  ["OTP", /\b(otp|one[- ]time (?:password|code))\s*[:=]?\s*\d{4,8}\b/gi],
  ["CARD", /\b(?:\d[ -]*?){13,19}\b/g],
  ["CVV", /\b(cvv|cvc)\s*[:=]?\s*\d{3,4}\b/gi],
  ["API_KEY", /\b(api[_ -]?key|secret[_ -]?key|access[_ -]?token)\s*[:=]\s*([A-Za-z0-9_\-.]{8,})/gi],
  ["BEARER", /\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi],
];

export function redactBeforePersistence(value: string) {
  let redacted = value;
  const findings: string[] = [];
  for (const [kind, pattern] of SECRET_PATTERNS) redacted = redacted.replace(pattern, () => { findings.push(kind); return `[REDACTED:${kind}]`; });
  return { redacted, findings: [...new Set(findings)], originalHash: createHash("sha256").update(value).digest("hex") };
}

export function sanitizePersistencePayload<T>(value: T): T {
  if (typeof value === "string") return redactBeforePersistence(value).redacted as T;
  if (Array.isArray(value)) return value.map(sanitizePersistencePayload) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, sanitizePersistencePayload(child)])) as T;
  return value;
}

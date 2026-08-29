import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 24 * 60 * 60;

export type WebsiteVisitorToken = {
  slug: string;
  sessionId: string;
  leadId: string;
  humanRequested: boolean;
  exp: number;
};

function secret() {
  const value = process.env.WEBSITE_VISITOR_SESSION_SECRET?.trim() || process.env.AUTH_SESSION_SECRET?.trim();
  if (!value || value === "change-this-in-production") throw new Error("Website visitor session secret is not configured");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value, "utf8").digest("base64url");
}

export function issueWebsiteVisitorToken(input: Omit<WebsiteVisitorToken, "exp">) {
  const payload: WebsiteVisitorToken = { ...input, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function hashWebsiteVisitorValue(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function verifyWebsiteVisitorToken(token: string, expectedSlug: string): WebsiteVisitorToken | null {
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return null;
  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(encoded));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as WebsiteVisitorToken;
    if (payload.slug !== expectedSlug || !payload.sessionId || !payload.leadId || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

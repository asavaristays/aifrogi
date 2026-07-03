import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { recordRegistrationEmailResult, registerTrialOrganization } from "@/lib/repositories/trial-registration-repository";
import { sendBookingMail } from "@/lib/services/mailbox-service";

function clean(value: unknown, max = 180) {
  return typeof value === "string" ? value.trim().replace(/[\r\n]+/g, " ").slice(0, max) : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeWebsite(value: string) {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(candidate);
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) throw new Error("Enter a working business website.");
  return url.toString().replace(/\/$/, "");
}

function validTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const requestHost = (request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host).split(",")[0].trim();
  if (origin && new URL(origin).host !== requestHost) return NextResponse.json({ error: "Registration request was not accepted." }, { status: 403 });

  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const ipLimit = consumeRateLimit(`register:ip:${ip}`, 8, 60 * 60 * 1000);
  if (!ipLimit.allowed) return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload || clean(payload.fax)) return NextResponse.json({ error: "Registration request was not accepted." }, { status: 400 });
  const companyName = clean(payload.companyName);
  const ownerName = clean(payload.ownerName);
  const ownerEmail = clean(payload.ownerEmail).toLowerCase();
  const ownerMobile = clean(payload.ownerMobile, 30);
  const industry = clean(payload.industry) || "Other";
  const country = clean(payload.country, 80) || "India";
  const timezone = clean(payload.timezone, 80) || "Asia/Kolkata";
  if (companyName.length < 2 || ownerName.length < 2 || !validEmail(ownerEmail)) return NextResponse.json({ error: "Add your company name, owner name, and a valid work email." }, { status: 400 });
  if (!validTimezone(timezone)) return NextResponse.json({ error: "Choose a valid business time zone." }, { status: 400 });
  const emailLimit = consumeRateLimit(`register:email:${ownerEmail}`, 4, 60 * 60 * 1000);
  if (!emailLimit.allowed) return NextResponse.json({ error: "A recent activation request already exists. Check your inbox or try again later." }, { status: 429 });

  let website = "";
  try {
    website = normalizeWebsite(clean(payload.website, 300));
  } catch {
    return NextResponse.json({ error: "Enter a working business website, for example https://example.com." }, { status: 400 });
  }

  try {
    const registration = await registerTrialOrganization({ companyName, ownerName, ownerEmail, ownerMobile, website, industry, country, timezone });
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || origin || requestUrl.origin).replace(/\/$/, "");
    const activationUrl = `${appUrl}/activate?token=${encodeURIComponent(registration.token)}`;
    let emailDelivered = false;
    try {
      const mail = await sendBookingMail({
        to: ownerEmail,
        subject: "Activate your AiFrogi trial workspace",
        body: `Hello ${ownerName},\n\nYour AiFrogi trial workspace for ${companyName} is ready to activate.\n\nCreate your personal password within 24 hours:\n${activationUrl}\n\nAfter signing in, AiFrogi will guide you through business verification, WhatsApp connection, template readiness, and your first test message.\n\nNever share passwords, OTPs, or Meta credentials with anyone.\n\nAiFrogi`
      });
      emailDelivered = !mail.error;
    } catch {
      emailDelivered = false;
    }
    await recordRegistrationEmailResult(registration.organizationId, ownerEmail, emailDelivered);
    if (!emailDelivered) return NextResponse.json({ error: "Your workspace was reserved, but the activation email could not be sent. Submit the form again to retry." }, { status: 503 });
    return NextResponse.json({ ok: true, email: ownerEmail, expiresAt: registration.expiresAt, activationUrl: process.env.NODE_ENV === "production" ? undefined : activationUrl }, { status: registration.resumed ? 200 : 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Registration could not be completed." }, { status: 400 });
  }
}

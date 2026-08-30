import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { recordRegistrationEmailResult, registerTrialOrganization } from "@/lib/repositories/trial-registration-repository";
import { sendBookingMail } from "@/lib/services/mailbox-service";
import { TRIAL_DAYS } from "@/lib/trial-policy";
import QRCode from "qrcode";

function clean(value: unknown, max = 180) {
  return typeof value === "string" ? value.trim().replace(/[\r\n]+/g, " ").slice(0, max) : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
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
  const source = clean(payload.source, 80) || "direct";
  const allowedBotCategories = new Set(["BUSINESS_AI", "STAY", "PINGBOOK", "RESTAURANT", "REAL_ESTATE", "EDUCATION", "FLOWCART", "CUSTOM"]);
  const botCategory = allowedBotCategories.has(clean(payload.botCategory, 40)) ? clean(payload.botCategory, 40) as "BUSINESS_AI" | "STAY" | "PINGBOOK" | "RESTAURANT" | "REAL_ESTATE" | "EDUCATION" | "FLOWCART" | "CUSTOM" : "BUSINESS_AI";
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
    const registration = await registerTrialOrganization({ companyName, ownerName, ownerEmail, ownerMobile, website, industry, country, timezone, source, botCategory });
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || origin || requestUrl.origin).replace(/\/$/, "");
    const activationUrl = `${appUrl}/activate?token=${encodeURIComponent(registration.token)}`;
    let emailDelivered = false;
    try {
      const qr = await QRCode.toBuffer(activationUrl, { width: 220, margin: 1, color: { dark: "#8A6A16", light: "#FFFFFF" } });
      const mail = await sendBookingMail({
        to: ownerEmail,
        subject: "Welcome to AiFrogi — activate your AI Business Bot",
        body: `Hello ${ownerName},\n\nYour ${TRIAL_DAYS}-day AiFrogi trial workspace for ${companyName} is ready.\n\nUsername: ${ownerEmail}\nCreate your private password within 24 hours: ${activationUrl}\n\nYou can also scan the activation QR in the branded email. After activation, complete onboarding to generate your website JavaScript, WordPress, iframe and standalone bot link. For security, installation code is not issued before ownership verification.\n\nOn day ${TRIAL_DAYS}, trial actions pause until Starter or another paid plan is activated. Your data remains preserved.\n\nNever share passwords, OTPs, or credentials.\n\nAiFrogi`,
        html: `<div style="margin:0;background:#050505;padding:32px 16px;font-family:Arial,sans-serif;color:#fff"><div style="max-width:620px;margin:auto;border:1px solid #403617;border-radius:18px;padding:30px;background:#101010"><img src="cid:aifrogi-logo" alt="AiFrogi" style="width:170px;height:auto"><p style="margin:28px 0 6px;color:#e2c66d;font-size:12px;letter-spacing:2px;text-transform:uppercase">Sovereign AI Business Bot</p><h1 style="margin:0 0 16px;font-size:28px;font-weight:600">Welcome, ${escapeHtml(ownerName)}.</h1><p style="color:#c8c8c8;line-height:1.7">Your ${TRIAL_DAYS}-day trial workspace for <strong style="color:#fff">${escapeHtml(companyName)}</strong> is ready. Verify ownership and create your private password.</p><div style="margin:24px 0;padding:18px;background:#1c1c1c;border-radius:12px"><div style="display:inline-block;vertical-align:middle;max-width:310px"><p style="margin:0 0 8px;color:#999;font-size:12px">USERNAME</p><p style="margin:0 0 20px;color:#fff">${escapeHtml(ownerEmail)}</p><a href="${activationUrl}" style="display:inline-block;background:#8a6a16;color:#fff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700">Create password & activate</a><p style="margin:12px 0 0;color:#999;font-size:12px">Secure link expires in 24 hours.</p></div><img src="cid:activation-qr" alt="Activation QR" width="150" height="150" style="display:inline-block;vertical-align:middle;margin-left:24px;border-radius:8px;background:#fff"></div><p style="color:#c8c8c8;line-height:1.7">After activation, onboarding generates your JavaScript, WordPress, iframe and standalone bot link. Installation credentials are released only after ownership verification.</p><p style="color:#999;font-size:12px;line-height:1.6">Never share passwords, OTPs or payment details. Trial actions pause after ${TRIAL_DAYS} days unless a paid plan is activated; workspace data remains preserved.</p></div></div>`,
        attachments: [
          { filename: "activation-qr.png", content: qr, cid: "activation-qr", contentType: "image/png" },
          { filename: "aifrogi-logo.png", content: await (await fetch(`${appUrl}/brand/aifrogi-logo.png`)).arrayBuffer().then((value) => Buffer.from(value)), cid: "aifrogi-logo", contentType: "image/png" }
        ]
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

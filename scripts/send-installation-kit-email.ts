import { loadEnvConfig } from "@next/env";
import QRCode from "qrcode";

loadEnvConfig(process.cwd());

async function main() {
  const recipient = String(process.argv[2] || "").trim().toLowerCase();
  const slug = String(process.argv[3] || "").trim();
  if (!recipient.includes("@") || !slug) throw new Error("Usage: send-installation-kit-email <recipient> <property-slug>");
  const [{ getDb }, { sendBookingMail }] = await Promise.all([import("../lib/db"), import("../lib/services/mailbox-service")]);
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const property = await db.property.findUnique({ where: { slug }, select: { name: true, slug: true, organization: { select: { name: true, ownerEmail: true, botProfile: { select: { installationKey: true } } } } } });
  const key = property?.organization?.botProfile?.installationKey;
  if (!property || !property.organization || !key) throw new Error("Tenant installation details are incomplete.");
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://app.aifrogi.com").replace(/\/$/, "");
  const standaloneUrl = `${appUrl}/bot/${property.slug}`;
  const script = `<script async src="${appUrl}/api/public/website-bot/${property.slug}/install?key=${key}"></script>`;
  const iframe = `<iframe src="${appUrl}/embed/${property.slug}" title="${property.organization.name} AI Business Bot" width="390" height="680" style="border:0;border-radius:22px" loading="lazy"></iframe>`;
  const qr = await QRCode.toBuffer(standaloneUrl, { width: 220, margin: 1, color: { dark: "#8A6A16", light: "#FFFFFF" } });
  const result = await sendBookingMail({
    to: recipient,
    subject: `[TEST] ${property.organization.name} AiFrogi installation kit`,
    body: `AiFrogi installation-kit test for ${property.organization.name}.\n\nAccount username: ${property.organization.ownerEmail}\nWebsite: https://webtechnosys.com\nOnboarding: ${appUrl}/onboarding\nStandalone bot: ${standaloneUrl}\n\nJavaScript / WordPress:\n${script}\n\niFrame:\n${iframe}\n\nAiFrogi\n+91-7410582898\ninfo@aifrogi.com`,
    html: `<div style="background:#f4f1e8;padding:36px 14px;font-family:Arial,sans-serif;color:#101010"><div style="max-width:650px;margin:auto;overflow:hidden;border:1px solid #ded8cb;border-radius:18px;background:#fff"><div style="padding:28px 30px;background:#050505"><img src="${appUrl}/brand/aifrogi-logo.png" alt="AiFrogi" style="width:170px"><p style="margin:20px 0 0;color:#e2c66d;font-size:11px;letter-spacing:2px">INSTALLATION KIT · TEST</p></div><div style="padding:30px"><h1 style="margin:0 0 12px;font-size:30px;font-weight:600">${property.organization.name} AI Bot</h1><p style="color:#5f5b54;line-height:1.7">Account username: <strong>${property.organization.ownerEmail}</strong><br>Business website: <a href="https://webtechnosys.com" style="color:#6d5310">webtechnosys.com</a></p><a href="${appUrl}/onboarding" style="display:inline-block;background:#8a6a16;color:#fff;text-decoration:none;padding:14px 21px;border-radius:7px;font-weight:700">Open onboarding</a><div style="margin-top:28px;padding:20px;background:#f7f3e7;border:1px solid #e6dcc0;border-radius:12px"><h2 style="margin:0 0 10px;font-size:17px">Standalone bot and QR</h2><p style="word-break:break-all;color:#6d5310">${standaloneUrl}</p><img src="cid:bot-access-qr" width="150" height="150" alt="Webtechnosys AI Bot QR" style="background:#fff;border-radius:8px"></div><h2 style="margin-top:28px;font-size:17px">JavaScript / WordPress</h2><pre style="white-space:pre-wrap;word-break:break-all;background:#101010;padding:15px;border-radius:8px;color:#ddd">${script.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre><h2 style="font-size:17px">iFrame</h2><pre style="white-space:pre-wrap;word-break:break-all;background:#101010;padding:15px;border-radius:8px;color:#ddd">${iframe.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre><p style="color:#756f64;font-size:12px">This is an authorised test email. The QR contains only the standalone bot URL and no password.</p></div><div style="padding:22px 30px;background:#101010;color:#aaa;font-size:12px;line-height:1.8"><strong style="color:#fff">AiFrogi</strong><br><a href="tel:+917410582898" style="color:#e2c66d;text-decoration:none">+91-7410582898</a> &nbsp;·&nbsp; <a href="mailto:info@aifrogi.com" style="color:#e2c66d;text-decoration:none">info@aifrogi.com</a><br>AI Business Automation by Webtechnosys</div></div></div>`,
    attachments: [{ filename: "webtechnosys-ai-bot-qr.png", content: qr, cid: "bot-access-qr", contentType: "image/png" }]
  });
  if (result.error) throw new Error(result.error);
  console.log(`INSTALLATION_KIT_SENT ${result.messageId}`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });

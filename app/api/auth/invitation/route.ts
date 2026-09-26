import { NextResponse } from "next/server";
import { activateInvitation, getInvitation } from "@/lib/repositories/team-repository";
import { SELF_SERVICE_REGISTRATION } from "@/lib/repositories/trial-registration-repository";
import { sendBookingMail } from "@/lib/services/mailbox-service";
import QRCode from "qrcode";
import { writeKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { getWebsiteKnowledgeBase } from "@/lib/services/website-knowledge-service";
import { getDb } from "@/lib/db";
import { withSystemDatabaseIdentity } from "@/lib/security/tenant-database-context";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET(request: Request) {
  return withSystemDatabaseIdentity("auth:invitation", "inspect-invitation", async () => {
  const token = new URL(request.url).searchParams.get("token") || "";
  const invitation = await getInvitation(token);
  if (!invitation || invitation.status !== "INVITED" || !invitation.invitationExpiresAt || invitation.invitationExpiresAt < new Date()) return NextResponse.json({ error: "This invitation is invalid or has expired." }, { status: 404 });
  return NextResponse.json({ email: invitation.email, name: invitation.name, role: invitation.role, organizationName: invitation.organization.name, expiresAt: invitation.invitationExpiresAt, registration: invitation.invitedBy === SELF_SERVICE_REGISTRATION }, { headers: { "Cache-Control": "no-store" } });
  });
}

export async function POST(request: Request) {
  return withSystemDatabaseIdentity("auth:invitation", "activate-invitation", async () => {
  const payload = await request.json().catch(() => null) as { token?: string; password?: string } | null;
  try {
    const member = await activateInvitation(payload?.token || "", payload?.password || "");
    if (member.registration && member.installation) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production" ? "https://app.aifrogi.com" : new URL(request.url).origin)).replace(/\/$/, "");
      const { companyName, propertySlug, installationKey, category } = member.installation;
      const hotelMode = category === "STAY";
      let crawlReady = false;
      let pagesPrepared = 0;
      if (member.installation.website) {
        try {
          await writeKnowledgeSettings(propertySlug, { sourceUrl: member.installation.website, approvedForAi: true, status: "DRAFT" });
          const prepared = await getWebsiteKnowledgeBase(propertySlug, true);
          pagesPrepared = prepared.pages.length;
          crawlReady = hotelMode && pagesPrepared > 0;
          if (crawlReady) {
            await getDb()?.botProfile.update({ where: { organizationId: member.organizationId }, data: { status: "LIVE", liveAt: new Date(), pausedAt: null, deletedAt: null, lifecycleUpdatedBy: member.email } });
            await getDb()?.onboardingActivity.create({ data: { organizationId: member.organizationId, actorEmail: member.email, action: "TRIAL_BASIC_PUBLIC_BOT_ACTIVATED", detail: `${pagesPrepared} readable first-party website page${pagesPrepared === 1 ? "" : "s"} prepared; basic public trial bot activated with website-only transaction boundaries.` } });
          } else if (pagesPrepared > 0) {
            await getDb()?.onboardingActivity.create({ data: { organizationId: member.organizationId, actorEmail: member.email, action: "TRIAL_WEBSITE_KNOWLEDGE_PREPARED", detail: `${pagesPrepared} public website page${pagesPrepared === 1 ? "" : "s"} prepared for client review.` } });
          }
        } catch {
          await getDb()?.onboardingActivity.create({ data: { organizationId: member.organizationId, actorEmail: member.email, action: "TRIAL_WEBSITE_KNOWLEDGE_NEEDS_ATTENTION", detail: "Automatic public website preparation did not complete. The client can retry from Intelligence or add information manually." } }).catch(() => null);
        }
      }
      const standaloneUrl = `${appUrl}/bot/${propertySlug}`;
      const script = `<script async src="${appUrl}/api/public/website-bot/${propertySlug}/install?key=${installationKey}"></script>`;
      const iframe = `<iframe src="${appUrl}/embed/${propertySlug}" title="${companyName} AI Business Bot" width="390" height="680" style="border:0;border-radius:22px" loading="lazy"></iframe>`;
      try {
        const qr = crawlReady ? await QRCode.toBuffer(standaloneUrl, { width: 220, margin: 1, color: { dark: "#8A6A16", light: "#FFFFFF" } }) : null;
        const downloadableAttachments = hotelMode ? await Promise.all([
          ["AiFrogi-HotelGPT-Onboarding-Workbook.xlsx", "AiFrogi-HotelGPT-Knowledge-Onboarding.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
          ["AiFrogi-HotelGPT-Quick-Start-Manual.pdf", "AiFrogi-HotelGPT-Quick-Start-Manual.pdf", "application/pdf"]
        ].map(async ([filename, storedName, contentType]) => ({ filename, content: await readFile(path.join(process.cwd(), "public", "downloads", storedName)), contentType }))) : [];
        const productName = hotelMode ? "HotelGPT" : "AiFrogi AI Bot";
        const crawlMessage = crawlReady
          ? `${pagesPrepared} public website page${pagesPrepared === 1 ? " was" : "s were"} read successfully. Your basic public trial bot is active.`
          : "Your account is active, but the website could not yet provide readable information. Your bot remains safely in setup mode; retry the website check from Intelligence.";
        await sendBookingMail({
          to: member.email,
          subject: crawlReady ? `Your ${productName} public trial is active` : `Your ${productName} workspace is ready` ,
          body: `Welcome to ${productName}.\n\n${crawlMessage}\n\nUsername: ${member.email}\nContinue onboarding: ${appUrl}/onboarding\n${crawlReady ? `Public bot: ${standaloneUrl}\n\nJavaScript / WordPress:\n${script}\n\niFrame:\n${iframe}\n` : ""}\nComplete the attached workbook to add and approve full hotel information. The attached quick-start manual explains every step. Never enter passwords, OTPs, card details or guest records in the workbook.\n\nAiFrogi\n+91-7410582898\ninfo@aifrogi.com`,
          html: `<div style="background:#f4f1e8;padding:36px 14px;font-family:Arial,sans-serif;color:#101010"><div style="max-width:650px;margin:auto;overflow:hidden;border:1px solid #ded8cb;border-radius:18px;background:#fff"><div style="padding:28px 30px;background:#050505"><img src="${appUrl}/brand/aifrogi-logo-white.png" alt="AiFrogi" style="width:170px"><p style="margin:20px 0 0;color:#e2c66d;font-size:11px;letter-spacing:2px">${hotelMode ? "HOTELGPT · 15-DAY PUBLIC TRIAL" : "AI BUSINESS BOT · 15-DAY TRIAL"}</p></div><div style="padding:30px"><h1 style="margin:0 0 12px;font-size:30px;font-weight:600">${crawlReady ? `Your ${productName} trial is active.` : `Your ${productName} workspace is ready.`}</h1><p style="color:#5f5b54;line-height:1.7">${crawlMessage}</p><p style="color:#5f5b54;line-height:1.7">Username: <strong>${member.email}</strong></p><a href="${appUrl}/onboarding" style="display:inline-block;background:#8a6a16;color:#fff;text-decoration:none;padding:14px 21px;border-radius:7px;font-weight:700">Continue HotelGPT setup</a>${crawlReady ? `<div style="margin-top:28px;padding:20px;background:#f7f3e7;border:1px solid #e6dcc0;border-radius:12px"><h2 style="margin:0 0 10px;font-size:17px">Public ${productName} and QR</h2><p style="word-break:break-all;color:#6d5310">${standaloneUrl}</p><img src="cid:bot-access-qr" width="150" height="150" alt="${productName} QR" style="background:#fff;border-radius:8px"></div><h2 style="margin-top:28px;font-size:17px">JavaScript / WordPress</h2><pre style="white-space:pre-wrap;word-break:break-all;background:#404040;padding:15px;border-radius:8px;color:#fff">${script.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre><h2 style="font-size:17px">iFrame</h2><pre style="white-space:pre-wrap;word-break:break-all;background:#404040;padding:15px;border-radius:8px;color:#fff">${iframe.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre>` : ""}<div style="margin-top:24px;padding:18px;border-left:4px solid #8a6a16;background:#fffaf0"><strong>Complete hotel information</strong><p style="margin:8px 0 0;color:#68645c;line-height:1.6">Use the attached protected workbook and four-page manual. Samples and Pending information are never treated as approved hotel knowledge.</p></div><p style="color:#756f64;font-size:12px;line-height:1.6">Your password is never emailed or encoded in the QR. Never place passwords, OTPs, payment credentials or guest records in the workbook.</p></div><div style="padding:22px 30px;background:#404040;color:#e3e3e3;font-size:12px;line-height:1.8"><strong style="color:#fff">AiFrogi HotelGPT</strong><br><a href="tel:+917410582898" style="color:#e2c66d;text-decoration:none">+91-7410582898</a> &nbsp;·&nbsp; <a href="mailto:info@aifrogi.com" style="color:#e2c66d;text-decoration:none">info@aifrogi.com</a><br><span>AI Business Automation by Webtechnosys</span></div></div></div>`,
          attachments: [...(qr ? [{ filename: "hotelgpt-access-qr.png", content: qr, cid: "bot-access-qr", contentType: "image/png" }] : []), ...downloadableAttachments]
        });
      } catch {
        // Account activation must remain successful if the optional installation email is temporarily unavailable.
      }
    }
    return NextResponse.json({ ok: true, email: member.email, registration: member.registration });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not activate this account." }, { status: 400 });
  }
  });
}

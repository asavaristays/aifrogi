import { NextResponse } from "next/server";
import { activateInvitation, getInvitation } from "@/lib/repositories/team-repository";
import { SELF_SERVICE_REGISTRATION } from "@/lib/repositories/trial-registration-repository";
import { sendBookingMail } from "@/lib/services/mailbox-service";
import { writeKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { getWebsiteKnowledgeBase } from "@/lib/services/website-knowledge-service";
import { getDb, withDatabaseIdentity } from "@/lib/db";
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
  return withDatabaseIdentity({ organizationId: "", platformAuthority: true, actor: "auth:invitation", systemPurpose: "activate-invitation" }, async () => {
  const payload = await request.json().catch(() => null) as { token?: string; password?: string } | null;
  try {
    const member = await activateInvitation(payload?.token || "", payload?.password || "");
    if (member.registration && member.installation) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production" ? "https://app.aifrogi.com" : new URL(request.url).origin)).replace(/\/$/, "");
      const { propertySlug, category } = member.installation;
      const hotelMode = category === "STAY";
      let pagesPrepared = 0;
      // Hotel preparation is durably queued in the same transaction as email
      // verification. A webpage count never grants public serving authority.
      if (member.installation.website && !hotelMode) {
        try {
          await writeKnowledgeSettings(propertySlug, { sourceUrl: member.installation.website, approvedForAi: true, status: "DRAFT" });
          const prepared = await getWebsiteKnowledgeBase(propertySlug, true);
          pagesPrepared = prepared.pages.length;
          if (pagesPrepared > 0) {
            await getDb()?.onboardingActivity.create({ data: { organizationId: member.organizationId, actorEmail: member.email, action: "TRIAL_WEBSITE_KNOWLEDGE_PREPARED", detail: `${pagesPrepared} public website page${pagesPrepared === 1 ? "" : "s"} prepared for client review.` } });
          }
        } catch {
          await getDb()?.onboardingActivity.create({ data: { organizationId: member.organizationId, actorEmail: member.email, action: "TRIAL_WEBSITE_KNOWLEDGE_NEEDS_ATTENTION", detail: "Automatic public website preparation did not complete. The client can retry from Intelligence or add information manually." } }).catch(() => null);
        }
      }
      try {
        const downloadableAttachments = hotelMode ? await Promise.all([
          ["AiFrogi-HotelGPT-Onboarding-Workbook.xlsx", "AiFrogi-HotelGPT-Knowledge-Onboarding.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
          ["AiFrogi-HotelGPT-Quick-Start-Manual.pdf", "AiFrogi-HotelGPT-Quick-Start-Manual.pdf", "application/pdf"]
        ].map(async ([filename, storedName, contentType]) => ({ filename, content: await readFile(path.join(process.cwd(), "public", "downloads", storedName)), contentType }))) : [];
        const productName = hotelMode ? "HotelGPT" : "AiFrogi AI Bot";
        const crawlMessage = hotelMode
          ? "Your account is active. Sign in to watch HotelGPT read your website and check its first answers. Your public trial bot opens automatically when those checks pass. Excel and additional information can be added afterward."
          : pagesPrepared > 0 ? `${pagesPrepared} public website pages are prepared for review. Sign in to continue setup.` : "Your account is active. Sign in to add your website or business information.";
        await sendBookingMail({
          smtpTimeoutMs: 8000,
          to: member.email,
          subject: `Your ${productName} workspace is ready`,
          body: `Welcome to ${productName}.\n\n${crawlMessage}\n\nUsername: ${member.email}\nContinue onboarding: ${appUrl}/onboarding\n\nComplete the attached workbook to add and approve full hotel information. The attached quick-start manual explains every step. Never enter passwords, OTPs, card details or guest records in the workbook.\n\nAiFrogi\n+91-7410582898\ninfo@aifrogi.com`,
          html: `<div style="background:#f4f1e8;padding:36px 14px;font-family:Arial,sans-serif;color:#101010"><div style="max-width:650px;margin:auto;overflow:hidden;border:1px solid #ded8cb;border-radius:18px;background:#fff"><div style="padding:28px 30px;background:#050505"><img src="${appUrl}/brand/aifrogi-logo-white.png" alt="AiFrogi" style="width:170px"><p style="margin:20px 0 0;color:#e2c66d;font-size:11px;letter-spacing:2px">${hotelMode ? "HOTELGPT · 15-DAY PUBLIC TRIAL" : "AI BUSINESS BOT · 15-DAY TRIAL"}</p></div><div style="padding:30px"><h1 style="margin:0 0 12px;font-size:30px;font-weight:600">Your ${productName} workspace is ready.</h1><p style="color:#5f5b54;line-height:1.7">${crawlMessage}</p><p style="color:#5f5b54;line-height:1.7">Username: <strong>${member.email}</strong></p><a href="${appUrl}/onboarding" style="display:inline-block;background:#8a6a16;color:#fff;text-decoration:none;padding:14px 21px;border-radius:7px;font-weight:700">Continue HotelGPT setup</a><div style="margin-top:24px;padding:18px;border-left:4px solid #8a6a16;background:#fffaf0"><strong>Complete hotel information</strong><p style="margin:8px 0 0;color:#68645c;line-height:1.6">Use the attached protected workbook and four-page manual. Samples and Pending information are never treated as approved hotel knowledge.</p></div><p style="color:#756f64;font-size:12px;line-height:1.6">Your password is never emailed or encoded in the QR. Never place passwords, OTPs, payment credentials or guest records in the workbook.</p></div><div style="padding:22px 30px;background:#404040;color:#e3e3e3;font-size:12px;line-height:1.8"><strong style="color:#fff">AiFrogi HotelGPT</strong><br><a href="tel:+917410582898" style="color:#e2c66d;text-decoration:none">+91-7410582898</a> &nbsp;·&nbsp; <a href="mailto:info@aifrogi.com" style="color:#e2c66d;text-decoration:none">info@aifrogi.com</a><br><span>AI Business Automation by Webtechnosys</span></div></div></div>`,
          attachments: downloadableAttachments
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

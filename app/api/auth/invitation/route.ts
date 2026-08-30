import { NextResponse } from "next/server";
import { activateInvitation, getInvitation } from "@/lib/repositories/team-repository";
import { SELF_SERVICE_REGISTRATION } from "@/lib/repositories/trial-registration-repository";
import { sendBookingMail } from "@/lib/services/mailbox-service";
import QRCode from "qrcode";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const invitation = await getInvitation(token);
  if (!invitation || invitation.status !== "INVITED" || !invitation.invitationExpiresAt || invitation.invitationExpiresAt < new Date()) return NextResponse.json({ error: "This invitation is invalid or has expired." }, { status: 404 });
  return NextResponse.json({ email: invitation.email, name: invitation.name, role: invitation.role, organizationName: invitation.organization.name, expiresAt: invitation.invitationExpiresAt, registration: invitation.invitedBy === SELF_SERVICE_REGISTRATION }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as { token?: string; password?: string } | null;
  try {
    const member = await activateInvitation(payload?.token || "", payload?.password || "");
    if (member.registration && member.installation) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
      const { companyName, propertySlug, installationKey } = member.installation;
      const standaloneUrl = `${appUrl}/bot/${propertySlug}`;
      const script = `<script async src="${appUrl}/api/public/website-bot/${propertySlug}/install?key=${installationKey}"></script>`;
      const iframe = `<iframe src="${appUrl}/embed/${propertySlug}" title="${companyName} AI Business Bot" width="390" height="680" style="border:0;border-radius:22px" loading="lazy"></iframe>`;
      try {
        const qr = await QRCode.toBuffer(standaloneUrl, { width: 220, margin: 1, color: { dark: "#8A6A16", light: "#FFFFFF" } });
        await sendBookingMail({
          to: member.email,
          subject: "Your AiFrogi AI Bot installation kit",
          body: `Welcome to AiFrogi.\n\nUsername: ${member.email}\nOnboarding: ${appUrl}/onboarding\nStandalone bot link: ${standaloneUrl}\n\nJavaScript / WordPress:\n${script}\n\niFrame:\n${iframe}\n\nThe bot becomes publicly available only after onboarding, installation detection and Super Admin go-live approval.\n\nAiFrogi`,
          html: `<div style="background:#050505;padding:30px;font-family:Arial,sans-serif;color:#fff"><div style="max-width:650px;margin:auto;border:1px solid #403617;border-radius:16px;padding:28px;background:#101010"><img src="${appUrl}/brand/aifrogi-logo.png" alt="AiFrogi" style="width:170px"><h1 style="font-size:26px;font-weight:600">Your installation kit is ready.</h1><p style="color:#c8c8c8;line-height:1.7">Username: <strong style="color:#fff">${member.email}</strong></p><a href="${appUrl}/onboarding" style="display:inline-block;background:#8a6a16;color:#fff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700">Continue onboarding</a><h2 style="margin-top:28px;font-size:17px">Standalone bot and QR</h2><p style="word-break:break-all;color:#e2c66d">${standaloneUrl}</p><img src="cid:bot-access-qr" width="150" height="150" alt="AI Bot QR" style="background:#fff;border-radius:8px"><h2 style="margin-top:28px;font-size:17px">JavaScript / WordPress</h2><pre style="white-space:pre-wrap;word-break:break-all;background:#1c1c1c;padding:14px;border-radius:8px;color:#ddd">${script.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre><h2 style="font-size:17px">iFrame</h2><pre style="white-space:pre-wrap;word-break:break-all;background:#1c1c1c;padding:14px;border-radius:8px;color:#ddd">${iframe.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre><p style="color:#999;font-size:12px;line-height:1.6">The bot is released publicly only after onboarding, installation detection and Super Admin approval. Your password is never emailed or encoded in the QR.</p></div></div>`,
          attachments: [{ filename: "aifrogi-bot-qr.png", content: qr, cid: "bot-access-qr", contentType: "image/png" }]
        });
      } catch {
        // Account activation must remain successful if the optional installation email is temporarily unavailable.
      }
    }
    return NextResponse.json({ ok: true, email: member.email, registration: member.registration });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not activate this account." }, { status: 400 });
  }
}

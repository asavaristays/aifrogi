import { sendBookingMail } from "@/lib/services/mailbox-service";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

export async function sendSupportTicketMail(input: { to: string; reference: string; subject: string; heading: string; body: string; actionLabel?: string }) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://app.aifrogi.com").replace(/\/$/, "");
  const ticketSubject = `[${input.reference}] ${input.subject}`;
  return sendBookingMail({
    to: input.to,
    subject: ticketSubject,
    body: `${input.heading}\n\n${input.body}\n\nOpen support: ${appUrl}/support\n\nReply to this email without changing ${input.reference}; your reply will be added to the same ticket. Never send passwords, OTPs, keys, tokens, or card details.`,
    html: `<div style="margin:0;background:#f4f1e8;padding:32px 14px;font-family:Arial,sans-serif;color:#101010"><div style="max-width:620px;margin:auto;overflow:hidden;border:1px solid #ded8cb;border-radius:16px;background:#fff"><div style="padding:24px 28px;background:#050505"><img src="${appUrl}/brand/aifrogi-logo-white.png" alt="AiFrogi" style="width:155px"><p style="margin:18px 0 0;color:#e2c66d;font-size:11px;letter-spacing:2px">${escapeHtml(input.reference)}</p></div><div style="padding:28px"><h1 style="margin:0 0 14px;font-size:26px">${escapeHtml(input.heading)}</h1><p style="white-space:pre-wrap;color:#5f5b54;line-height:1.7">${escapeHtml(input.body)}</p><a href="${appUrl}/support" style="display:inline-block;margin-top:20px;background:#8a6a16;color:#fff;text-decoration:none;padding:13px 19px;border-radius:7px;font-weight:700">${escapeHtml(input.actionLabel || "Open support ticket")}</a><p style="margin-top:22px;color:#756f64;font-size:12px;line-height:1.6">Reply without changing the ticket reference. Never send passwords, OTPs, API keys, tokens, or card details.</p></div></div></div>`
  });
}

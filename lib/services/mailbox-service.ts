import "server-only";

import {
  BOOKING_EMAIL_IMAP_HOST,
  BOOKING_EMAIL_IMAP_PORT,
  BOOKING_EMAIL_SMTP_HOST,
  BOOKING_EMAIL_SMTP_PORT
} from "@/lib/channel-config";
import { BOOKING_MAILBOX } from "@/lib/mailbox-config";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import type { MailboxMessage, MailboxSummary } from "@/types";

const sentFolderCandidates = ["Sent", "Sent Items", "Sent Mail", "Sent Messages", "[Gmail]/Sent Mail", ".Sent"];

function isConfigured() {
  return Boolean(
    BOOKING_MAILBOX.email &&
      BOOKING_MAILBOX.password &&
      BOOKING_EMAIL_IMAP_HOST &&
      BOOKING_EMAIL_IMAP_PORT &&
      BOOKING_EMAIL_SMTP_HOST &&
      BOOKING_EMAIL_SMTP_PORT
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function excerpt(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
}

function getTextBody(parsed: Awaited<ReturnType<typeof simpleParser>>) {
  const body = parsed.text?.trim() || "";
  if (body) return body;
  const html = parsed.html ? String(parsed.html) : "";
  if (!html) return "";

  const structured = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])\s*>/gi, "\n\n")
    .replace(/<(p|div|li|tr|h[1-6])[^>]*>/gi, "")
    .replace(/<[^>]+>/g, " ");

  return structured
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getAddressLabel(value?: string | null) {
  if (!value) return "";
  return value.replace(/\s*<[^>]+>\s*/g, "").trim();
}

async function fetchFolderMessages(folder: string | string[], limit: number, folderType: "inbox" | "sent") {
  const client = new ImapFlow({
    host: BOOKING_EMAIL_IMAP_HOST,
    port: Number(BOOKING_EMAIL_IMAP_PORT),
    secure: true,
    auth: {
      user: BOOKING_MAILBOX.email,
      pass: BOOKING_MAILBOX.password
    }
  });

  const messages: MailboxMessage[] = [];

  try {
    await client.connect();
    const mailbox = await client.mailboxOpen(folder);
    const exists = mailbox.exists ?? 0;
    const start = Math.max(1, exists - limit + 1);

    for await (const message of client.fetch(`${start}:*`, {
      envelope: true,
      source: true,
      flags: true,
      internalDate: true,
      uid: true
    })) {
      const rawSource = message.source;
      const parsed = rawSource
        ? await simpleParser(Buffer.isBuffer(rawSource) ? rawSource : Buffer.from(rawSource as Uint8Array))
        : null;
      const sentAt = new Date(message.internalDate ?? new Date());
      const subject = parsed?.subject?.trim() || message.envelope?.subject?.trim() || "(No subject)";
      const fromName = getAddressLabel(parsed?.from?.text ?? message.envelope?.from?.[0]?.name ?? "");
      const from = parsed?.from?.text ?? message.envelope?.from?.[0]?.address ?? "";
      const to = parsed?.to?.text ?? message.envelope?.to?.[0]?.address ?? BOOKING_MAILBOX.email;
      const body = parsed ? getTextBody(parsed) : "";
      const isSeen = Array.isArray(message.flags) ? message.flags.includes("\\Seen") : false;
      const isFlagged = Array.isArray(message.flags) ? message.flags.includes("\\Flagged") : false;

      messages.push({
        id: String(message.uid ?? messages.length + 1),
        folder: folderType,
        from,
        fromName,
        to,
        subject,
        preview: excerpt(body || subject),
        body,
        sentAtIso: sentAt.toISOString(),
        sentAtLabel: formatDate(sentAt),
        unread: !isSeen,
        starred: isFlagged,
        hasAttachments: Boolean(parsed?.attachments?.length)
      });
    }
  } catch {
    return [];
  } finally {
    try {
      await client.logout();
    } catch {
      // Ignore logout issues after IMAP fetches.
    }
  }

  return messages.sort((a, b) => new Date(b.sentAtIso).getTime() - new Date(a.sentAtIso).getTime());
}

function deriveResponseTime(messages: MailboxMessage[]) {
  const ordered = [...messages].sort((a, b) => new Date(a.sentAtIso).getTime() - new Date(b.sentAtIso).getTime());
  const deltas: number[] = [];

  for (let index = 0; index < ordered.length; index += 1) {
    const current = ordered[index];
    if (current.folder !== "inbox") continue;

    const reply = ordered.slice(index + 1).find((item) => item.folder === "sent");
    if (!reply) continue;

    const gap = new Date(reply.sentAtIso).getTime() - new Date(current.sentAtIso).getTime();
    if (gap >= 0) {
      deltas.push(gap);
    }
  }

  if (!deltas.length) return "—";

  const averageMs = deltas.reduce((total, gap) => total + gap, 0) / deltas.length;
  const minutes = Math.max(1, Math.round(averageMs / 60000));

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export async function loadBookingMailbox(limit = 10): Promise<MailboxSummary> {
  if (!isConfigured()) {
    return {
      configured: false,
      emailAddress: BOOKING_MAILBOX.email,
      messages: [],
      stats: {
        emailCount: 0,
        responseCount: 0,
        responseTimeLabel: "—",
        receivedCount: 0,
        sentCount: 0,
        unreadCount: 0,
        starredCount: 0,
        updatedAtLabel: "Not connected"
      },
      folders: [
        { id: "inbox", label: "Inbox", count: 0 },
        { id: "sent", label: "Sent", count: 0 },
        { id: "drafts", label: "Drafts", count: 0 },
        { id: "spam", label: "Spam", count: 0 },
        { id: "trash", label: "Trash", count: 0 }
      ]
    };
  }

  const [inboxMessages, sentMessages] = await Promise.all([
    fetchFolderMessages("INBOX", limit, "inbox"),
    fetchFolderMessages(sentFolderCandidates, limit, "sent")
  ]);

  const messages = [...inboxMessages, ...sentMessages].sort(
    (a, b) => new Date(b.sentAtIso).getTime() - new Date(a.sentAtIso).getTime()
  );
  const latest = messages[0];
  const unreadCount = inboxMessages.filter((message) => message.unread).length;
  const starredCount = messages.filter((message) => message.starred).length;

  return {
    configured: true,
    emailAddress: BOOKING_MAILBOX.email,
    messages,
    stats: {
      emailCount: inboxMessages.length,
      responseCount: sentMessages.length,
      responseTimeLabel: deriveResponseTime(messages),
      receivedCount: inboxMessages.length,
      sentCount: sentMessages.length,
      unreadCount,
      starredCount,
      updatedAtLabel: latest ? latest.sentAtLabel : "No recent mail"
    },
    folders: [
      { id: "inbox", label: "Inbox", count: inboxMessages.length },
      { id: "sent", label: "Sent", count: sentMessages.length },
      { id: "drafts", label: "Drafts", count: 0 },
      { id: "spam", label: "Spam", count: 0 },
      { id: "trash", label: "Trash", count: 0 }
    ]
  };
}

export async function sendBookingMail(input: { to: string; subject: string; body: string; html?: string; attachments?: Array<{ filename: string; content: Buffer; cid?: string; contentType?: string }> }) {
  if (!isConfigured()) {
    return {
      error: "Booking mailbox is not configured with IMAP/SMTP credentials.",
      messageId: null
    };
  }

  const transporter = nodemailer.createTransport({
    host: BOOKING_EMAIL_SMTP_HOST,
    port: Number(BOOKING_EMAIL_SMTP_PORT),
    secure: true,
    auth: {
      user: BOOKING_MAILBOX.email,
      pass: BOOKING_MAILBOX.password
    }
  });

  const info = await transporter.sendMail({
    from: `"${BOOKING_MAILBOX.fromName}" <${BOOKING_MAILBOX.email}>`,
    to: input.to,
    subject: input.subject,
    text: input.body,
    html: input.html,
    attachments: input.attachments,
    replyTo: BOOKING_MAILBOX.email
  });

  return {
    error: null,
    messageId: info.messageId
  };
}

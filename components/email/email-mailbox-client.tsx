"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/icons";
import { BOOKING_INBOX_EMAIL } from "@/lib/channel-config";
import type { MailboxFolderId, MailboxMessage, MailboxSummary } from "@/types";

type FilterMode = "all" | "unread" | "read" | "starred";
type ComposeMode = "reply" | "new";

const filterChips: Array<{ label: string; value: FilterMode }> = [
  { label: "All mail", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
  { label: "Starred", value: "starred" }
];

const folderEmphasis: Record<MailboxFolderId, string> = {
  inbox: "Inbox",
  sent: "Sent",
  drafts: "Drafts",
  spam: "Spam",
  trash: "Trash"
};

function initials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "EM"
  );
}

function formatMessageBody(body: string) {
  return body || "No message body available.";
}

function formatPreview(message: MailboxMessage) {
  return `${message.subject} · ${message.preview}`;
}

export function EmailMailboxClient({ initialMailbox }: { initialMailbox: MailboxSummary }) {
  const [mailbox, setMailbox] = useState(initialMailbox);
  const [activeFolder, setActiveFolder] = useState<MailboxFolderId>("inbox");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState(
    initialMailbox.messages.find((message) => message.folder === "inbox")?.id ?? initialMailbox.messages[0]?.id ?? ""
  );
  const [composeMode, setComposeMode] = useState<ComposeMode>("reply");
  const [to, setTo] = useState(BOOKING_INBOX_EMAIL);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleMessages = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return mailbox.messages.filter((message) => {
      const folderMatch = activeFolder === "inbox" ? message.folder === "inbox" : message.folder === activeFolder;
      const filterMatch =
        filterMode === "all"
          ? true
          : filterMode === "unread"
            ? message.unread
            : filterMode === "read"
              ? !message.unread
              : message.starred;
      const searchMatch =
        !normalizedSearch ||
        message.subject.toLowerCase().includes(normalizedSearch) ||
        message.preview.toLowerCase().includes(normalizedSearch) ||
        message.from.toLowerCase().includes(normalizedSearch) ||
        message.fromName.toLowerCase().includes(normalizedSearch);

      return folderMatch && filterMatch && searchMatch;
    });
  }, [activeFolder, filterMode, mailbox.messages, searchQuery]);

  const selectedMessage = useMemo<MailboxMessage | null>(() => {
    if (!visibleMessages.length) return null;
    return visibleMessages.find((message) => message.id === selectedMessageId) ?? visibleMessages[0] ?? null;
  }, [selectedMessageId, visibleMessages]);

  const latestMessage = mailbox.messages[0] ?? null;

  async function refreshMailbox() {
    setStatus("Refreshing mailbox...");
    try {
      const response = await fetch("/api/email", { cache: "no-store" });
      const data = (await response.json()) as { mailbox?: MailboxSummary; error?: string };

      if (!response.ok || !data.mailbox) {
        throw new Error(data.error || "Unable to refresh mailbox");
      }

      setMailbox(data.mailbox);
      setActiveFolder("inbox");
      setFilterMode("all");
      setSelectedMessageId(data.mailbox.messages.find((message) => message.folder === "inbox")?.id ?? data.mailbox.messages[0]?.id ?? "");
      setComposeMode("reply");
      setStatus("Mailbox refreshed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to refresh mailbox.");
    }
  }

  function openNewMessage() {
    setComposeMode("new");
    setTo(BOOKING_INBOX_EMAIL);
    setSubject("");
    setBody("");
    setStatus("New message ready.");
  }

  function openReply(message = selectedMessage) {
    if (!message) return;
    setComposeMode("reply");
    setTo(message.from || BOOKING_INBOX_EMAIL);
    setSubject(message.subject.toLowerCase().startsWith("re:") ? message.subject : `Re: ${message.subject}`);
    setBody(`\n\n---\n${message.body.slice(0, 500)}`);
    setStatus("Reply ready.");
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Sending email...");

    startTransition(async () => {
      try {
        const response = await fetch("/api/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            to,
            subject,
            body
          })
        });

        const data = (await response.json()) as { ok?: boolean; error?: string; mailbox?: MailboxSummary };

        if (!response.ok || !data.ok || !data.mailbox) {
          throw new Error(data.error || "Email could not be sent.");
        }

        setMailbox(data.mailbox);
        setActiveFolder("sent");
        setFilterMode("all");
        setSelectedMessageId(data.mailbox.messages.find((message) => message.folder === "sent")?.id ?? "");
        setComposeMode("reply");
        setTo(BOOKING_INBOX_EMAIL);
        setSubject("");
        setBody("");
        setStatus("Email sent.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Email could not be sent.");
      }
    });
  }

  const matrix = [
    { label: "No. Email", value: String(mailbox.stats.emailCount), tone: "from-[#4f46e5] to-[#c7d2fe]" },
    { label: "Response", value: String(mailbox.stats.responseCount), tone: "from-[#16a34a] to-[#bbf7d0]" },
    { label: "Response Time", value: mailbox.stats.responseTimeLabel, tone: "from-[#f59e0b] to-[#fde68a]" }
  ] as const;

  const activeFolderLabel = folderEmphasis[activeFolder];

  return (
    <div className="space-y-5 bg-white px-4 py-5 text-black sm:px-6 lg:px-8">
      <Card className="overflow-hidden border border-black/10 bg-white p-0 text-black shadow-[0_20px_60px_rgba(24,18,72,0.06)]">
        <div className="border-b border-black/10 bg-white px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[var(--text-muted)]">Mailbox</p>
              <h1 className="mt-1 text-[1.35rem] font-black tracking-tight">{BOOKING_INBOX_EMAIL}</h1>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex min-w-[220px] items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 shadow-[0_10px_24px_rgba(31,20,71,0.05)]">
                <Icon name="search" className="text-[var(--text-muted)]" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                  placeholder="Search mail..."
                />
              </label>
              <Button tone="surface" onClick={refreshMailbox} disabled={isPending} className="rounded-full">
                <Icon name="refresh-cw" className="h-4 w-4" />
                Refresh
              </Button>
              <Button tone="primary" onClick={openNewMessage} className="rounded-full px-5">
                Compose
              </Button>
            </div>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-240px)] gap-0 xl:grid-cols-[225px_minmax(0,1.35fr)_360px]">
          <aside className="border-r border-black/10 bg-white p-4 text-black">
            <div className="rounded-[26px] border border-black/10 bg-white p-4 shadow-[0_10px_24px_rgba(24,18,72,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[var(--text-muted)]">Mail account</p>
              <h2 className="mt-2 break-all text-sm font-black tracking-tight text-black">{BOOKING_INBOX_EMAIL}</h2>
              <p className="mt-2 text-[11px] leading-5 text-[var(--text-muted)]">Hostinger IMAP + SMTP</p>
            </div>

            <Button tone="primary" className="mt-4 w-full rounded-full" onClick={openNewMessage}>
              <Icon name="arrow-right" className="h-4 w-4 rotate-45" />
              New message
            </Button>

            <div className="mt-5 space-y-2">
              {mailbox.folders.map((folder) => {
                const active = activeFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => {
                      setActiveFolder(folder.id);
                      const nextMessage = mailbox.messages.find((message) => message.folder === folder.id) ?? null;
                      setSelectedMessageId(nextMessage?.id ?? "");
                      setComposeMode("reply");
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-black/10 bg-white text-black shadow-[0_12px_26px_rgba(0,0,0,0.06)]"
                        : "border-black/10 bg-white text-black hover:bg-black/[0.03]"
                    }`}
                  >
                    <span className="text-sm font-semibold">{folder.label}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? "bg-[var(--primary)] text-white" : "bg-[rgba(88,92,112,0.12)] text-[var(--text-muted)]"}`}>
                      {folder.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-[24px] border border-black/10 bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Mailbox status</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text)]">
                {mailbox.configured ? "Connected and ready for booking mail." : "Mailbox not connected."}
              </p>
            </div>
          </aside>

          <section className="border-r border-black/10 bg-white text-black">
            <div className="flex items-center justify-between gap-4 border-b border-black/10 px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[var(--text-muted)]">Inbox</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight">{activeFolderLabel}</h3>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[var(--text-muted)]">Updated</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">{mailbox.stats.updatedAtLabel}</p>
              </div>
            </div>

            <div className="grid gap-3 border-b border-black/10 px-5 py-4 md:grid-cols-3">
              {matrix.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[24px] border border-black/10 bg-white p-4 text-black shadow-[0_12px_28px_rgba(24,18,72,0.04)]"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">{item.label}</p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-black">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 border-b border-black/10 px-5 py-4">
              {filterChips.map((chip) => {
                const active = filterMode === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setFilterMode(chip.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-black/10 bg-black/[0.04] text-black"
                        : "border-black/10 bg-white text-[var(--text-muted)] hover:bg-black/[0.03]"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            <div className="max-h-[calc(100vh-470px)] overflow-y-auto p-3">
              {visibleMessages.length ? (
                visibleMessages.map((message) => {
                  const active = selectedMessage?.id === message.id;
                  return (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() => {
                        setSelectedMessageId(message.id);
                        setComposeMode("reply");
                        openReply(message);
                      }}
                      className={`mb-3 flex w-full items-start gap-4 rounded-[24px] border px-4 py-4 text-left transition ${
                        active
                          ? "border-black/10 bg-black/[0.03] shadow-[0_10px_26px_rgba(24,18,72,0.05)]"
                          : "border-black/10 bg-white hover:bg-black/[0.02]"
                      }`}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-black text-white">
                        {initials(message.fromName || message.from)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className="truncate text-sm font-bold text-black">{message.fromName || message.from}</p>
                          <span className="shrink-0 text-[11px] font-semibold text-[var(--text-muted)]">{message.sentAtLabel}</span>
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-black">{message.subject}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-6 text-[var(--text-muted)]">{formatPreview(message)}</p>
                      </div>

                      <div className="mt-0.5 flex flex-col items-end gap-2">
                        {message.starred ? <span className="text-[var(--tertiary)]">★</span> : null}
                        {message.unread ? <span className="h-2.5 w-2.5 rounded-full bg-[var(--secondary)]" /> : null}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed border-black/10 bg-white px-8 text-center">
                  <div>
                    <p className="text-lg font-bold text-black">No mail in this view</p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">Try another filter or refresh the mailbox.</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="flex h-full flex-col space-y-4 bg-white p-4 text-black">
            <Card className="flex h-full min-h-0 flex-col overflow-hidden border border-black/10 bg-white p-0 text-black shadow-[0_22px_60px_rgba(24,18,72,0.05)]">
              <div className="border-b border-black/10 px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[var(--text-muted)]">Open</p>
                <h3 className="mt-1 text-xl font-black tracking-tight">
                  {composeMode === "new" ? "Compose new mail" : selectedMessage ? selectedMessage.subject : "Select a message"}
                </h3>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 py-4">
                {composeMode === "new" ? (
                  <form className="flex min-h-0 flex-1 flex-col gap-3" onSubmit={handleSend}>
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">To</span>
                      <input
                        value={to}
                        onChange={(event) => setTo(event.target.value)}
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-[var(--text-muted)]/70"
                        placeholder="guest@email.com"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Subject</span>
                      <input
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-[var(--text-muted)]/70"
                        placeholder="Reservation reply"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Message</span>
                      <textarea
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        rows={6}
                        className="min-h-[150px] w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm leading-7 text-black outline-none placeholder:text-[var(--text-muted)]/70"
                        placeholder="Write your booking reply..."
                      />
                    </label>

                    <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-[var(--text-muted)]">From: {BOOKING_INBOX_EMAIL}</p>
                      <Button type="submit" disabled={isPending} className="w-full rounded-full px-4 py-2.5 text-sm sm:w-auto">
                        <Icon name="arrow-right" className="h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </form>
                ) : selectedMessage ? (
                  <div className="flex min-h-0 flex-1 flex-col gap-4">
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <div>
                      <p className="font-bold text-black">{selectedMessage.fromName || selectedMessage.from}</p>
                      <p className="mt-1 text-[var(--text-muted)]">{selectedMessage.from}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                          {selectedMessage.folder === "sent" ? "Sent mail" : "Received mail"}
                        </p>
                      </div>
                      <Badge tone={selectedMessage.unread ? "secondary" : "neutral"}>{selectedMessage.sentAtLabel}</Badge>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto rounded-[24px] border border-black/10 bg-white p-4">
                      <p className="whitespace-pre-wrap break-words text-sm leading-7 [overflow-wrap:anywhere] text-black">
                        {formatMessageBody(selectedMessage.body)}
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-black/10 bg-white p-4 shadow-[0_10px_24px_rgba(24,18,72,0.05)]">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[var(--text-muted)]">Reply</p>
                          <h4 className="mt-1 truncate text-sm font-black tracking-tight sm:text-base">
                            To {selectedMessage.fromName || selectedMessage.from}
                          </h4>
                        </div>
                        <Button tone="surface" onClick={() => openNewMessage()} className="shrink-0 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm">
                          Compose
                        </Button>
                      </div>

                      <form className="flex min-h-0 flex-1 flex-col gap-2" onSubmit={handleSend}>
                        <div className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-[11px] leading-5 text-[var(--text-muted)] sm:px-4 sm:py-3 sm:text-xs">
                          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
                            <span className="truncate">
                              <strong className="font-bold text-black">To:</strong> {to}
                            </span>
                            <span className="truncate">
                              <strong className="font-bold text-black">Subject:</strong> {subject || `Re: ${selectedMessage.subject}`}
                            </span>
                          </div>
                        </div>

                        <label className="block">
                          <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Reply</span>
                          <textarea
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            rows={3}
                            className="min-h-[95px] w-full resize-none rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm leading-6 text-black outline-none placeholder:text-[var(--text-muted)]/70 sm:px-4 sm:py-3"
                            placeholder="Type your reply..."
                          />
                        </label>

                        <div className="grid gap-2 pt-1">
                          <p className="text-[11px] text-[var(--text-muted)]">From: {BOOKING_INBOX_EMAIL}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              tone="surface"
                              type="button"
                              onClick={() => openReply(selectedMessage)}
                              className="w-full rounded-full px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                            >
                              Reset reply
                            </Button>
                            <Button
                              type="submit"
                              disabled={isPending}
                              className="w-full rounded-full px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                            >
                              <Icon name="arrow-right" className="h-3.5 w-3.5" />
                              Send
                            </Button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-black/10 bg-white p-5 text-sm text-[var(--text-muted)]">
                    Pick an email to open it here.
                  </div>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </Card>

      {status ? <p className="px-2 text-xs text-[var(--text-muted)]">{status}</p> : null}
    </div>
  );
}

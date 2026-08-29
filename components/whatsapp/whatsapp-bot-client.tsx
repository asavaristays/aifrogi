"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Asset, Lead, LeadInput, WhatsAppIntegration } from "@/types";
import { LeadOperationsPanel } from "@/components/ai-operations/lead-operations-panel";

type QuickActionKind = "photos" | "payment" | "quote" | null;
type TimelineMessage = Lead["transcript"][number];
type OptimisticMessage = TimelineMessage & { leadId: string };
type BulkSendResult = {
  summary: {
    requested: number;
    sent: number;
    failed: number;
  };
  results: Array<{
    to: string;
    ok: boolean;
    status: number;
    error: string | null;
    deliveryStatus: string | null;
    externalMessageId: string | null;
  }>;
};
type ComposeMode = "text" | "template";
type InboxQueueKey =
  | "all"
  | "waiting"
  | "not_replied"
  | "ai_replied"
  | "human_needed"
  | "campaign_replies"
  | "trial_leads"
  | "audit_leads"
  | "resolved"
  | "failed_delivery";
const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function hasOpenCustomerServiceWindow(lead?: Lead) {
  if (!lead) return false;
  const latestInbound = [...lead.transcript].reverse().find((message) => message.from === "guest");
  if (!latestInbound) return false;
  const receivedAt = Date.parse(latestInbound.sentAtIso);
  return Number.isFinite(receivedAt) && Date.now() - receivedAt < CUSTOMER_SERVICE_WINDOW_MS;
}

function getIstDateKey(dateInput: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(typeof dateInput === "string" ? new Date(dateInput) : dateInput);
}

function getAverageResponseMinutes(messages: Lead["transcript"]) {
  const ordered = [...messages].sort((left, right) => new Date(left.sentAtIso).getTime() - new Date(right.sentAtIso).getTime());
  const samples: number[] = [];
  let pendingGuestMessage: Lead["transcript"][number] | null = null;

  for (const message of ordered) {
    if (message.from === "guest") {
      pendingGuestMessage = message;
      continue;
    }

    if (!pendingGuestMessage) {
      continue;
    }

    const delta = (new Date(message.sentAtIso).getTime() - new Date(pendingGuestMessage.sentAtIso).getTime()) / 60000;
    if (Number.isFinite(delta) && delta >= 0) {
      samples.push(delta);
    }
    pendingGuestMessage = null;
  }

  if (samples.length === 0) {
    return "0m";
  }

  const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  return `${Math.max(Math.round(average), 1)}m`;
}

function getDeliveryMeta(status?: string | null) {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "failed_payment_required") {
    return { label: "Payment required", ticks: "!", tone: "bg-[#fee2e2] text-[#b91c1c]" };
  }
  if (normalized === "failed_template_required") {
    return { label: "Template required", ticks: "!", tone: "bg-[#fff7ed] text-[#b45309]" };
  }
  if (normalized === "queued" || normalized === "pending") {
    return { label: "Queued", ticks: "…", tone: "bg-[#f1f5f9] text-[#64748b]" };
  }
  if (normalized === "accepted") {
    return { label: "Sent", ticks: "✓", tone: "bg-[#eef2ff] text-[#4f46e5]" };
  }
  if (normalized === "sent" || normalized === "queued_for_delivery") {
    return { label: "Sent", ticks: "✓", tone: "bg-[#eef2ff] text-[#4f46e5]" };
  }
  if (normalized === "delivered") {
    return { label: "Delivered", ticks: "✓✓", tone: "bg-[#dbeafe] text-[#1d4ed8]" };
  }
  if (normalized === "read") {
    return { label: "Read", ticks: "✓✓", tone: "bg-[#dcfce7] text-[#15803d]" };
  }
  if (normalized === "failed" || normalized === "error") {
    return { label: "Failed", ticks: "!", tone: "bg-[#fee2e2] text-[#b91c1c]" };
  }
  return { label: normalized, ticks: "✓", tone: "bg-[#eef2ff] text-[#4f46e5]" };
}

function getLatestMessage(lead: Lead) {
  return lead.transcript[lead.transcript.length - 1] ?? null;
}

function leadTextIndex(lead: Lead) {
  return `${lead.name} ${lead.phone} ${lead.source} ${lead.stage} ${lead.intent} ${lead.tags.join(" ")} ${lead.transcript
    .map((message) => message.text)
    .join(" ")}`.toLowerCase();
}

function isLeadResolved(lead: Lead) {
  return ["booked", "won", "resolved"].includes(lead.stage.toLowerCase()) || lead.tags.some((tag) => tag.toLowerCase() === "resolved");
}

function needsHuman(lead: Lead) {
  const text = leadTextIndex(lead);
  return lead.isHighPriority || text.includes("needs agent") || text.includes("manual takeover") || text.includes("human");
}

function hasFailedDelivery(lead: Lead) {
  return lead.transcript.some((message) => String(message.status || "").toLowerCase().includes("failed"));
}

function isCampaignLead(lead: Lead) {
  const text = leadTextIndex(lead);
  return text.includes("campaign") || text.includes("broadcast") || text.includes("template") || text.includes("goa_ai_audit");
}

function getLeadSourceLabel(lead: Lead) {
  const text = leadTextIndex(lead);
  if (text.includes("audit")) return "AI audit";
  if (text.includes("trial")) return "Trial";
  if (text.includes("campaign") || text.includes("broadcast") || text.includes("template")) return "Campaign";
  if (text.includes("website") || text.includes("bot")) return "Website";
  if (text.includes("whatsapp")) return "Inbound";
  return "Manual";
}

function getConversationState(lead: Lead) {
  const latest = getLatestMessage(lead);
  const latestOutgoing = [...lead.transcript].reverse().find((message) => message.from !== "guest");
  const delivery = getDeliveryMeta(latestOutgoing?.status);

  if (hasFailedDelivery(lead)) {
    return {
      label: delivery?.label ?? "Failed",
      tone: "bg-[#fff0ee] text-[#a3322c]",
      rail: "bg-[#d9493f]",
      helper: "Delivery needs review"
    };
  }

  if (needsHuman(lead)) {
    return {
      label: "Human needed",
      tone: "bg-[#fff1dd] text-[#8d4d10]",
      rail: "bg-[#d4842f]",
      helper: "Review before AI continues"
    };
  }

  if (latest?.from === "guest") {
    return {
      label: hasOpenCustomerServiceWindow(lead) ? "Waiting reply" : "Template required",
      tone: hasOpenCustomerServiceWindow(lead) ? "bg-[#fff1dd] text-[#8d4d10]" : "bg-[#eff6ff] text-[#1b62a5]",
      rail: hasOpenCustomerServiceWindow(lead) ? "bg-[#d4842f]" : "bg-[#3d8be3]",
      helper: hasOpenCustomerServiceWindow(lead) ? "Free reply available" : "Use approved template"
    };
  }

  if (latest?.from === "ai") {
    return {
      label: "AI replied",
      tone: "bg-[#eff6ff] text-[#1b62a5]",
      rail: "bg-[#3d8be3]",
      helper: "Human can review"
    };
  }

  if (isLeadResolved(lead)) {
    return {
      label: "Resolved",
      tone: "bg-[#e4f4ed] text-[#126452]",
      rail: "bg-[#27aa78]",
      helper: "Conversation closed"
    };
  }

  return {
    label: "Answered",
    tone: "bg-[#e4f4ed] text-[#126452]",
    rail: "bg-[#27aa78]",
    helper: "No reply pending"
  };
}

export function WhatsAppBotClient({
  integration,
  leads
}: {
  integration: WhatsAppIntegration;
  leads: Lead[];
}) {
  const router = useRouter();
  const validLeads = useMemo(() => leads.filter((lead) => Boolean(lead?.id && lead?.source && lead?.stage)), [leads]);
  const [activeId, setActiveId] = useState(validLeads[0]?.id ?? "");
  const [draftMessage, setDraftMessage] = useState("");
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [optimisticMessage, setOptimisticMessage] = useState<OptimisticMessage | null>(null);
  const [hasManualSelection, setHasManualSelection] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [shareNote, setShareNote] = useState("");
  const [quickActionKind, setQuickActionKind] = useState<QuickActionKind>(null);
  const [showBulkSend, setShowBulkSend] = useState(false);
  const [bulkNumbers, setBulkNumbers] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkResult, setBulkResult] = useState<BulkSendResult | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>("text");
  const [composePhone, setComposePhone] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [composeTemplateName, setComposeTemplateName] = useState("hello_world");
  const [composeTemplateLanguage, setComposeTemplateLanguage] = useState("en_US");
  const [composeTemplateVariables, setComposeTemplateVariables] = useState("");
  const [composeResult, setComposeResult] = useState<string | null>(null);
  const [activeQueue, setActiveQueue] = useState<InboxQueueKey>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const latestLeadId = useMemo(() => {
    return [...validLeads].sort(
      (left, right) => new Date(right.updatedAtIso).getTime() - new Date(left.updatedAtIso).getTime()
    )[0]?.id ?? validLeads[0]?.id ?? "";
  }, [validLeads]);
  const activeLead = useMemo(() => validLeads.find((lead) => lead.id === activeId) ?? validLeads[0], [activeId, validLeads]);
  const activeIsWebsite = useMemo(() => Boolean(activeLead && getLeadSourceLabel(activeLead) === "Website"), [activeLead]);
  const activeFreeTextAllowed = useMemo(
    () => activeIsWebsite || hasOpenCustomerServiceWindow(activeLead),
    [activeIsWebsite, activeLead]
  );
  const composeFreeTextAllowed = useMemo(() => {
    const digits = normalizePhoneDigits(composePhone);
    const matchingLead = validLeads.find((lead) => normalizePhoneDigits(lead.phone) === digits);
    return hasOpenCustomerServiceWindow(matchingLead);
  }, [composePhone, validLeads]);

  useEffect(() => {
    if (!hasManualSelection && latestLeadId && activeId !== latestLeadId) {
      setActiveId(latestLeadId);
    }
  }, [activeId, hasManualSelection, latestLeadId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, 10000);

    return () => window.clearInterval(timer);
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      const response = await fetch("/api/assets");
      const payload = await response.json();
      if (!cancelled) {
        setAssets(payload.assets ?? []);
      }
    }

    void loadAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  const timeline = useMemo(() => {
    if (!activeLead) return [];

    const nextTimeline = [...activeLead.transcript];

    if (optimisticMessage?.leadId === activeLead.id) {
      nextTimeline.push({
        id: optimisticMessage.id,
        from: optimisticMessage.from,
        text: optimisticMessage.text,
        time: optimisticMessage.time,
        sentAtIso: optimisticMessage.sentAtIso,
        status: optimisticMessage.status,
        attachment: null
      });
    }

    if (nextTimeline.length > 0) {
      return nextTimeline;
    }

    return [
      {
        id: `${activeLead.id}-starter`,
        from: "ai" as const,
        text: activeIsWebsite
          ? "This website conversation is ready for human follow-up and verified business actions."
          : "AiFrogi is connected and ready. Send the first WhatsApp reply to begin this conversation thread.",
        time: "Just now",
        sentAtIso: new Date().toISOString()
      }
    ];
  }, [activeIsWebsite, activeLead, optimisticMessage]);

  useEffect(() => {
    if (!optimisticMessage || !activeLead) return;
    if (optimisticMessage.leadId !== activeLead.id) return;

    const latestOutgoing = [...activeLead.transcript].reverse().find((message) => message.from !== "guest");
    if (latestOutgoing && latestOutgoing.text === optimisticMessage.text) {
      setOptimisticMessage(null);
    }
  }, [activeLead, optimisticMessage]);

  const leadMatrix = useMemo(() => {
    if (!activeLead) return [];

    const todayKey = getIstDateKey(new Date());
    const todaysMessages = activeLead.transcript.filter((message) => getIstDateKey(message.sentAtIso) === todayKey);
    const received = todaysMessages.filter((message) => message.from === "guest").length;
    const answered = todaysMessages.filter((message) => message.from !== "guest").length;
    const unanswered = Math.max(received - answered, 0);
    const responseMinutes = getAverageResponseMinutes(todaysMessages);
    const conversionEstimate =
      activeLead.stage === "Booked"
        ? 100
        : activeLead.stage === "Qualified"
          ? 72
          : activeLead.stage === "Proposal Sent"
            ? 48
            : activeLead.stage === "Contacted"
              ? 28
              : 12;

    return [
      {
        label: "Received",
        value: String(received),
        accent: "from-[#3f2aa8]/10 to-[#c9c0ff]/70 text-[#3f2aa8]"
      },
      {
        label: "Answer",
        value: String(answered),
        accent: "from-[#25d366]/12 to-[#daf9e6]/75 text-[#0f9f5f]"
      },
      {
        label: "UnAnswered",
        value: String(unanswered),
        accent: "from-[#f79009]/12 to-[#ffe9c8]/75 text-[#b86a00]"
      },
      {
        label: "Average response",
        value: responseMinutes,
        accent: "from-[#3ea0ff]/12 to-[#d8edff]/75 text-[#1768d1]"
      },
      {
        label: "Conversion",
        value: `${conversionEstimate}%`,
        accent: "from-[#7c5cff]/12 to-[#ece6ff]/80 text-[#4d33c9]"
      }
    ];
  }, [activeLead]);

  const filteredAssets = useMemo(() => {
    const includesAny = (asset: Asset, patterns: string[]) => {
      const haystack = `${asset.title} ${asset.description ?? ""} ${asset.type} ${asset.category} ${asset.tags.join(" ")}`
        .toLowerCase()
        .trim();
      return patterns.some((pattern) => haystack.includes(pattern));
    };

    const nextAssets =
      quickActionKind === "photos"
        ? assets.filter((asset) => includesAny(asset, ["image", "photo", "gallery", "room", "experience"]))
        : quickActionKind === "payment"
          ? assets.filter((asset) => includesAny(asset, ["payment", "upi"]))
          : quickActionKind === "quote"
            ? assets.filter((asset) => includesAny(asset, ["pdf", "quote", "brochure", "invoice", "document"]))
            : assets;

    return nextAssets.length > 0 ? nextAssets : assets;
  }, [assets, quickActionKind]);

  useEffect(() => {
    if (!quickActionKind) return;
    setSelectedAssetId((current) => {
      if (current && filteredAssets.some((asset) => asset.id === current)) {
        return current;
      }
      return filteredAssets[0]?.id ?? "";
    });
  }, [filteredAssets, quickActionKind]);

  const queueDefinitions = useMemo(() => {
    const matches = {
      all: (lead: Lead) => Boolean(lead),
      waiting: (lead: Lead) => getLatestMessage(lead)?.from === "guest" && hasOpenCustomerServiceWindow(lead),
      not_replied: (lead: Lead) => getLatestMessage(lead)?.from === "guest",
      ai_replied: (lead: Lead) => getLatestMessage(lead)?.from === "ai",
      human_needed: (lead: Lead) => needsHuman(lead),
      campaign_replies: (lead: Lead) => isCampaignLead(lead),
      trial_leads: (lead: Lead) => leadTextIndex(lead).includes("trial"),
      audit_leads: (lead: Lead) => leadTextIndex(lead).includes("audit"),
      resolved: (lead: Lead) => isLeadResolved(lead),
      failed_delivery: (lead: Lead) => hasFailedDelivery(lead)
    } satisfies Record<InboxQueueKey, (lead: Lead) => boolean>;

    return [
      { key: "all" as const, label: "All", helper: "Every conversation", tone: "bg-[var(--secondary)]", matches: matches.all },
      { key: "waiting" as const, label: "Waiting reply", helper: "Free reply window", tone: "bg-[#d4842f]", matches: matches.waiting },
      { key: "not_replied" as const, label: "Not replied", helper: "Customer spoke last", tone: "bg-[#f06f45]", matches: matches.not_replied },
      { key: "ai_replied" as const, label: "AI replied", helper: "Review automation", tone: "bg-[#3d8be3]", matches: matches.ai_replied },
      { key: "human_needed" as const, label: "Human needed", helper: "Manual attention", tone: "bg-[#8d4d10]", matches: matches.human_needed },
      { key: "campaign_replies" as const, label: "Campaign replies", helper: "Broadcast response", tone: "bg-[#7857d9]", matches: matches.campaign_replies },
      { key: "trial_leads" as const, label: "Trial leads", helper: "30-day trial", tone: "bg-[#27aa78]", matches: matches.trial_leads },
      { key: "audit_leads" as const, label: "Audit leads", helper: "AI audit interest", tone: "bg-[#1b62a5]", matches: matches.audit_leads },
      { key: "resolved" as const, label: "Resolved", helper: "Closed work", tone: "bg-[#6b7280]", matches: matches.resolved },
      { key: "failed_delivery" as const, label: "Failed delivery", helper: "Needs diagnosis", tone: "bg-[#d9493f]", matches: matches.failed_delivery }
    ].map((item) => ({
      ...item,
      count: validLeads.filter(item.matches).length
    }));
  }, [validLeads]);

  const filteredLeads = useMemo(() => {
    const activeDefinition = queueDefinitions.find((item) => item.key === activeQueue) ?? queueDefinitions[0];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return validLeads
      .filter((lead) => activeDefinition.matches(lead))
      .filter((lead) => !normalizedSearch || leadTextIndex(lead).includes(normalizedSearch))
      .sort((left, right) => new Date(right.updatedAtIso).getTime() - new Date(left.updatedAtIso).getTime());
  }, [activeQueue, queueDefinitions, searchTerm, validLeads]);

  if (!activeLead) {
    return (
      <Card className="p-8">
        <h2 className="text-xl font-semibold">No conversations yet</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Website bot and WhatsApp conversations will appear here automatically.
        </p>
      </Card>
    );
  }

  async function postWhatsAppMessage({
    message,
    attachment
  }: {
    message: string;
    attachment?: File | null;
  }) {
    if (activeIsWebsite) {
      if (attachment) {
        return { ok: false as const, error: "Attachments are not yet available for website conversations." };
      }

      const response = await fetch(`/api/leads/${activeLead.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "AGENT", body: message })
      });
      const payload = await response.json();

      if (!response.ok) {
        return { ok: false as const, error: payload.error ?? "Could not record website reply" };
      }

      return { ok: true as const, result: "Reply recorded in the website conversation" };
    }

      const response = await fetch("/api/integrations/whatsapp/operator-message", {
      method: "POST",
      body: (() => {
        if (!attachment) {
          return JSON.stringify({
            to: activeLead.phone,
            message,
            leadId: activeLead.id
          });
        }

        const formData = new FormData();
        formData.set("to", activeLead.phone);
        formData.set("message", message);
        formData.set("leadId", activeLead.id);
        formData.set("attachment", attachment);
        return formData;
      })(),
      headers: attachment
        ? undefined
        : {
            "Content-Type": "application/json"
          }
    });

    const payload = await response.json();

    if (!response.ok) {
      return { ok: false as const, error: payload.error ?? "Could not send WhatsApp message" };
    }

    return {
      ok: true as const,
      result: `${payload.result.status} via ${payload.result.provider}`
    };
  }

  async function sendTestMessage() {
    if ((!draftMessage.trim() && !selectedAttachment) || isSending) {
      return;
    }

    if (!activeFreeTextAllowed) {
      setSendResult("The 24-hour reply window is closed. Start this conversation with an approved Meta template.");
      return;
    }

    setIsSending(true);
    setSendResult(null);
    const pendingText = draftMessage.trim() || "Attachment shared";
    const tempId = `pending-${Date.now()}`;
    setOptimisticMessage({
      id: tempId,
      leadId: activeLead.id,
      from: "agent",
      text: pendingText,
      time: "Just now",
      sentAtIso: new Date().toISOString(),
      status: "queued",
      attachment: null
    });

    const result = await postWhatsAppMessage({
      message: draftMessage.trim(),
      attachment: selectedAttachment
    });

    if (!result.ok) {
      setOptimisticMessage((current) => (current && current.id === tempId ? { ...current, status: "failed" } : current));
      setSendResult(result.error);
      setIsSending(false);
      return;
    }

    setSendResult(result.result);
    setDraftMessage("");
    setSelectedAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsSending(false);
    router.refresh();
  }

  async function takeOverFromAi() {
    setIsSending(true);
    setSendResult(null);

    const payload: LeadInput = {
      name: activeLead.name,
      source: activeLead.source,
      stage: activeLead.stage,
      language: activeLead.language,
      intent: activeLead.intent,
      stay: activeLead.stay,
      party: activeLead.party,
      budget: activeLead.budget,
      phone: activeLead.phone,
      score: activeLead.score,
      tags: Array.from(new Set([...activeLead.tags, "Needs Agent", "Manual Takeover"])),
      isHighPriority: true
    };

    const response = await fetch(`/api/leads/${activeLead.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      setSendResult(result.error ?? "Could not mark this chat for manual handling");
      setIsSending(false);
      return;
    }

    setSendResult("Lead moved to human follow-up");
    setIsSending(false);
    router.refresh();
  }

  function openQuickAction(kind: Exclude<QuickActionKind, null>) {
    setQuickActionKind(kind);
    setShareNote(
      kind === "photos"
        ? `Sharing audit examples and relevant work samples for ${activeLead.name}.`
        : kind === "payment"
          ? `Sharing the secure payment link for your project confirmation.`
          : `Sharing quote details for your review.`
    );
  }

  async function submitQuickActionAsset() {
    if (!selectedAssetId || isSending) {
      return;
    }

    setIsSending(true);
    setSendResult(null);

    const shareResponse = await fetch(`/api/leads/${activeLead.id}/assets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        assetId: selectedAssetId,
        note: shareNote,
        channel: "WHATSAPP"
      })
    });
    const sharePayload = await shareResponse.json();

    if (!shareResponse.ok) {
      setSendResult(sharePayload.error ?? "Could not prepare asset share");
      setIsSending(false);
      return;
    }

    const selectedAsset = filteredAssets.find((asset) => asset.id === selectedAssetId);
    const messageBody = [
      shareNote.trim() || `Sharing ${selectedAsset?.title ?? "the requested asset"}.`,
      selectedAsset?.url ?? sharePayload.share?.assetUrl ?? ""
    ]
      .filter(Boolean)
      .join("\n");

    const sendPayload = await postWhatsAppMessage({
      message: messageBody
    });

    if (!sendPayload.ok) {
      setSendResult(sendPayload.error);
      setIsSending(false);
      return;
    }

    setSendResult(sendPayload.result);
    setQuickActionKind(null);
    setShareNote("");
    setIsSending(false);
    router.refresh();
  }

  async function submitBulkSend() {
    if (!bulkNumbers.trim() || !bulkMessage.trim() || isSending) {
      return;
    }

    setIsSending(true);
    setSendResult(null);
    setBulkResult(null);

    const response = await fetch("/api/integrations/whatsapp/bulk-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        recipients: bulkNumbers,
        message: bulkMessage,
        propertyId: activeLead.propertyId ?? "",
        propertySlug: activeLead.propertySlug ?? "hotelradar"
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      setSendResult(payload.error ?? "Could not send bulk WhatsApp message");
      setIsSending(false);
      return;
    }

    setBulkResult(payload);
    setSendResult(`Bulk send complete: ${payload.summary.sent}/${payload.summary.requested} sent`);
    setIsSending(false);
    router.refresh();
  }

  async function submitComposeMessage() {
    if (!composePhone.trim() || isSending) {
      return;
    }

    if (composeMode === "text" && !composeMessage.trim()) {
      return;
    }

    if (composeMode === "text" && !composeFreeTextAllowed) {
      setComposeResult("Free text is unavailable until this contact replies. Send an approved Meta template first.");
      return;
    }

    if (composeMode === "template" && !composeTemplateName.trim()) {
      return;
    }

    setIsSending(true);
    setSendResult(null);
    setComposeResult(null);

    const response = await fetch(
      composeMode === "template"
        ? "/api/integrations/whatsapp/template-message"
        : "/api/integrations/whatsapp/operator-message",
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(
        composeMode === "template"
          ? {
              to: composePhone,
              templateName: composeTemplateName.trim(),
              languageCode: composeTemplateLanguage.trim() || "en_US",
              bodyVariables: composeTemplateVariables,
              propertySlug: activeLead.propertySlug ?? "hotelradar"
            }
          : {
              to: composePhone,
              message: composeMessage.trim(),
              propertyId: activeLead.propertyId ?? "",
              propertySlug: activeLead.propertySlug ?? "hotelradar",
              operatorId: "lead-os-compose-operator"
            }
      )
      }
    );
    const payload = await response.json();

    if (!response.ok) {
      const error = payload.error ?? "Could not send WhatsApp message";
      setComposeResult(error);
      setSendResult(error);
      setIsSending(false);
      return;
    }

    const result = `${payload.result.status} via ${payload.result.provider}`;
    setComposeResult(result);
    setSendResult(result);
    if (composeMode === "text") {
      setComposeMessage("");
    }
    setIsSending(false);
    router.refresh();
  }

  const activeDefinition = queueDefinitions.find((item) => item.key === activeQueue) ?? queueDefinitions[0];
  const activeState = getConversationState(activeLead);
  const activeSource = getLeadSourceLabel(activeLead);
  const latestInbound = [...activeLead.transcript].reverse().find((message) => message.from === "guest");
  const aiSuggestedReply =
    activeSource === "AI audit"
      ? "Thanks for your interest in the AI audit. Please share your hotel name, website, city, and current booking channels. I will review visibility, conversion gaps, and WhatsApp follow-up opportunities."
      : activeSource === "Trial"
        ? "Thanks for your interest in the 30-day trial. Please share your business name, website, WhatsApp number, and the workflow you want to improve first."
        : "Thanks for reaching out. Please share your business name, website, current tools, and the result you want to achieve so we can guide the next step.";

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-[var(--shadow-card)]">
      <nav className="sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-[var(--border)] bg-white p-2 lg:hidden" aria-label="Inbox mobile sections">
        {[
          { href: "#inbox-queues", label: "Queues" },
          { href: "#inbox-conversations", label: "Chats" },
          { href: "#inbox-reply", label: "Reply" },
          { href: "#inbox-profile", label: "Profile" }
        ].map((item) => (
          <a key={item.href} href={item.href} className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--text)]">
            {item.label}
          </a>
        ))}
      </nav>
      <div className="inbox-v2-grid grid min-h-[760px] grid-cols-1">
        <aside id="inbox-queues" className="min-w-0 scroll-mt-12 border-b border-[var(--border)] bg-white lg:border-b-0 lg:border-r">
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Inbox desk</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{validLeads.length} cross-channel conversations</p>
              </div>
              <span className={`h-2.5 w-2.5 rounded-full ${integration.status === "CONNECTED" ? "bg-[var(--success)]" : "bg-[#d98a2b]"}`} />
            </div>
            <button
              type="button"
              className="mt-4 flex min-h-10 w-full items-center justify-center rounded-md bg-[var(--primary-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--primary)]"
              onClick={() => {
                setComposePhone("");
                setComposeMessage(draftMessage.trim());
                setComposeResult(null);
                setShowCompose(true);
              }}
            >
              New message
            </button>
            <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-soft)] p-3">
              <p className="text-xs font-medium text-[var(--text-muted)]">Automation</p>
              <div className="mt-2 flex items-center justify-between gap-3 text-sm text-[var(--text)]">
                <span>{integration.aiModeEnabled ? "AI suggestions active" : "AI suggestions off"}</span>
                <span className="text-xs font-semibold text-[var(--primary-strong)]">{integration.provider}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] p-3">
            <p className="px-2 text-xs font-semibold text-[var(--text-muted)]">Queues</p>
            <div className="mt-2 space-y-1">
              {queueDefinitions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-md border px-2.5 py-2 text-left transition ${
                    activeQueue === item.key
                      ? "border-[#f2d9f0] bg-[var(--primary-soft)] text-[var(--text)] shadow-[inset_3px_0_0_var(--primary)]"
                      : "border-transparent text-[#5f5866] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
                  }`}
                  onClick={() => setActiveQueue(item.key)}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{item.label}</span>
                    <span className="block truncate text-[11px] text-[var(--text-muted)]">{item.helper}</span>
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">{item.count}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <aside id="inbox-conversations" className="min-w-0 scroll-mt-12 border-b border-[var(--border)] bg-[#faf9fb] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--border)] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">{activeDefinition.label}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{filteredLeads.length} visible</p>
              </div>
              <span className="status-pill status-info">{activeDefinition.count} total</span>
            </div>
            <input
              className="mt-4 w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm outline-none placeholder:text-[#9d95a7] focus:border-[var(--primary)] focus:bg-white"
              placeholder="Search contact, phone, intent"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="max-h-[650px] overflow-auto p-2">
            {filteredLeads.length ? filteredLeads.map((lead, index) => {
              const state = getConversationState(lead);
              const latest = getLatestMessage(lead);
              const source = getLeadSourceLabel(lead);

              return (
                <button
                  key={lead.id}
                  onClick={() => {
                    setHasManualSelection(true);
                    setActiveId(lead.id);
                  }}
                  className={`relative flex w-full gap-3 rounded-md border px-3 py-3 text-left transition ${
                    activeLead.id === lead.id
                      ? "border-[#f2d9f0] bg-white shadow-[var(--shadow-card)]"
                      : "border-transparent hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <span className={`absolute bottom-3 left-0 top-3 w-1 rounded-full ${state.rail}`} />
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                      ["bg-[#b923ae]", "bg-[#1b62a5]", "bg-[#d4842f]", "bg-[#7857d9]", "bg-[#6b7280]"][index % 5]
                    }`}
                  >
                    {lead.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-[var(--text)]">{lead.name}</span>
                      <span className="text-[11px] text-[var(--text-muted)]">{lead.minutesAgo}m</span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-[var(--text-muted)]">
                      {latest?.text || "No message yet"}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${state.tone}`}>{state.label}</span>
                      <span className="rounded-full bg-[#edf1f7] px-2 py-0.5 text-[10px] font-semibold text-[#4b5d78]">{source}</span>
                      {lead.score >= 70 ? <span className="rounded-full bg-[#fff1dd] px-2 py-0.5 text-[10px] font-semibold text-[#8d4d10]">Priority</span> : null}
                    </span>
                  </span>
                </button>
              );
            }) : (
              <div className="rounded-lg border border-dashed border-black/10 bg-white p-6 text-center">
                <p className="text-sm font-semibold text-[var(--text)]">No conversations in this queue</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Try another queue or clear the search.</p>
              </div>
            )}
          </div>
        </aside>

        <main id="inbox-reply" className="flex min-h-[760px] min-w-0 scroll-mt-12 flex-col bg-[#fbfafc]">
          <div className="border-b border-[var(--border)] bg-white px-5 py-4">
            <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary-strong)]">
                  {activeLead.initials}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-[var(--text)]">{activeLead.name}</h2>
                    <span className={`status-pill ${activeState.tone}`}>{activeState.label}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{activeLead.phone} · {activeSource} · {activeState.helper}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
              <Button
                tone="surface"
                className="rounded-md px-3 py-2 text-xs"
                  onClick={() => void takeOverFromAi()}
                >
                  Human takeover
                </Button>
              <Button
                tone="surface"
                className="rounded-md px-3 py-2 text-xs"
                  onClick={() => {
                    setComposePhone(activeLead.phone ?? "");
                    setComposeMessage(draftMessage.trim());
                    setComposeResult(null);
                    setShowCompose(true);
                  }}
                >
                  Send template
                </Button>
              <Button
                tone="surface"
                className="rounded-md px-3 py-2 text-xs"
                  onClick={() => {
                    setBulkNumbers(activeLead.phone ? `${activeLead.phone}\n` : "");
                    setBulkMessage(draftMessage.trim());
                    setBulkResult(null);
                    setShowBulkSend(true);
                  }}
                >
                  Broadcast
                </Button>
              </div>
            </div>
          </div>

          <div className="border-b border-[var(--border)] bg-[var(--info-soft)] px-5 py-3">
            <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--info)]">AI suggested reply</p>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[#334155]">{aiSuggestedReply}</p>
              </div>
              <Button
                tone="surface"
                className="shrink-0 rounded-md px-3 py-2 text-xs"
                onClick={() => setDraftMessage(aiSuggestedReply)}
              >
                Use suggestion
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-auto bg-[#fbfafc] p-5">
            {timeline.map((message) => {
              const outgoing = message.from !== "guest";
              const delivery = outgoing ? getDeliveryMeta(message.status) : null;
              const hasImage = message.attachment?.kind === "image";
              const hasFile = message.attachment?.kind === "file";
              return (
                <div key={message.id} className={`flex w-full ${outgoing ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`inline-flex w-fit max-w-[min(78%,28rem)] flex-col gap-2 rounded-lg px-4 py-3 text-sm shadow-sm ring-1 ${
                      outgoing
                        ? "rounded-tr-sm bg-[var(--primary-soft)] ring-[#f2d9f0]"
                        : "rounded-tl-sm bg-white ring-[var(--border)]"
                    }`}
                  >
                    {hasImage ? (
                      <button
                        type="button"
                        className="inline-flex w-fit max-w-full overflow-hidden rounded-xl border border-black/5 text-left transition hover:scale-[1.01]"
                        onClick={() =>
                          setPreviewImage({
                            url: message.attachment!.url,
                            name: message.attachment!.name
                          })
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={message.attachment!.url}
                          alt={message.attachment!.name}
                          className="block h-auto max-h-44 w-auto max-w-full object-contain sm:max-h-52"
                        />
                      </button>
                    ) : null}

                    {hasFile ? (
                      <a
                        href={message.attachment!.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-fit max-w-full items-center justify-between gap-3 rounded-xl border border-[#3f2aa8]/10 bg-white px-4 py-3 shadow-sm transition hover:shadow-md"
                      >
                        <span className="truncate font-semibold">{message.attachment!.name}</span>
                        <span className="text-xs text-[var(--primary)]">Open</span>
                      </a>
                    ) : null}

                    {message.text ? <p className="whitespace-pre-wrap break-words text-[var(--text)]">{message.text}</p> : null}

                    <div className={`flex items-center gap-1.5 ${outgoing ? "justify-end" : ""}`}>
                      <span className={`text-[10px] text-[#64748b] ${outgoing ? "text-right" : ""}`}>{message.time}</span>
                      {delivery ? (
                        <span className="text-[10px] font-bold text-[var(--success)]">{delivery.ticks}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
            {activeLead.transcript.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-muted)]">
                No replies yet. Send the first channel-safe reply to begin this conversation thread.
              </div>
            ) : null}
          </div>

          <div className="border-t border-[var(--border)] bg-white px-4 py-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setSelectedAttachment(nextFile);
              }}
            />
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                { label: "Ask for audit details", text: "Please share your hotel name, website, city, and current booking channels so we can prepare the AI audit." },
                { label: "Trial intake", text: "Please share your business name, website, WhatsApp number, and the first workflow you want to improve during the trial." },
                { label: "Book callback", text: "Please share a preferred time for a short callback. Our team will help map the right workflow and next step." },
                { label: "Opt-out", text: "No problem. We will not send further campaign messages. You can message us anytime if you need help later." }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:bg-white hover:text-[var(--text)]"
                  onClick={() => setDraftMessage(item.text)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-2">
              <Button
                tone="ghost"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={activeIsWebsite}
                className="h-9 w-9 rounded-md px-0 text-base"
                aria-label="Attach file"
              >
                +
              </Button>
              <input
                ref={messageInputRef}
                className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[#94a3b8]"
                placeholder="Type a message..."
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendTestMessage();
                  }
                }}
              />
              <Button
                onClick={() => void sendTestMessage()}
                disabled={(!draftMessage.trim() && !selectedAttachment) || !activeFreeTextAllowed || isSending}
                className="h-10 rounded-md bg-[var(--primary-strong)] px-4 text-white hover:bg-[var(--primary)]"
                aria-label="Send message"
              >
                Send
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
                <Badge tone={integration.aiModeEnabled ? "primary" : "neutral"}>
                  {integration.aiModeEnabled ? "AI Mode On" : "AI Mode Off"}
                </Badge>
                <Badge tone="neutral">English only</Badge>
                <Badge tone="neutral">{integration.provider}</Badge>
                {selectedAttachment ? <Badge tone="secondary">Attached: {selectedAttachment.name}</Badge> : null}
              </div>
              <span className="text-xs text-[#94a3b8]">Enter to send</span>
            </div>
            {!activeFreeTextAllowed ? (
              <p className="mt-2 text-xs font-semibold text-[#b45309]">
                The 24-hour reply window is closed. Use New Message and select an approved template.
              </p>
            ) : null}
            {activeIsWebsite ? (
              <p className="mt-2 text-xs font-semibold text-[#1559b7]">
                Website channel selected. This reply is stored in AiFrogi and will never be sent through WhatsApp.
              </p>
            ) : null}
            {selectedAttachment ? (
              <div className="mt-2 flex items-center gap-3 text-sm text-[#64748b]">
                <span className="truncate">{selectedAttachment.name}</span>
                <button
                  type="button"
                  className="font-semibold text-[#1559b7]"
                  onClick={() => {
                    setSelectedAttachment(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            ) : null}
            {sendResult ? <p className="mt-2 text-sm font-semibold text-[#079455]">{sendResult}</p> : null}
          </div>
        </main>

        <aside id="inbox-profile" className="inbox-v2-rail min-w-0 scroll-mt-12 border-t border-[var(--border)] bg-white lg:col-span-3">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Lead intelligence</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Profile, source, and next action</p>
            </div>
            <span className={`h-2.5 w-2.5 rounded-full ${activeState.rail}`} />
          </div>
          <div className="grid gap-5 p-5">
            <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <p className="text-sm font-semibold text-[var(--text)]">Recommended next action</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                {activeState.label === "Template required"
                  ? "Use an approved template to reopen the conversation. Free text is blocked until the customer replies again."
                  : activeState.label === "Waiting reply"
                    ? "Reply now while the WhatsApp service window is open."
                    : activeState.label === "Human needed"
                      ? "Review the AI context and continue manually."
                      : "No urgent reply is pending. Add notes or prepare the next follow-up."}
              </p>
            </section>

            <section className="space-y-3">
              {[
                { label: "Name", value: activeLead.name },
                { label: "Phone", value: activeLead.phone },
                { label: "Source", value: activeSource },
                { label: "Intent", value: activeLead.intent || "Needs discovery" },
                { label: "Website / business", value: activeLead.stay || "Business details pending" },
                { label: "Last inbound", value: latestInbound?.time ?? "No customer reply yet" }
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-2 last:border-b-0">
                  <p className="text-sm text-[var(--text-muted)]">{item.label}</p>
                  <p className="max-w-[12rem] text-right text-sm font-semibold text-[var(--text)]">{item.value}</p>
                </div>
              ))}
            </section>

            <label className="block">
              <span className="text-sm font-semibold text-[var(--text)]">Lead status</span>
              <select className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--primary)]" defaultValue={activeLead.stage}>
                <option>{activeLead.stage}</option>
                <option>New Enquiry</option>
                <option>Follow-up</option>
                <option>Won</option>
                <option>Lost</option>
              </select>
            </label>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--text)]">Tags</p>
                <button type="button" className="text-sm font-bold text-[var(--primary-strong)]">
                  +
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(activeLead.tags.length ? activeLead.tags : ["WhatsApp", activeLead.intent]).slice(0, 4).map((tag) => (
                  <span key={tag} className="rounded-full bg-[var(--secondary-soft)] px-3 py-1 text-xs font-semibold text-[var(--secondary)]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <p className="text-sm font-semibold text-[var(--text)]">Lead matrix</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {leadMatrix.map((item) => (
                  <div key={item.label} className="rounded-md bg-white px-3 py-2 shadow-sm">
                    <p className="truncate text-xs text-[var(--text-muted)]">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <LeadOperationsPanel leadId={activeLead.id} />

            <div className="space-y-2">
              <Button
                className="w-full justify-start rounded-md bg-[var(--primary-strong)] text-white hover:bg-[var(--primary)]"
                onClick={() => {
                  setComposePhone(activeLead.phone ?? "");
                  setComposeMessage(draftMessage.trim());
                  setComposeResult(null);
                  setShowCompose(true);
                }}
              >
                New Message
              </Button>
              <Button tone="surface" className="w-full justify-start rounded-md" onClick={() => openQuickAction("photos")}>
                Send audit samples
              </Button>
              <Button
                tone="surface"
                className="w-full justify-start rounded-md"
                onClick={() => {
                  setBulkNumbers(activeLead.phone ? `${activeLead.phone}\n` : "");
                  setBulkMessage(draftMessage.trim());
                  setBulkResult(null);
                  setShowBulkSend(true);
                }}
              >
                Bulk Send
              </Button>
              <Button tone="surface" className="w-full justify-start rounded-md" onClick={() => openQuickAction("payment")}>
                Send payment link
              </Button>
              <Button tone="surface" className="w-full justify-start rounded-md" onClick={() => openQuickAction("quote")}>
                Send proposal PDF
              </Button>
              <Button tone="danger" className="w-full justify-start rounded-md" onClick={() => void takeOverFromAi()}>
                Human takeover
              </Button>
            </div>

            <Link
              href={`/api/leads/${activeLead.id}`}
              target="_blank"
              className="block rounded-md border border-[var(--border)] bg-white px-4 py-3 text-center text-sm font-semibold text-[var(--primary-strong)]"
            >
              Check full record
            </Link>
          </div>
        </aside>
      </div>
      {previewImage ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-h-[90vh] w-auto max-w-[92vw] overflow-hidden rounded-lg bg-white p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4 px-2">
              <p className="truncate text-sm font-semibold">{previewImage.name}</p>
              <button
                type="button"
                className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold"
                onClick={() => setPreviewImage(null)}
              >
                Close
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="max-h-[78vh] w-auto max-w-[88vw] rounded-md object-contain"
            />
          </div>
        </div>
      ) : null}

      {quickActionKind ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-2xl p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {quickActionKind === "photos"
                    ? "Send Audit Samples"
                    : quickActionKind === "payment"
                      ? "Send Payment Link"
                      : "Send Proposal PDF"}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Pick an approved asset for {activeLead.name}, then AiFrogi will log the share and send it on WhatsApp.
                </p>
              </div>
              <Button tone="ghost" onClick={() => setQuickActionKind(null)}>
                Close
              </Button>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-[var(--text-muted)]">Select asset</span>
                <select
                  className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 outline-none focus:border-[var(--primary)] focus:bg-white"
                  value={selectedAssetId}
                  onChange={(event) => setSelectedAssetId(event.target.value)}
                >
                  {filteredAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.title} · {asset.type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-[var(--text-muted)]">Message note</span>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 outline-none focus:border-[var(--primary)] focus:bg-white"
                  value={shareNote}
                  onChange={(event) => setShareNote(event.target.value)}
                  placeholder={
                    quickActionKind === "payment"
                    ? "Example: Please use this secure payment link to confirm your project."
                      : quickActionKind === "quote"
                        ? "Example: Sharing the proposal PDF for your review."
                        : "Example: Sharing audit samples and relevant work examples for review."
                  }
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button tone="surface" onClick={() => setQuickActionKind(null)}>
                Cancel
              </Button>
              <Button onClick={() => void submitQuickActionAsset()} disabled={!selectedAssetId || isSending}>
                {isSending ? "Sending..." : "Send on WhatsApp"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
      {showCompose ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-xl p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">New WhatsApp Message</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Send a direct message to a lead or client. Use country code, for example +919828981000.
                </p>
              </div>
              <Button tone="ghost" onClick={() => setShowCompose(false)}>
                Close
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="rounded-md border border-[#fbbf24]/20 bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
                {composeMode === "template"
                  ? "An approved template can start or reopen a conversation outside the 24-hour reply window."
                  : !composeFreeTextAllowed
                    ? "This contact has no open 24-hour reply window. Select Approved template to start the conversation."
                    : "Free text is available because this contact replied within the last 24 hours."}
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-md bg-[var(--surface-soft)] p-1">
                {[
                  { label: "Free text", value: "text" as const },
                  { label: "Approved template", value: "template" as const }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                      composeMode === item.value ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--text-muted)]"
                    }`}
                    onClick={() => setComposeMode(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Phone number
                </span>
                <input
                  className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:bg-white"
                  value={composePhone}
                  onChange={(event) => setComposePhone(event.target.value)}
                  placeholder="+919828981000"
                />
              </label>

              {composeMode === "text" ? (
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Message
                  </span>
                  <textarea
                    className="mt-2 min-h-40 w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:bg-white"
                    value={composeMessage}
                    onChange={(event) => setComposeMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                        event.preventDefault();
                        void submitComposeMessage();
                      }
                    }}
                    placeholder="Type message to send..."
                  />
                  <p className="mt-2 text-xs text-[var(--text-muted)]">Press Cmd/Ctrl + Enter to send from this window.</p>
                </label>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      Template name
                    </span>
                    <input
                      className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:bg-white"
                      value={composeTemplateName}
                      onChange={(event) => setComposeTemplateName(event.target.value)}
                      placeholder="hello_world"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      Language
                    </span>
                    <input
                      className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:bg-white"
                      value={composeTemplateLanguage}
                      onChange={(event) => setComposeTemplateLanguage(event.target.value)}
                      placeholder="en_US"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      Template variables
                    </span>
                    <textarea
                      className="mt-2 min-h-24 w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:bg-white"
                      value={composeTemplateVariables}
                      onChange={(event) => setComposeTemplateVariables(event.target.value)}
                      placeholder="Optional: one variable per line, only if the approved template requires it"
                    />
                  </label>
                </div>
              )}
            </div>

            {composeResult ? (
              <p className="mt-4 rounded-md bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--secondary)]">
                {composeResult}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <Button tone="surface" onClick={() => setShowCompose(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void submitComposeMessage()}
                disabled={
                  !composePhone.trim() ||
                  (composeMode === "text" ? !composeMessage.trim() : !composeTemplateName.trim()) ||
                  (composeMode === "text" && !composeFreeTextAllowed) ||
                  isSending
                }
              >
                {isSending ? "Sending..." : composeMode === "template" ? "Send Template" : "Send Message"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
      {showBulkSend ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-3xl p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Bulk WhatsApp Send</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Send one approved message to up to 20 numbers. Use one number per line or comma-separated.
                </p>
              </div>
              <Button tone="ghost" onClick={() => setShowBulkSend(false)}>
                Close
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <label className="block">
                <span className="text-xs font-semibold text-[var(--text-muted)]">
                  Numbers
                </span>
                <textarea
                  className="mt-2 min-h-52 w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:bg-white"
                  value={bulkNumbers}
                  onChange={(event) => setBulkNumbers(event.target.value)}
                  placeholder={"+919828981000\n+919325702641\n+91XXXXXXXXXX"}
                />
                <p className="mt-2 text-xs text-[var(--text-muted)]">Maximum 20 unique numbers per batch.</p>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-[var(--text-muted)]">
                  Message
                </span>
                <textarea
                  className="mt-2 min-h-52 w-full rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:bg-white"
                  value={bulkMessage}
                  onChange={(event) => setBulkMessage(event.target.value)}
                  placeholder="Type the WhatsApp message to send..."
                />
              </label>
            </div>

            {bulkResult ? (
              <div className="mt-5 rounded-lg border border-[var(--border)] bg-white p-4">
                <div className="flex flex-wrap gap-2 text-sm font-semibold">
                  <Badge tone="neutral">Requested: {bulkResult.summary.requested}</Badge>
                  <Badge tone="secondary">Sent: {bulkResult.summary.sent}</Badge>
                  <Badge tone={bulkResult.summary.failed ? "error" : "neutral"}>Failed: {bulkResult.summary.failed}</Badge>
                </div>
                <div className="mt-4 max-h-52 space-y-2 overflow-auto text-sm">
                  {bulkResult.results.map((item) => (
                    <div key={item.to} className="flex items-start justify-between gap-4 rounded-md bg-[var(--surface-soft)] px-3 py-2">
                      <span className="font-semibold">{item.to}</span>
                      <span className={item.ok ? "text-[var(--secondary)]" : "text-[var(--error)]"}>
                        {item.ok ? item.deliveryStatus ?? "sent" : item.error ?? "failed"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <Button tone="surface" onClick={() => setShowBulkSend(false)}>
                Cancel
              </Button>
              <Button onClick={() => void submitBulkSend()} disabled={!bulkNumbers.trim() || !bulkMessage.trim() || isSending}>
                {isSending ? "Sending..." : "Send Bulk"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

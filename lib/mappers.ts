import type { Lead } from "@/types";
import type {
  Lead as PrismaLead,
  LeadLanguage,
  LeadMessage,
  LeadStage,
  LeadTag,
  MessageSender
} from "../generated/prisma/client";

function mapStage(stage: LeadStage) {
  return stage
    .toLowerCase()
    .split("_")
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapLanguage(language: LeadLanguage): "HI" | "EN" {
  return language === "HI" ? "HI" : "EN";
}

function mapSender(sender: MessageSender): "guest" | "agent" | "ai" {
  if (sender === "AI") return "ai";
  if (sender === "AGENT") return "agent";
  return "guest";
}

function parseAttachmentBody(body: string) {
  const match = body.match(/^\[\[attachment\|(image|file)\|([^|]+)\|([^\]]+)\]\](?:\n([\s\S]*))?$/);
  if (!match) {
    return {
      text: body,
      attachment: null
    };
  }

  return {
    text: match[4] ?? "",
    attachment: {
      kind: match[1] as "image" | "file",
      url: match[2]
        .replace("https://lead.hotelradar.in/uploads/whatsapp/", "https://lead.hotelradar.in/api/media/uploads/whatsapp/")
        .replace("https://lead.hotelradar.in/api/media/whatsapp/", "https://lead.hotelradar.in/api/media/uploads/whatsapp/"),
      name: match[3]
    }
  };
}

export function mapLeadRecord(
  lead: PrismaLead & {
    property?: {
      id: string;
      slug: string;
    };
    tags: LeadTag[];
    messages: LeadMessage[];
  }
): Lead {
  const now = Date.now();
  const updatedAtLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(lead.updatedAt);

  return {
    id: lead.id,
    propertyId: lead.property?.id,
    propertySlug: lead.property?.slug,
    name: lead.name,
    initials: lead.initials,
    score: lead.score,
    isHighPriority: lead.isHighPriority,
    source: lead.source,
    stage: mapStage(lead.stage),
    minutesAgo: Math.max(1, Math.round((now - lead.lastActivityAt.getTime()) / 60000)),
    language: mapLanguage(lead.language),
    intent: lead.intent,
    stay: lead.stayLabel,
    party: lead.partyLabel,
    budget: lead.budgetLabel,
    phone: lead.phone,
    updatedAtLabel,
    updatedAtIso: lead.updatedAt.toISOString(),
    tags: lead.tags.map((tag: LeadTag) => tag.value),
    transcript: lead.messages
      .sort((a: LeadMessage, b: LeadMessage) => a.sentAt.getTime() - b.sentAt.getTime())
      .map((message: LeadMessage) => ({
        ...(() => {
          const parsed = parseAttachmentBody(message.body);
          return {
            text: parsed.text,
            attachment: parsed.attachment
          };
        })(),
        id: message.id,
        from: mapSender(message.sender),
        status: message.deliveryStatus,
        sentAtIso: message.sentAt.toISOString(),
        time: new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }).format(message.sentAt)
      }))
  };
}

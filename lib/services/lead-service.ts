import { isDatabaseAccessError } from "@/lib/errors";
import { DEFAULT_PROPERTY_SLUG } from "@/lib/env";
import { normalizeLeadInput, validateLeadInput } from "@/lib/lead-payload";
import { mapLeadRecord } from "@/lib/mappers";
import {
  appendMessageToLead,
  createLeadForProperty,
  getLeadByExternalMessageId,
  getLeadById,
  getLeadByPhoneForProperty,
  getLeadsForProperty,
  updateLeadMessageStatusByExternalId,
  updateLeadById
} from "@/lib/repositories/lead-repository";
import { getPropertyBySlug } from "@/lib/repositories/property-repository";
import type { Lead, LeadInput } from "@/types";

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "LD";
}

function normalizePhone(phone: string) {
  return phone.replace(/^whatsapp:/, "").trim();
}

export async function loadLeads(propertySlug = DEFAULT_PROPERTY_SLUG): Promise<Lead[]> {
  return loadLeadsWithOptions(propertySlug);
}

export async function loadLeadsWithOptions(
  propertySlug = DEFAULT_PROPERTY_SLUG,
  options?: { fallbackToMock?: boolean }
): Promise<Lead[]> {
  let records = null;

  try {
    records = await getLeadsForProperty(propertySlug);
  } catch (error) {
    if (!isDatabaseAccessError(error)) {
      throw error;
    }
  }

  if (!records) {
    return [];
  }

  return records.map(mapLeadRecord);
}

export async function loadLead(id: string): Promise<Lead | null> {
  return loadLeadWithOptions(id);
}

export async function loadLeadWithOptions(id: string, options?: { fallbackToMock?: boolean }): Promise<Lead | null> {
  let record = null;

  try {
    record = await getLeadById(id);
  } catch (error) {
    if (!isDatabaseAccessError(error)) {
      throw error;
    }
  }

  if (!record) {
    return null;
  }

  return mapLeadRecord(record);
}

export async function createLead(input: LeadInput, propertySlug = DEFAULT_PROPERTY_SLUG) {
  const validationError = validateLeadInput(input);
  if (validationError) {
    return { error: validationError, lead: null as Lead | null, status: 400 };
  }

  try {
    const property = await getPropertyBySlug(propertySlug);
    if (!property) {
      return { error: "Property not found or database unavailable", lead: null as Lead | null, status: 503 };
    }

    const normalized = normalizeLeadInput(input);
    const created = await createLeadForProperty(property.id, normalized);

    if (!created) {
      return { error: "Database unavailable", lead: null as Lead | null, status: 503 };
    }

    return { error: null, lead: mapLeadRecord(created), status: 201 };
  } catch (error) {
    if (isDatabaseAccessError(error)) {
      return { error: "Database unavailable", lead: null as Lead | null, status: 503 };
    }
    throw error;
  }
}

export async function updateLead(id: string, input: LeadInput) {
  const validationError = validateLeadInput(input);
  if (validationError) {
    return { error: validationError, lead: null as Lead | null, status: 400 };
  }

  try {
    const normalized = normalizeLeadInput(input);
    const updated = await updateLeadById(id, normalized);

    if (!updated) {
      return { error: "Database unavailable", lead: null as Lead | null, status: 503 };
    }

    return { error: null, lead: mapLeadRecord(updated), status: 200 };
  } catch (error) {
    if (isDatabaseAccessError(error)) {
      return { error: "Database unavailable", lead: null as Lead | null, status: 503 };
    }
    throw error;
  }
}

export async function appendLeadMessage(
  leadId: string,
  input: {
    sender: "GUEST" | "AGENT" | "AI";
    body: string;
    sentAt?: Date;
    externalMessageId?: string;
    deliveryStatus?: string;
  }
) {
  try {
    const updated = await appendMessageToLead(leadId, {
      sender: input.sender,
      body: input.body,
      sentAt: input.sentAt ?? new Date(),
      externalMessageId: input.externalMessageId,
      deliveryStatus: input.deliveryStatus
    });

    if (!updated) {
      return { error: "Database unavailable", lead: null as Lead | null, status: 503 };
    }

    return { error: null, lead: mapLeadRecord(updated), status: 200 };
  } catch (error) {
    if (isDatabaseAccessError(error)) {
      return { error: "Database unavailable", lead: null as Lead | null, status: 503 };
    }
    throw error;
  }
}

export async function updateLeadMessageStatus(
  externalMessageId: string,
  input: {
    deliveryStatus: string;
    statusUpdatedAt?: Date;
  }
) {
  try {
    const updated = await updateLeadMessageStatusByExternalId(externalMessageId, {
      deliveryStatus: input.deliveryStatus,
      statusUpdatedAt: input.statusUpdatedAt ?? new Date()
    });

    if (!updated) {
      return { error: "Message not found or database unavailable", lead: null as Lead | null, status: 404 };
    }

    return { error: null, lead: mapLeadRecord(updated), status: 200 };
  } catch (error) {
    if (isDatabaseAccessError(error)) {
      return { error: "Database unavailable", lead: null as Lead | null, status: 503 };
    }
    throw error;
  }
}

export async function captureIncomingWhatsAppMessage(input: {
  from: string;
  body: string;
  externalMessageId?: string;
  aiReply?: string;
  profileName?: string;
  propertySlug?: string;
  sentAt?: Date;
}) {
  const propertySlug = input.propertySlug?.trim() || DEFAULT_PROPERTY_SLUG;

  try {
    const property = await getPropertyBySlug(propertySlug);
    if (!property) {
      return { error: "Property not found or database unavailable", lead: null as Lead | null, status: 503, created: false, duplicate: false };
    }

    if (input.externalMessageId) {
      const existingLead = await getLeadByExternalMessageId(input.externalMessageId);
      if (existingLead) {
        return { error: null, lead: mapLeadRecord(existingLead), status: 200, created: false, duplicate: true };
      }
    }

    const normalizedPhone = normalizePhone(input.from);
    let lead = await getLeadByPhoneForProperty(property.id, normalizedPhone);
    let created = false;

    if (!lead) {
      const leadName = input.profileName?.trim() || normalizedPhone;
      lead = await createLeadForProperty(property.id, {
        name: leadName,
        initials: buildInitials(leadName),
        score: 60,
        source: "WhatsApp",
        stage: "NEW",
        language: "EN",
        intent: "Inbound WhatsApp inquiry",
        stayLabel: "Business details pending",
        partyLabel: "Service requirement pending",
        budgetLabel: "Budget not shared",
        phone: normalizedPhone,
        tags: ["Inbound WhatsApp"],
        isHighPriority: false
      });
      created = true;
    }

    if (!lead) {
      return { error: "Could not create or load lead", lead: null as Lead | null, status: 503, created: false, duplicate: false };
    }

    const guestMessage = await appendMessageToLead(lead.id, {
      sender: "GUEST",
      body: input.body,
      sentAt: input.sentAt ?? new Date(),
      externalMessageId: input.externalMessageId
    });

    if (!guestMessage) {
      return { error: "Database unavailable", lead: null as Lead | null, status: 503, created: false, duplicate: false };
    }

    const aiReply = String(input.aiReply || "").trim();
    if (!aiReply) {
      return { error: null, lead: mapLeadRecord(guestMessage), status: 200, created, duplicate: false };
    }

    const aiMessage = await appendMessageToLead(lead.id, {
      sender: "AI",
      body: aiReply,
      sentAt: input.sentAt ?? new Date()
    });

    if (!aiMessage) {
      return { error: "Database unavailable", lead: null as Lead | null, status: 503, created: false, duplicate: false };
    }

    return { error: null, lead: mapLeadRecord(aiMessage), status: 200, created, duplicate: false };
  } catch (error) {
    if (isDatabaseAccessError(error)) {
      return { error: "Database unavailable", lead: null as Lead | null, status: 503, created: false, duplicate: false };
    }
    throw error;
  }
}

export async function captureIncomingAiBotMessage(input: {
  phone?: string;
  mobile?: string;
  message?: string;
  guestMessage?: string;
  aiReply?: string;
  profileName?: string;
  propertySlug?: string;
  conversationId?: string;
  sentAt?: Date;
}) {
  const propertySlug = input.propertySlug?.trim() || DEFAULT_PROPERTY_SLUG;
  const messageBody = (input.message ?? input.guestMessage ?? "").trim();
  const phoneSeed =
    input.phone?.trim() ||
    input.mobile?.trim() ||
    input.conversationId?.trim() ||
    "";

  try {
    const property = await getPropertyBySlug(propertySlug);
    if (!property) {
      return { error: "Property not found or database unavailable", lead: null as Lead | null, status: 503, created: false };
    }

    const normalizedPhone = normalizePhone(phoneSeed);
    const leadPhone = normalizedPhone || input.conversationId?.trim() || `ai-${Date.now()}`;
    let lead = await getLeadByPhoneForProperty(property.id, normalizedPhone);
    let created = false;

    if (!lead) {
      const leadName = input.profileName?.trim() || normalizedPhone || input.conversationId?.trim() || "Website Guest";
      lead = await createLeadForProperty(property.id, {
        name: leadName,
        initials: buildInitials(leadName),
        score: 62,
        source: "AI Bot",
        stage: "NEW",
        language: "EN",
        intent: "Inbound AI inquiry",
        stayLabel: "Business details pending",
        partyLabel: "Service requirement pending",
        budgetLabel: "Budget not shared",
        phone: leadPhone,
        tags: ["AI Bot", "Website Bot"],
        isHighPriority: false
      });
      created = true;
    }

    if (!lead) {
      return { error: "Could not create or load lead", lead: null as Lead | null, status: 503, created: false };
    }

    let updated = await appendMessageToLead(lead.id, {
      sender: "GUEST",
      body: messageBody || "AI Bot inbound message",
      sentAt: input.sentAt ?? new Date()
    });

    if (!updated) {
      return { error: "Database unavailable", lead: null as Lead | null, status: 503, created: false };
    }

    if (input.aiReply?.trim()) {
      const replied = await appendMessageToLead(lead.id, {
        sender: "AI",
        body: input.aiReply.trim(),
        sentAt: input.sentAt ?? new Date()
      });
      if (replied) {
        updated = replied;
      }
    }

    return { error: null, lead: mapLeadRecord(updated), status: 200, created };
  } catch (error) {
    if (isDatabaseAccessError(error)) {
      return { error: "Database unavailable", lead: null as Lead | null, status: 503, created: false };
    }
    throw error;
  }
}

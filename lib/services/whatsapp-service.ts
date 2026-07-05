import { isDatabaseAccessError } from "@/lib/errors";
import { DEFAULT_PROPERTY_SLUG } from "@/lib/env";
import { createHmac } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  appendLeadMessage,
  captureIncomingWhatsAppMessage,
  createLead,
  loadLeadsWithOptions,
  updateLead,
  updateLeadMessageStatus
} from "@/lib/services/lead-service";
import { normalizeWhatsAppIntegrationInput, validateWhatsAppIntegrationInput } from "@/lib/whatsapp-payload";
import { mapWhatsAppIntegrationRecord } from "@/lib/whatsapp-mappers";
import { buildWhatsAppFirstReply, classifyWhatsAppAgencyInquiry, shouldSendWhatsAppAutoReply } from "@/lib/services/whatsapp-auto-reply";
import { getWhatsAppBotConfigurationForProperty } from "@/lib/repositories/bot-configuration-repository";
import { buildWhatsAppBotMenuOptions, type WhatsAppBotConfiguration } from "@/lib/whatsapp-bot-config";
import { buildWebsiteKnowledgeAnswer } from "@/lib/services/website-knowledge-service";
import { getLeadById, getLeadByPhoneForProperty } from "@/lib/repositories/lead-repository";
import { getPropertyBySlug } from "@/lib/repositories/property-repository";
import { updateCampaignDeliveryStatus } from "@/lib/repositories/campaign-repository";
import {
  getWhatsAppIntegrationForProperty,
  getWhatsAppWorkspaceByPhoneNumberId,
  listWhatsAppVerifyTokens,
  upsertWhatsAppIntegrationForProperty
} from "@/lib/repositories/whatsapp-repository";
import type { WhatsAppIntegration, WhatsAppIntegrationInput } from "@/types";

const emptyIntegration: WhatsAppIntegration = {
  id: "",
  provider: "META_CLOUD_API",
  businessAccountId: null,
  phoneNumberId: null,
  displayPhoneNumber: null,
  webhookVerifyToken: null,
  status: "NOT_CONFIGURED",
  approvedBy: null,
  approvedAtLabel: null,
  lastValidatedAtLabel: null,
  notes: null,
  aiModeEnabled: false
};

type TwilioConfig = {
  accountSid: string;
  authToken: string;
  from: string;
  defaultContentSid?: string;
};

type MetaConfig = {
  phoneNumberId: string;
  businessAccountId?: string;
  accessToken: string;
  verifyToken: string;
  displayPhoneNumber?: string;
};

type WhatsAppAttachmentInput = {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
};

type StoredAttachment = {
  kind: "image" | "file";
  url: string;
  name: string;
};

type WhatsAppSendResult = {
  provider: string;
  to: string;
  from: string;
  status: string;
  sid: string | null;
  note: string;
  messagesToLog: Array<{
    body: string;
    sid?: string | null;
    status?: string | null;
  }>;
};

type UnifiedOperatorMessageResult = {
  ok?: boolean;
  hotelId?: string;
  conversationId?: string;
  userPhone?: string;
  operatorId?: string;
  deliveryStatus?: string;
  externalMessageId?: string;
  sendError?: string;
  error?: string;
};

function getUnifiedOperatorMessageConfig() {
  return {
    baseUrl:
      process.env.HOTELRADAR_AI_RUNTIME_URL?.trim() ||
      process.env.AI_RUNTIME_BASE_URL?.trim() ||
      "https://gpt.hotelradar.in",
    token:
      process.env.AI_BOT_AGENT_REPLY_TOKEN?.trim() ||
      process.env.LEADOS_AI_BOT_WEBHOOK_TOKEN?.trim() ||
      ""
  };
}

function getUnifiedRuntimeHotelId(propertySlug = "", propertyId = "") {
  const explicitRuntimeHotelId =
    process.env.LEADOS_RUNTIME_HOTEL_ID?.trim() || process.env.HOTELRADAR_RUNTIME_HOTEL_ID?.trim();
  if (explicitRuntimeHotelId && propertySlug === "hotelradar") {
    return explicitRuntimeHotelId;
  }

  if (propertySlug === "hotelradar") {
    return "2606478f-3b0d-47bd-96c2-848c1c114298";
  }

  return propertyId;
}

type TwilioMessageListItem = {
  body?: string | null;
  date_created?: string | null;
  direction?: string | null;
  error_code?: number | null;
  from?: string | null;
  sid?: string | null;
  status?: string | null;
  to?: string | null;
};

function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    return null;
  }

  return {
    accountSid,
    authToken,
    from,
    defaultContentSid: process.env.TWILIO_CONTENT_SID
  };
}

function getMetaConfig(): MetaConfig | null {
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return null;
  }

  return {
    phoneNumberId,
    businessAccountId: process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID,
    accessToken,
    verifyToken: process.env.META_WHATSAPP_VERIFY_TOKEN ?? "leados-meta-verify-2026",
    displayPhoneNumber: process.env.META_WHATSAPP_DISPLAY_PHONE_NUMBER
  };
}

function getMetaGraphVersion() {
  return process.env.META_GRAPH_API_VERSION?.trim() || "v25.0";
}

async function getResolvedMetaConfig(propertySlug = DEFAULT_PROPERTY_SLUG): Promise<MetaConfig | null> {
  const [record, envConfig] = await Promise.all([getWhatsAppIntegrationForProperty(propertySlug), Promise.resolve(getMetaConfig())]);

  const recordIsMeta = record?.provider === "META_CLOUD_API";
  if (recordIsMeta) {
    if (!record.phoneNumberId || !record.accessToken) {
      return null;
    }

    return {
      phoneNumberId: record.phoneNumberId,
      businessAccountId: record.businessAccountId ?? undefined,
      accessToken: record.accessToken,
      verifyToken: record.webhookVerifyToken ?? `leados-${propertySlug}-verify`,
      displayPhoneNumber: record.displayPhoneNumber ?? undefined
    };
  }

  return envConfig;
}

function normalizeWhatsAppNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("whatsapp:") ? trimmed : `whatsapp:${trimmed}`;
}

function normalizeMetaRecipient(value: string) {
  const digits = String(value || "")
    .replace(/^whatsapp:/, "")
    .replace(/[^\d]/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
}

async function sendOperatorMessageViaUnifiedRuntime(input: {
  to: string;
  message: string;
  propertyId?: string;
  propertySlug?: string;
  operatorId?: string;
  conversationId?: string;
}) {
  const config = getUnifiedOperatorMessageConfig();
  const normalizedPhone = normalizeMetaRecipient(input.to);
  const propertyId = String(input.propertyId || "").trim();
  const propertySlug = String(input.propertySlug || "").trim();
  const runtimeHotelId = getUnifiedRuntimeHotelId(propertySlug, propertyId);

  if (!normalizedPhone) {
    return {
      error: "A valid WhatsApp mobile number is required",
      result: null as UnifiedOperatorMessageResult | null,
      status: 400
    };
  }

  let response: Response;
  let payload: UnifiedOperatorMessageResult | null = null;

  try {
    response = await fetch(`${config.baseUrl.replace(/\/+$/, "")}/api/internal/whatsapp/operator-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {})
      },
      body: JSON.stringify({
        hotel_id: runtimeHotelId,
        hotelId: runtimeHotelId,
        propertySlug,
        user_phone: normalizedPhone,
        message: input.message,
        operator_id: input.operatorId ?? "lead-os-operator",
        conversationId: input.conversationId ?? ""
      }),
      cache: "no-store"
    });

    payload = (await response.json().catch(() => null)) as UnifiedOperatorMessageResult | null;
  } catch (error) {
    console.error("Unified operator message request failed", {
      error: error instanceof Error ? error.message : "unknown error",
      propertyId: input.propertyId ?? "",
      propertySlug,
      userPhone: normalizedPhone
    });
    return {
      error: "Could not reach the unified operator message runtime",
      result: null as UnifiedOperatorMessageResult | null,
      status: 502
    };
  }

  if (!response.ok || !payload?.ok) {
    console.error("Unified operator message was rejected", {
      status: response.status,
      propertyId: input.propertyId ?? "",
      propertySlug,
      userPhone: normalizedPhone,
      payload
    });
    return {
      error: payload?.error ?? payload?.sendError ?? "Could not send the operator message through the unified runtime",
      result: null as UnifiedOperatorMessageResult | null,
      status: response.status || 502
    };
  }

  return {
    error: null,
    result: payload,
    status: 200
  };
}

function isMetaTokenExpiredMessage(message?: string | null) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("session has expired") ||
    normalized.includes("error validating access token") ||
    normalized.includes("invalid oauth access token") ||
    normalized.includes("token has expired") ||
    normalized.includes("token expired")
  );
}

function isMetaTokenExpiredError(error?: { message?: string | null; code?: number | null; error_subcode?: number | null } | null) {
  if (!error) return false;
  if (error.code === 190 || error.error_subcode === 463) {
    return true;
  }
  return isMetaTokenExpiredMessage(error.message);
}

function formatMetaAuthError(error?: { message?: string | null; code?: number | null; error_subcode?: number | null } | null) {
  if (isMetaTokenExpiredError(error)) {
    return "Meta access token expired. Paste a fresh system-user token in Settings > WhatsApp, then save and retry.";
  }
  return error?.message ?? "Meta rejected the WhatsApp message";
}

async function sendTwilioMessage(input: {
  to: string;
  message: string;
  contentSid?: string;
  contentVariables?: Record<string, string>;
}) {
  const config = getTwilioConfig();

  if (!config) {
    return {
      error: "Twilio credentials are missing from environment configuration",
      result: null,
      status: 503
    };
  }

  const params = new URLSearchParams();
  params.set("From", config.from);
  params.set("To", normalizeWhatsAppNumber(input.to));

  const contentSid = input.contentSid ?? config.defaultContentSid;
  if (contentSid) {
    params.set("ContentSid", contentSid);
    params.set("ContentVariables", JSON.stringify(input.contentVariables ?? { 1: "12/1", 2: "3pm" }));
  } else {
    params.set("Body", input.message);
  }

  const basicAuth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    }
  );

  const payload = (await response.json()) as
    | {
        sid?: string;
        status?: string;
        to?: string;
        from?: string;
        error_message?: string | null;
        message?: string;
      }
    | {
        code?: number;
        message?: string;
        more_info?: string;
      };

  if (!response.ok) {
    return {
      error:
        ("message" in payload && payload.message) ||
        ("error_message" in payload && payload.error_message) ||
        "Twilio rejected the WhatsApp message",
      result: null,
      status: response.status
    };
  }

  return {
    error: null,
    result: {
      provider: "TWILIO_WHATSAPP",
      to: ("to" in payload && payload.to) || normalizeWhatsAppNumber(input.to),
      from: ("from" in payload && payload.from) || config.from,
      status: ("status" in payload && payload.status) || "queued",
      sid: ("sid" in payload ? payload.sid : null) ?? null,
      note: contentSid ? "Template message queued successfully with Twilio" : "Message queued successfully with Twilio",
      messagesToLog: [
        {
          body: input.message,
          sid: ("sid" in payload ? payload.sid : null) ?? null,
          status: ("status" in payload && payload.status) || "queued"
        }
      ]
    } satisfies WhatsAppSendResult,
    status: 200
  };
}

async function sendMetaMessage(input: { to: string; message: string; propertySlug?: string }) {
  const config = await getResolvedMetaConfig(input.propertySlug?.trim() || DEFAULT_PROPERTY_SLUG);

  if (!config) {
    return {
      error: "Meta WhatsApp credentials are missing from environment configuration",
      result: null,
      status: 503
    };
  }

  const to = normalizeMetaRecipient(input.to);
  if (!to) {
    return {
      error: "Recipient phone number is missing or invalid",
      result: null,
      status: 400
    };
  }
  const response = await fetch(`https://graph.facebook.com/${getMetaGraphVersion()}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: input.message
      }
    })
  });

  const payload = (await response.json()) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string; code?: number; error_subcode?: number };
  };

  if (!response.ok) {
    return {
      error: formatMetaAuthError(payload.error),
      result: null,
      status: response.status
    };
  }

  return {
    error: null,
    result: {
      provider: "META_CLOUD_API",
      to: input.to,
      from: config.displayPhoneNumber ?? config.phoneNumberId,
      status: "accepted",
      sid: payload.messages?.[0]?.id ?? null,
      note: "Message accepted by Meta WhatsApp Cloud API",
      messagesToLog: [
        {
          body: input.message,
          sid: payload.messages?.[0]?.id ?? null,
          status: "accepted"
        }
      ]
    } satisfies WhatsAppSendResult,
    status: 200
  };
}

async function sendMetaInteractiveMenu(input: {
  to: string;
  intro: string;
  propertySlug: string;
  configuration: WhatsAppBotConfiguration;
}) {
  const config = await getResolvedMetaConfig(input.propertySlug);
  if (!config) {
    return { error: "Meta WhatsApp credentials are missing from environment configuration", result: null, status: 503 };
  }

  const to = normalizeMetaRecipient(input.to);
  const options = buildWhatsAppBotMenuOptions(input.configuration);
  if (!to || options.length === 0) {
    return { error: "Interactive menu requires a recipient and at least one enabled option", result: null, status: 400 };
  }

  const response = await fetch(`https://graph.facebook.com/${getMetaGraphVersion()}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: "HotelRADAR AI" },
        body: { text: input.intro.slice(0, 1024) },
        footer: { text: "English support | Human assistance available" },
        action: {
          button: "Explore options",
          sections: [{
            title: "How can we help?",
            rows: options.map((option) => ({
              id: option.id.slice(0, 200),
              title: option.label.slice(0, 24),
              description: option.description.slice(0, 72)
            }))
          }]
        }
      }
    })
  });

  const payload = (await response.json().catch(() => null)) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string; code?: number; error_subcode?: number };
  } | null;

  if (!response.ok) {
    return { error: formatMetaAuthError(payload?.error), result: null, status: response.status };
  }

  const messageId = payload?.messages?.[0]?.id ?? null;
  return {
    error: null,
    result: {
      provider: "META_CLOUD_API",
      to: input.to,
      from: config.displayPhoneNumber ?? config.phoneNumberId,
      status: "accepted",
      sid: messageId,
      note: "Interactive WhatsApp menu accepted by Meta",
      messagesToLog: [{ body: `[Interactive menu] ${input.intro}`, sid: messageId, status: "accepted" }]
    } satisfies WhatsAppSendResult,
    status: 200
  };
}

async function sendWhatsAppInteractiveMenu(input: {
  to: string;
  propertySlug: string;
  leadId: string;
  configuration: WhatsAppBotConfiguration;
}) {
  const intro = `${input.configuration.welcomeMessage.trim()}\n\nChoose an option below. I will share relevant information, ask only the details needed, and connect you with a specialist whenever you prefer.`;
  const sent = await sendMetaInteractiveMenu({ ...input, intro });
  if (sent.error || !sent.result) return sent;

  try {
    await appendLeadMessage(input.leadId, {
      sender: "AI",
      body: sent.result.messagesToLog[0]?.body ?? intro,
      sentAt: new Date(),
      externalMessageId: sent.result.sid ?? undefined,
      deliveryStatus: sent.result.status
    });
  } catch (error) {
    if (!isDatabaseAccessError(error)) throw error;
  }

  return sent;
}

export async function sendWhatsAppTemplateMessage(input: {
  to: string;
  templateName: string;
  languageCode?: string;
  bodyVariables?: string[];
  headerImageUrl?: string;
  headerMediaId?: string;
  propertySlug?: string;
}) {
  const propertySlug = input.propertySlug?.trim() || DEFAULT_PROPERTY_SLUG;
  const config = await getResolvedMetaConfig(propertySlug);

  if (!config) {
    return {
      error: "Meta WhatsApp credentials are missing from environment configuration",
      result: null,
      status: 503
    };
  }

  const to = normalizeMetaRecipient(input.to);
  const templateName = input.templateName.trim();
  const languageCode = input.languageCode?.trim() || "en_US";

  if (!to) {
    return {
      error: "Recipient phone number is missing or invalid",
      result: null,
      status: 400
    };
  }

  if (!templateName) {
    return {
      error: "Approved WhatsApp template name is required",
      result: null,
      status: 400
    };
  }

  const bodyVariables = (input.bodyVariables ?? []).map((value) => value.trim()).filter(Boolean);
  const headerImageUrl = input.headerImageUrl?.trim();
  const headerMediaId = input.headerMediaId?.trim();
  const components: Array<Record<string, unknown>> = [];
  if (headerMediaId || headerImageUrl) {
    components.push({
      type: "header",
      parameters: [{
        type: "image",
        image: headerMediaId ? { id: headerMediaId } : { link: headerImageUrl }
      }]
    });
  }
  if (bodyVariables.length > 0) {
    components.push({
      type: "body",
      parameters: bodyVariables.map((value) => ({ type: "text", text: value }))
    });
  }

  const response = await fetch(`https://graph.facebook.com/${getMetaGraphVersion()}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        ...(components.length ? { components } : {})
      }
    })
  });

  const payload = (await response.json()) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string; code?: number; error_subcode?: number };
  };

  if (!response.ok) {
    return {
      error: formatMetaAuthError(payload.error),
      result: null,
      status: response.status
    };
  }

  const messageId = payload.messages?.[0]?.id ?? null;
  let updatedLead = null;
  try {
    const normalizedPhone = `+${to}`;
    const property = await getPropertyBySlug(propertySlug);
    let lead = property ? await getLeadByPhoneForProperty(property.id, normalizedPhone) : null;

    if (!lead && property) {
      const created = await createLead(
        {
          name: normalizedPhone,
          source: "WhatsApp",
          stage: "New",
          language: "EN",
          intent: "Outbound WhatsApp template",
          stay: "Business details pending",
          party: "Service requirement pending",
          budget: "Budget not shared",
          phone: normalizedPhone,
          score: 55,
          tags: ["Outbound WhatsApp", "Template"],
          isHighPriority: false
        },
        propertySlug
      );
      lead = created.lead ? await getLeadById(created.lead.id) : null;
    }

    if (lead) {
      const appended = await appendLeadMessage(lead.id, {
        sender: "AGENT",
        body: `[Template: ${templateName}]`,
        sentAt: new Date(),
        externalMessageId: messageId ?? undefined,
        deliveryStatus: "accepted"
      });
      updatedLead = appended.lead;
    }
  } catch (error) {
    if (!isDatabaseAccessError(error)) {
      throw error;
    }
  }

  return {
    error: null,
    result: {
      provider: "META_CLOUD_API_TEMPLATE",
      to: `+${to}`,
      from: config.displayPhoneNumber ?? config.phoneNumberId,
      status: "accepted",
      sid: messageId,
      note: "Approved WhatsApp template accepted by Meta",
      lead: updatedLead
    },
    status: 200
  };
}

async function uploadMetaMedia(attachment: WhatsAppAttachmentInput, propertySlug = DEFAULT_PROPERTY_SLUG) {
  const config = await getResolvedMetaConfig(propertySlug);

  if (!config) {
    return {
      error: "Meta WhatsApp credentials are missing from environment configuration",
      mediaId: null as string | null,
      status: 503
    };
  }

  const form = new FormData();
  form.set("messaging_product", "whatsapp");
  form.set("type", attachment.mimeType);
  form.set("file", new Blob([attachment.bytes.buffer as ArrayBuffer], { type: attachment.mimeType }), attachment.name);

  const response = await fetch(`https://graph.facebook.com/${getMetaGraphVersion()}/${config.phoneNumberId}/media`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`
    },
    body: form
  });

  const payload = (await response.json()) as {
    id?: string;
    error?: { message?: string; code?: number; error_subcode?: number };
  };

  if (!response.ok) {
    return {
      error: formatMetaAuthError(payload.error) ?? "Meta rejected the WhatsApp media upload",
      mediaId: null as string | null,
      status: response.status
    };
  }

  return {
    error: null,
    mediaId: payload.id ?? null,
    status: 200
  };
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getBaseUrl() {
  return process.env.PUBLIC_BASE_URL ?? "https://lead.hotelradar.in";
}

function getAttachmentRelativeDir() {
  return path.join("uploads", "whatsapp");
}

function buildAttachmentUrl(fileName: string) {
  return `${getBaseUrl()}/api/media/uploads/whatsapp/${fileName}`;
}

async function persistAttachment(attachment: WhatsAppAttachmentInput): Promise<StoredAttachment> {
  const extension = path.extname(attachment.name) || (attachment.mimeType.startsWith("image/") ? ".jpg" : "");
  const safeName = sanitizeFileName(path.basename(attachment.name, extension)) || "attachment";
  const fileName = `${Date.now()}-${safeName}${extension}`;
  const relativeDir = getAttachmentRelativeDir();
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, fileName), Buffer.from(attachment.bytes));

  return {
    kind: attachment.mimeType.startsWith("image/") ? "image" : "file",
    url: buildAttachmentUrl(fileName),
    name: attachment.name
  };
}

async function downloadMetaAttachment(input: {
  mediaId: string;
  mimeType?: string;
  fileName?: string;
  propertySlug?: string;
}) {
  const config = await getResolvedMetaConfig(input.propertySlug?.trim() || DEFAULT_PROPERTY_SLUG);

  if (!config) {
    return {
      error: "Meta WhatsApp credentials are missing from environment configuration",
      attachment: null as StoredAttachment | null,
      status: 503
    };
  }

  const metaResponse = await fetch(`https://graph.facebook.com/${getMetaGraphVersion()}/${input.mediaId}`, {
    headers: {
      Authorization: `Bearer ${config.accessToken}`
    },
    cache: "no-store"
  });

  const metaPayload = (await metaResponse.json()) as {
    url?: string;
    mime_type?: string;
    error?: { message?: string; code?: number; error_subcode?: number };
  };

  if (!metaResponse.ok || !metaPayload.url) {
    return {
      error: formatMetaAuthError(metaPayload.error) ?? "Could not resolve Meta media URL",
      attachment: null as StoredAttachment | null,
      status: metaResponse.status
    };
  }

  const binaryResponse = await fetch(metaPayload.url, {
    headers: {
      Authorization: `Bearer ${config.accessToken}`
    },
    cache: "no-store"
  });

  if (!binaryResponse.ok) {
    return {
      error: binaryResponse.status === 401 || binaryResponse.status === 403
        ? "Meta access token expired. Paste a fresh system-user token in Settings > WhatsApp, then save and retry."
        : "Could not download Meta media",
      attachment: null as StoredAttachment | null,
      status: binaryResponse.status
    };
  }

  const bytes = new Uint8Array(await binaryResponse.arrayBuffer());
  const mimeType = input.mimeType || metaPayload.mime_type || binaryResponse.headers.get("content-type") || "application/octet-stream";
  const fileName = input.fileName || `${input.mediaId}${mimeType.startsWith("image/") ? ".jpg" : ""}`;
  const attachment = await persistAttachment({
    name: fileName,
    mimeType,
    bytes
  });

  return {
    error: null,
    attachment,
    status: 200
  };
}

function buildAttachmentLogBody(attachment: StoredAttachment, message: string) {
  const trimmedMessage = message.trim();
  return `[[attachment|${attachment.kind}|${attachment.url}|${attachment.name}]]${trimmedMessage ? `\n${trimmedMessage}` : ""}`;
}

async function sendMetaAttachmentMessage(input: {
  to: string;
  message: string;
  attachment: WhatsAppAttachmentInput;
  propertySlug?: string;
}) {
  const config = await getResolvedMetaConfig(input.propertySlug?.trim() || DEFAULT_PROPERTY_SLUG);

  if (!config) {
    return {
      error: "Meta WhatsApp credentials are missing from environment configuration",
      result: null,
      status: 503
    };
  }

  const storedAttachment = await persistAttachment(input.attachment);
  const upload = await uploadMetaMedia(input.attachment, input.propertySlug?.trim() || DEFAULT_PROPERTY_SLUG);
  if (upload.error || !upload.mediaId) {
    return {
      error: upload.error ?? "Meta media upload failed",
      result: null,
      status: upload.status
    };
  }

  const to = input.to.replace(/^whatsapp:/, "").trim().replace(/^\+/, "");
  const isImage = input.attachment.mimeType.startsWith("image/");
  const trimmedMessage = input.message.trim();

  const mediaPayload = isImage
    ? {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "image",
        image: {
          id: upload.mediaId,
          ...(trimmedMessage ? { caption: trimmedMessage } : {})
        }
      }
    : {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "document",
        document: {
          id: upload.mediaId,
          filename: input.attachment.name
        }
      };

  const mediaResponse = await fetch(`https://graph.facebook.com/${getMetaGraphVersion()}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(mediaPayload)
  });

  const mediaResult = (await mediaResponse.json()) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string; code?: number; error_subcode?: number };
  };

  if (!mediaResponse.ok) {
    return {
      error: formatMetaAuthError(mediaResult.error) ?? "Meta rejected the WhatsApp attachment",
      result: null,
      status: mediaResponse.status
    };
  }

  const logEntries: WhatsAppSendResult["messagesToLog"] = [
    {
      body: buildAttachmentLogBody(storedAttachment, isImage ? "" : trimmedMessage),
      sid: mediaResult.messages?.[0]?.id ?? null,
      status: "accepted"
    }
  ];

  let finalSid = mediaResult.messages?.[0]?.id ?? null;

  if (isImage && trimmedMessage) {
    logEntries[0].body = buildAttachmentLogBody(storedAttachment, trimmedMessage);
  } else if (!isImage && trimmedMessage) {
    const textSend = await sendMetaMessage({
      to: input.to,
      message: trimmedMessage,
      propertySlug: input.propertySlug?.trim() || DEFAULT_PROPERTY_SLUG
    });
    if (textSend.error) {
      return {
        error: textSend.error,
        result: null,
        status: textSend.status
      };
    }

    logEntries.push(...(textSend.result?.messagesToLog ?? []));
    finalSid = textSend.result?.sid ?? finalSid;
  }

  return {
    error: null,
    result: {
      provider: "META_CLOUD_API",
      to: input.to,
      from: config.displayPhoneNumber ?? config.phoneNumberId,
      status: "accepted",
      sid: finalSid,
      note: isImage ? "Image accepted by Meta WhatsApp Cloud API" : "File accepted by Meta WhatsApp Cloud API",
      messagesToLog: logEntries
    } satisfies WhatsAppSendResult,
    status: 200
  };
}

async function fetchRecentTwilioMessages(pageSize = 20) {
  const config = getTwilioConfig();

  if (!config) {
    return {
      error: "Twilio credentials are missing from environment configuration",
      messages: [] as TwilioMessageListItem[],
      status: 503
    };
  }

  const basicAuth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json?PageSize=${pageSize}`,
    {
      cache: "no-store",
      headers: {
        Authorization: `Basic ${basicAuth}`
      }
    }
  );
  const payload = (await response.json()) as { messages?: TwilioMessageListItem[]; message?: string };

  if (!response.ok) {
    return {
      error: payload.message ?? "Could not load recent Twilio messages",
      messages: [] as TwilioMessageListItem[],
      status: response.status
    };
  }

  return {
    error: null,
    messages: payload.messages ?? [],
    status: 200
  };
}

function computeTwilioSignature(url: string, params: URLSearchParams, authToken: string) {
  const sortedEntries = Array.from(params.entries()).sort(([left], [right]) => left.localeCompare(right));
  const payload = `${url}${sortedEntries.map(([key, value]) => `${key}${value}`).join("")}`;
  const digest = createHmac("sha1", authToken).update(payload).digest("base64");
  return digest;
}

export async function validateTwilioWebhookSignature(input: {
  url: string | string[];
  params: URLSearchParams;
  signatureHeader?: string | null;
}) {
  const config = getTwilioConfig();
  if (!config) return false;
  if (!input.signatureHeader) return false;

  const candidates = Array.isArray(input.url) ? input.url : [input.url];
  return candidates.some((candidate) => {
    const expected = computeTwilioSignature(candidate, input.params, config.authToken);
    return expected === input.signatureHeader;
  });
}

export async function loadWhatsAppIntegration(propertySlug = DEFAULT_PROPERTY_SLUG): Promise<WhatsAppIntegration> {
  try {
    const record = await getWhatsAppIntegrationForProperty(propertySlug);
    if (!record) return emptyIntegration;
    const integration = mapWhatsAppIntegrationRecord(record);
    const metaConfig = await getResolvedMetaConfig(propertySlug);
    const twilioConfig = getTwilioConfig();

    if (integration.provider === "META_CLOUD_API" && metaConfig) {
      return {
        ...integration,
        provider: "META_CLOUD_API",
        businessAccountId: integration.businessAccountId ?? metaConfig.businessAccountId ?? null,
        phoneNumberId: integration.phoneNumberId ?? metaConfig.phoneNumberId,
        displayPhoneNumber: integration.displayPhoneNumber ?? metaConfig.displayPhoneNumber ?? null,
        webhookVerifyToken: integration.webhookVerifyToken ?? metaConfig.verifyToken,
        status: "CONNECTED"
      };
    }

    if (integration.provider === "TWILIO_WHATSAPP" && twilioConfig) {
      return {
        ...integration,
        provider: "TWILIO_WHATSAPP",
        displayPhoneNumber: integration.displayPhoneNumber ?? process.env.TWILIO_WHATSAPP_FROM ?? null,
        status: "CONNECTED"
      };
    }

    if (metaConfig) {
      return {
        ...integration,
        provider: "META_CLOUD_API",
        businessAccountId: integration.businessAccountId ?? metaConfig.businessAccountId ?? null,
        phoneNumberId: integration.phoneNumberId ?? metaConfig.phoneNumberId,
        displayPhoneNumber: integration.displayPhoneNumber ?? metaConfig.displayPhoneNumber ?? null,
        webhookVerifyToken: integration.webhookVerifyToken ?? metaConfig.verifyToken,
        status: "CONNECTED"
      };
    }
    return integration;
  } catch (error) {
    if (isDatabaseAccessError(error)) {
      const metaConfig = await getResolvedMetaConfig(propertySlug);
      if (metaConfig) {
        return {
          ...emptyIntegration,
          provider: "META_CLOUD_API",
          businessAccountId: metaConfig.businessAccountId ?? null,
          phoneNumberId: metaConfig.phoneNumberId,
          displayPhoneNumber: metaConfig.displayPhoneNumber ?? null,
          webhookVerifyToken: metaConfig.verifyToken,
          notes: "Meta WhatsApp Cloud API connected for HotelRADAR"
        };
      }
      return emptyIntegration;
    }
    throw error;
  }
}

export async function saveWhatsAppIntegration(
  input: WhatsAppIntegrationInput,
  propertySlug = DEFAULT_PROPERTY_SLUG
) {
  const validationError = validateWhatsAppIntegrationInput(input);
  if (validationError) {
    return { error: validationError, integration: null as WhatsAppIntegration | null, status: 400 };
  }

  try {
    const property = await getPropertyBySlug(propertySlug);
    if (!property) {
      return { error: "Property not found or database unavailable", integration: null as WhatsAppIntegration | null, status: 503 };
    }

    const normalized = normalizeWhatsAppIntegrationInput(input);
    if (normalized.provider === "META_CLOUD_API" && normalized.accessToken === null) {
      const existing = await getWhatsAppIntegrationForProperty(propertySlug);
      normalized.accessToken = existing?.accessToken ?? null;
    }
    const record = await upsertWhatsAppIntegrationForProperty(property.id, normalized);
    if (!record) {
      return { error: "Database unavailable", integration: null as WhatsAppIntegration | null, status: 503 };
    }

    return { error: null, integration: mapWhatsAppIntegrationRecord(record), status: 200 };
  } catch (error) {
    if (isDatabaseAccessError(error)) {
      return { error: "Database unavailable", integration: null as WhatsAppIntegration | null, status: 503 };
    }
    throw error;
  }
}

export async function validateWhatsAppIntegration(propertySlug = DEFAULT_PROPERTY_SLUG) {
  const config = await getResolvedMetaConfig(propertySlug);
  if (!config?.phoneNumberId || !config.accessToken) {
    return {
      error: "Save a Phone Number ID and permanent Meta access token before validation.",
      phone: null,
      status: 400
    };
  }

  const graphVersion = getMetaGraphVersion();
  const fields = "display_phone_number,verified_name,quality_rating,status";
  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(config.phoneNumberId)}?fields=${encodeURIComponent(fields)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${config.accessToken}` },
      cache: "no-store"
    }
  );
  const payload = (await response.json().catch(() => null)) as
    | {
        id?: string;
        display_phone_number?: string;
        verified_name?: string;
        quality_rating?: string;
        status?: string;
        error?: { message?: string; code?: number; error_subcode?: number };
      }
    | null;

  if (!response.ok || payload?.error) {
    return {
      error: formatMetaAuthError(payload?.error ?? { message: "Meta could not validate this phone number." }),
      phone: null,
      status: response.status || 502
    };
  }

  return {
    error: null,
    phone: {
      id: payload?.id ?? config.phoneNumberId,
      displayPhoneNumber: payload?.display_phone_number ?? config.displayPhoneNumber ?? "",
      verifiedName: payload?.verified_name ?? "",
      qualityRating: payload?.quality_rating ?? "UNKNOWN",
      accountStatus: payload?.status ?? "UNKNOWN"
    },
    status: 200
  };
}

export async function listMetaMessageTemplates(propertySlug = DEFAULT_PROPERTY_SLUG) {
  const config = await getResolvedMetaConfig(propertySlug);
  if (!config?.businessAccountId || !config.accessToken) {
    return { error: "A WhatsApp Business Account ID and Meta token are required to sync templates.", templates: [], status: 400 };
  }

  const response = await fetch(
    `https://graph.facebook.com/${getMetaGraphVersion()}/${encodeURIComponent(config.businessAccountId)}/message_templates?fields=name,status,category,language&limit=100`,
    { headers: { Authorization: `Bearer ${config.accessToken}` }, cache: "no-store" }
  );
  const payload = await response.json().catch(() => null) as {
    data?: Array<{ name?: string; status?: string; category?: string; language?: string }>;
    error?: { message?: string; code?: number; error_subcode?: number };
  } | null;
  if (!response.ok || payload?.error) {
    return { error: formatMetaAuthError(payload?.error), templates: [], status: response.status || 502 };
  }

  return {
    error: null,
    templates: (payload?.data || []).map((template) => ({
      name: template.name || "",
      status: (template.status || "UNKNOWN").toUpperCase(),
      category: (template.category || "UNKNOWN").toUpperCase(),
      language: template.language || ""
    })),
    status: 200
  };
}

export async function sendWhatsAppTestMessage(input: {
  to: string;
  message: string;
  propertySlug?: string;
  propertyId?: string;
  leadId?: string;
  operatorId?: string;
  conversationId?: string;
  sender?: "AGENT" | "AI";
  attachment?: WhatsAppAttachmentInput;
}) {
  if (!input.message.trim() && !input.attachment) {
    return {
      error: "Please enter a message or attach a file before sending",
      result: null,
      status: 400
    };
  }

  let lead = null;
  try {
    lead = input.leadId ? await getLeadById(input.leadId) : null;
  } catch (error) {
    if (!isDatabaseAccessError(error)) {
      throw error;
    }
  }

  const propertySlug = input.propertySlug?.trim() || lead?.property?.slug || DEFAULT_PROPERTY_SLUG;
  const sendResult = input.attachment
    ? await sendMetaAttachmentMessage({
        to: input.to,
        message: input.message,
        attachment: input.attachment,
        propertySlug
      })
    : await sendMetaMessage({
        to: input.to,
        message: input.message,
        propertySlug
      });

  if (sendResult.error || !sendResult.result) {
    return {
      error: sendResult.error,
      result: null,
      status: sendResult.status
    };
  }

  let updatedLead = null;
  try {
    const normalizedPhone = input.to.replace(/^whatsapp:/, "").trim();
    if (!lead) {
      const property = await getPropertyBySlug(propertySlug);
      lead = input.leadId ? await getLeadById(input.leadId) : property ? await getLeadByPhoneForProperty(property.id, normalizedPhone) : null;

      if (!lead && property) {
        const created = await createLead(
          {
            name: normalizedPhone,
            source: "WhatsApp",
            stage: "New",
            language: "EN",
            intent: "Outbound WhatsApp conversation",
            stay: "Business details pending",
            party: "Service requirement pending",
            budget: "Budget not shared",
            phone: normalizedPhone,
            score: 50,
            tags: ["Outbound WhatsApp"],
            isHighPriority: false
          },
          propertySlug
        );
        lead = created.lead ? await getLeadById(created.lead.id) : null;
      }
    }

    if (lead) {
      for (const message of sendResult.result.messagesToLog) {
        const appended = await appendLeadMessage(lead.id, {
          sender: input.sender ?? "AGENT",
          body: message.body,
          sentAt: new Date(),
          externalMessageId: message.sid ?? undefined,
          deliveryStatus: message.status ?? "accepted_by_meta"
        });
        updatedLead = appended?.error ? updatedLead : appended.lead;
      }
    }
  } catch (error) {
    if (!isDatabaseAccessError(error)) {
      throw error;
    }
  }

  return {
    error: null,
    result: {
      ...sendResult.result,
      lead: updatedLead
    },
    status: sendResult.status
  };
}

export async function loadWhatsAppBotContext(propertySlug = DEFAULT_PROPERTY_SLUG) {
  await syncRecentTwilioInboundMessages(propertySlug);

  const [integration, leads] = await Promise.all([
    loadWhatsAppIntegration(propertySlug),
    loadLeadsWithOptions(propertySlug, { fallbackToMock: false })
  ]);

  const sortedLeads = [...leads].sort((left, right) => {
    const rightTime = new Date(right.updatedAtIso).getTime();
    const leftTime = new Date(left.updatedAtIso).getTime();
    return rightTime - leftTime;
  });

  return { integration, leads: sortedLeads };
}

export async function syncRecentTwilioInboundMessages(propertySlug = DEFAULT_PROPERTY_SLUG) {
  const config = getTwilioConfig();
  if (!config) {
    return {
      error: "Twilio credentials are missing from environment configuration",
      imported: 0,
      status: 503
    };
  }

  const result = await fetchRecentTwilioMessages(30);
  if (result.error) {
    return {
      error: result.error,
      imported: 0,
      status: result.status
    };
  }

  let imported = 0;
  const inboundMessages = result.messages
    .filter((message) => {
      const body = message.body?.trim() ?? "";
      return (
        message.direction === "inbound" &&
        message.from?.startsWith("whatsapp:") &&
        message.to === config.from &&
        body.length > 0 &&
        !body.toLowerCase().startsWith("join ")
      );
    })
    .reverse();

  for (const message of inboundMessages) {
    const sentAt = message.date_created ? new Date(message.date_created) : new Date();
    const captured = await captureIncomingWhatsAppMessage({
      from: message.from ?? "",
      body: message.body ?? "",
      profileName: "HotelRADAR WhatsApp Guest",
      propertySlug,
      sentAt: Number.isNaN(sentAt.getTime()) ? new Date() : sentAt
    });

    if (!captured.error) {
      imported += 1;
    }
  }

  return {
    error: null,
    imported,
    status: 200
  };
}

export async function processIncomingTwilioWebhook(input: {
  formData: URLSearchParams;
  propertySlug?: string;
}) {
  const from = input.formData.get("From") ?? "";
  const body = input.formData.get("Body") ?? "";
  const profileName = input.formData.get("ProfileName") ?? undefined;
  const sentAt = input.formData.get("Timestamp") ? new Date(input.formData.get("Timestamp") as string) : new Date();

  if (!from || !body) {
    return {
      error: "Incoming webhook is missing required WhatsApp fields",
      result: null,
      status: 400
    };
  }

  const captured = await captureIncomingWhatsAppMessage({
    from,
    body,
    profileName,
    propertySlug: input.propertySlug,
    sentAt: Number.isNaN(sentAt.getTime()) ? new Date() : sentAt
  });

  if (captured.error) {
    return {
      error: captured.error,
      result: null,
      status: captured.status
    };
  }

  return {
    error: null,
    result: {
      leadId: captured.lead?.id,
      createdLead: captured.created,
      message: "Inbound WhatsApp message captured successfully"
    },
    status: 200
  };
}

export async function getMetaWebhookVerifyToken(propertySlug = DEFAULT_PROPERTY_SLUG) {
  return (await getResolvedMetaConfig(propertySlug))?.verifyToken ?? "leados-meta-verify-2026";
}

export async function isValidMetaWebhookVerifyToken(token: string | null) {
  const candidate = token?.trim();
  if (!candidate) return false;

  const storedTokens = await listWhatsAppVerifyTokens();
  if (storedTokens.includes(candidate)) return true;

  return candidate === (await getMetaWebhookVerifyToken());
}

export async function processIncomingMetaWebhook(input: {
  payload: {
    entry?: Array<{
      changes?: Array<{
        value?: {
          metadata?: {
            phone_number_id?: string;
            display_phone_number?: string;
          };
          contacts?: Array<{ profile?: { name?: string } }>;
          messages?: Array<{
            id?: string;
            from?: string;
            type?: string;
            text?: { body?: string };
            button?: {
              text?: string;
              payload?: string;
            };
            interactive?: {
              type?: string;
              button_reply?: { id?: string; title?: string };
              list_reply?: { id?: string; title?: string; description?: string };
            };
            image?: {
              id?: string;
              caption?: string;
              mime_type?: string;
            };
            document?: {
              id?: string;
              caption?: string;
              filename?: string;
              mime_type?: string;
            };
            timestamp?: string;
          }>;
          statuses?: Array<{
            id?: string;
            status?: string;
            timestamp?: string;
            recipient_id?: string;
            errors?: Array<{
              code?: number;
              title?: string;
              message?: string;
              error_data?: { details?: string };
            }>;
          }>;
        };
      }>;
    }>;
  };
  propertySlug?: string;
}) {
  const entries = input.payload.entry ?? [];
  let imported = 0;
  let statusesUpdated = 0;
  let autoRepliesSent = 0;
  let autoReplyFailures = 0;
  let duplicates = 0;
  let ignored = 0;

  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const profileName = value?.contacts?.[0]?.profile?.name;
      const phoneNumberId = value?.metadata?.phone_number_id?.trim() ?? "";
      const workspace = phoneNumberId
        ? await getWhatsAppWorkspaceByPhoneNumberId(phoneNumberId)
        : null;
      const propertySlug = input.propertySlug?.trim()
        || workspace?.property.slug
        || (phoneNumberId ? "" : DEFAULT_PROPERTY_SLUG);

      // A provider number must resolve explicitly so messages never leak across clients.
      if (!propertySlug) {
        ignored += (value?.messages?.length ?? 0) + (value?.statuses?.length ?? 0);
        continue;
      }

      for (const message of value?.messages ?? []) {
        const from = message.from?.trim() ?? "";
        const timestampValue = message.timestamp ? Number(message.timestamp) * 1000 : Date.now();
        let body = message.text?.body?.trim()
          || message.button?.text?.trim()
          || message.button?.payload?.trim()
          || message.interactive?.button_reply?.title?.trim()
          || message.interactive?.list_reply?.title?.trim()
          || message.interactive?.button_reply?.id?.replace(/^menu_/, "").replaceAll("_", " ").trim()
          || message.interactive?.list_reply?.id?.replace(/^menu_/, "").replaceAll("_", " ").trim()
          || "";

        if (!from) {
          continue;
        }

        if (message.type === "image" && message.image?.id) {
          const downloaded = await downloadMetaAttachment({
            mediaId: message.image.id,
            mimeType: message.image.mime_type,
            fileName: `${message.image.id}.jpg`,
            propertySlug
          });

          if (!downloaded.error && downloaded.attachment) {
            body = buildAttachmentLogBody(downloaded.attachment, message.image.caption ?? "");
          }
        }

        if (message.type === "document" && message.document?.id) {
          const downloaded = await downloadMetaAttachment({
            mediaId: message.document.id,
            mimeType: message.document.mime_type,
            fileName: message.document.filename ?? `${message.document.id}`,
            propertySlug
          });

          if (!downloaded.error && downloaded.attachment) {
            body = buildAttachmentLogBody(downloaded.attachment, message.document.caption ?? "");
          }
        }

        if (!body) {
          continue;
        }

        const captured = await captureIncomingWhatsAppMessage({
          from: `whatsapp:+${from.replace(/^\+/, "")}`,
          body,
          externalMessageId: message.id?.trim() || undefined,
          profileName,
          propertySlug,
          sentAt: new Date(timestampValue)
        });

        if (captured.duplicate) {
          duplicates += 1;
          continue;
        }

        if (!captured.error && captured.lead) {
          imported += 1;

          const botConfiguration = await getWhatsAppBotConfigurationForProperty(propertySlug);
          const inquiry = classifyWhatsAppAgencyInquiry(body, botConfiguration);
          const classified = await updateLead(captured.lead.id, {
            name: captured.lead.name,
            source: captured.lead.source,
            stage: captured.lead.stage,
            language: "EN",
            intent: inquiry.label,
            stay: captured.lead.stay || "Business details pending",
            party: captured.lead.party || "Service requirement pending",
            budget: captured.lead.budget || "Budget not shared",
            phone: captured.lead.phone,
            score: Math.max(captured.lead.score, inquiry.score),
            tags: Array.from(new Set([
              ...captured.lead.tags,
              inquiry.tag,
              ...(inquiry.requiresHuman ? ["Needs Agent", "Manual Takeover"] : [])
            ])),
            isHighPriority: inquiry.highPriority || captured.lead.score >= 80
          });
          const classifiedLead = classified.lead ?? captured.lead;

          const integration = await getWhatsAppIntegrationForProperty(propertySlug);
          if (integration?.aiModeEnabled && botConfiguration.enabled && shouldSendWhatsAppAutoReply(classifiedLead)) {
            const inboundCount = classifiedLead.transcript.filter((item) => item.from === "guest").length;
            const isFirstWelcome = inboundCount === 1 && botConfiguration.welcomeEnabled;
            const knowledgeAnswer = isFirstWelcome
              ? null
              : await buildWebsiteKnowledgeAnswer({
                  question: body,
                  propertySlug,
                  configuration: botConfiguration
                });
            const automaticReply = isFirstWelcome ? buildWhatsAppFirstReply(botConfiguration) : knowledgeAnswer?.answer ?? inquiry.reply;
            let reply = isFirstWelcome
              ? await sendWhatsAppInteractiveMenu({
                  to: `+${from.replace(/^\+/, "")}`,
                  propertySlug,
                  leadId: classifiedLead.id,
                  configuration: botConfiguration
                })
              : await sendWhatsAppTestMessage({
                  to: `+${from.replace(/^\+/, "")}`,
                  message: automaticReply,
                  propertySlug,
                  leadId: classifiedLead.id,
                  operatorId: "lead-os-ai",
                  sender: "AI"
                });

            if (reply.error && isFirstWelcome) {
              reply = await sendWhatsAppTestMessage({
                to: `+${from.replace(/^\+/, "")}`,
                message: automaticReply,
                propertySlug,
                leadId: classifiedLead.id,
                operatorId: "lead-os-ai",
                sender: "AI"
              });
            }

            if (reply.error) {
              autoReplyFailures += 1;
              console.error("WhatsApp automatic reply failed", {
                propertySlug,
                leadId: captured.lead.id,
                status: reply.status,
                error: reply.error
              });
            } else {
              autoRepliesSent += 1;
            }
          }
        }
      }

      for (const status of value?.statuses ?? []) {
        const messageId = status.id?.trim();
        const rawDeliveryStatus = status.status?.trim();
        const timestampValue = status.timestamp ? Number(status.timestamp) * 1000 : Date.now();
        const errorCodes = (status.errors ?? []).map((error) => error.code);
        const deliveryStatus =
          rawDeliveryStatus === "failed" && errorCodes.includes(131042)
            ? "failed_payment_required"
            : rawDeliveryStatus === "failed" && errorCodes.includes(131047)
              ? "failed_template_required"
              : rawDeliveryStatus === "failed" && errorCodes.includes(131049)
                ? "failed_engagement_limit"
                : rawDeliveryStatus === "failed" && errorCodes.includes(131026)
                  ? "failed_recipient_unavailable"
              : rawDeliveryStatus;

        if (!messageId || !deliveryStatus) {
          continue;
        }

        const updated = await updateLeadMessageStatus(messageId, {
          deliveryStatus,
          statusUpdatedAt: new Date(timestampValue)
        });
        await updateCampaignDeliveryStatus(messageId, deliveryStatus, new Date(timestampValue));

        if (!updated.error) {
          statusesUpdated += 1;
        }

        if (rawDeliveryStatus === "failed") {
          console.error("WhatsApp delivery failed", {
            messageId,
            recipientId: status.recipient_id,
            errors: status.errors ?? []
          });
        }
      }
    }
  }

  return {
    error: null,
    result: {
      imported,
      statusesUpdated,
      autoRepliesSent,
      autoReplyFailures,
      duplicates,
      ignored,
      message: `Imported ${imported} Meta WhatsApp message${imported === 1 ? "" : "s"}, sent ${autoRepliesSent} automatic repl${autoRepliesSent === 1 ? "y" : "ies"}, and updated ${statusesUpdated} status${statusesUpdated === 1 ? "" : "es"}`
    },
    status: 200
  };
}

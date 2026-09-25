import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { defaultWidgetMenu, normalizeWidgetMenu, type WidgetMenuConfig } from "@/lib/widget-menu";
import { normalizeTenantFlow, type TenantFlowDefinition } from "@/lib/tenant-flow-intelligence";
import { normalizeHotelQuickReply, type HotelQuickReply } from "@/lib/hotelgpt-quick-replies";

export type KnowledgeSyncStatus = "DRAFT" | "SYNCING" | "READY" | "ERROR";
export type WidgetTheme = "dark" | "light" | "system";
export type ShowcaseItem = { id: string; imageUrl: string; title: string; text: string; linkUrl: string; linkLabel: string };

export type KnowledgeSettings = {
  propertySlug: string;
  sourceUrl: string;
  status: KnowledgeSyncStatus;
  approvedForAi: boolean;
  autoRefreshHours: number;
  customInstructions: string;
  handoffTopics: string[];
  welcomeMessage: string;
  themeColor: string;
  widgetTheme?: WidgetTheme;
  logoUrl: string;
  welcomeCardImageUrl: string;
  welcomeCardTitle: string;
  welcomeCardText: string;
  showcaseItems: ShowcaseItem[];
  widgetMenu?: WidgetMenuConfig;
  tenantFlows?: TenantFlowDefinition[];
  hotelQuickReplies?: HotelQuickReply[];
  lastCrawledAt: string | null;
  pageCount: number;
  buckets: string[];
  lastError: string | null;
  updatedAt: string;
};

const DEFAULT_HANDOFF_TOPICS = ["Billing disputes", "Complaints", "Legal questions", "Sensitive personal data"];

function runtimeDir() {
  return path.join(process.cwd(), "data", "runtime");
}

function settingsPath(propertySlug: string) {
  const safeSlug = propertySlug.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
  return path.join(runtimeDir(), `knowledge-settings-${safeSlug}.json`);
}

function normalizeUrl(value: string) {
  const candidate = value.trim();
  if (!candidate) return "";
  const url = new URL(candidate.startsWith("http") ? candidate : `https://${candidate}`);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Only HTTP and HTTPS website sources are supported.");
  url.hash = "";
  return url.toString().replace(/\/+$/, "");
}

function defaults(propertySlug: string): KnowledgeSettings {
  return {
    propertySlug,
    sourceUrl: "",
    status: "DRAFT",
    approvedForAi: true,
    autoRefreshHours: 6,
    customInstructions: "Answer the question first, remain concise, and ask no more than one useful follow-up question.",
    handoffTopics: DEFAULT_HANDOFF_TOPICS,
    welcomeMessage: "Hello. How can I help with your business enquiry today?",
    themeColor: "#8a6a16",
    widgetTheme: "dark",
    logoUrl: "",
    welcomeCardImageUrl: "",
    welcomeCardTitle: "",
    welcomeCardText: "",
    showcaseItems: [],
    widgetMenu: defaultWidgetMenu(propertySlug),
    tenantFlows: [],
    hotelQuickReplies: [],
    lastCrawledAt: null,
    pageCount: 0,
    buckets: [],
    lastError: null,
    updatedAt: new Date().toISOString()
  };
}

export async function readKnowledgeSettings(propertySlug: string) {
  const fallback = defaults(propertySlug);
  try {
    const parsed = JSON.parse(await readFile(settingsPath(propertySlug), "utf8")) as Partial<KnowledgeSettings>;
    return {
      ...fallback,
      ...parsed,
      propertySlug,
      sourceUrl: normalizeUrl(parsed.sourceUrl || fallback.sourceUrl),
      handoffTopics: Array.isArray(parsed.handoffTopics) ? parsed.handoffTopics.filter(Boolean) : fallback.handoffTopics,
      buckets: Array.isArray(parsed.buckets) ? parsed.buckets.filter(Boolean) : [],
      widgetMenu: normalizeWidgetMenu(parsed.widgetMenu, fallback.widgetMenu || defaultWidgetMenu(propertySlug)),
      showcaseItems: normalizeShowcaseItems(parsed.showcaseItems),
      tenantFlows: Array.isArray(parsed.tenantFlows) ? parsed.tenantFlows.map(normalizeTenantFlow).filter(Boolean) as TenantFlowDefinition[] : [],
      hotelQuickReplies: Array.isArray(parsed.hotelQuickReplies) ? parsed.hotelQuickReplies.map(normalizeHotelQuickReply).filter(Boolean) as HotelQuickReply[] : []
    } satisfies KnowledgeSettings;
  } catch {
    return fallback;
  }
}

export async function writeKnowledgeSettings(
  propertySlug: string,
  input: Partial<Omit<KnowledgeSettings, "propertySlug" | "updatedAt">>
) {
  const current = await readKnowledgeSettings(propertySlug);
  const managedImagePrefix = `/api/media/uploads/showcase/${propertySlug.replace(/[^a-z0-9_-]/gi, "_").toLowerCase()}/`;
  if (input.logoUrl?.trim()) {
    const value = input.logoUrl.trim();
    if (!value.startsWith(managedImagePrefix)) {
      const logo = new URL(value);
      if (logo.protocol !== "https:" || logo.username || logo.password) throw new Error("Use an uploaded logo or a public HTTPS logo URL without credentials.");
    }
  }
  if (input.welcomeCardImageUrl?.trim()) {
    const value = input.welcomeCardImageUrl.trim();
    if (!value.startsWith(managedImagePrefix)) {
      const image = new URL(value);
      if (image.protocol !== "https:" || image.username || image.password) throw new Error("Use an uploaded image or a public HTTPS welcome-card image URL without credentials.");
    }
  }
  const showcaseItems = input.showcaseItems === undefined ? current.showcaseItems : normalizeShowcaseItems(input.showcaseItems);
  const next: KnowledgeSettings = {
    ...current,
    ...input,
    propertySlug,
    sourceUrl: input.sourceUrl === undefined ? current.sourceUrl : normalizeUrl(input.sourceUrl),
    autoRefreshHours: Math.min(168, Math.max(1, Number(input.autoRefreshHours ?? current.autoRefreshHours))),
    customInstructions: String(input.customInstructions ?? current.customInstructions).trim().slice(0, 1200),
    handoffTopics: Array.isArray(input.handoffTopics)
      ? input.handoffTopics.map((value) => String(value).trim()).filter(Boolean).slice(0, 12)
      : current.handoffTopics,
    welcomeMessage: String(input.welcomeMessage ?? current.welcomeMessage).trim().slice(0, 300) || current.welcomeMessage,
    themeColor: /^#[0-9a-f]{6}$/i.test(String(input.themeColor || "")) ? String(input.themeColor) : current.themeColor,
    widgetTheme: ["dark", "light", "system"].includes(String(input.widgetTheme)) ? input.widgetTheme as WidgetTheme : current.widgetTheme || "dark",
    logoUrl: String(input.logoUrl ?? current.logoUrl).trim().slice(0, 500),
    welcomeCardImageUrl: String(input.welcomeCardImageUrl ?? current.welcomeCardImageUrl).trim().slice(0, 500),
    welcomeCardTitle: String(input.welcomeCardTitle ?? current.welcomeCardTitle).trim().slice(0, 80),
    welcomeCardText: String(input.welcomeCardText ?? current.welcomeCardText).trim().slice(0, 240),
    showcaseItems,
    widgetMenu: input.widgetMenu === undefined ? current.widgetMenu : normalizeWidgetMenu(input.widgetMenu, current.widgetMenu || defaultWidgetMenu(propertySlug)),
    tenantFlows: input.tenantFlows === undefined ? current.tenantFlows : input.tenantFlows.map(normalizeTenantFlow).filter(Boolean) as TenantFlowDefinition[],
    hotelQuickReplies: input.hotelQuickReplies === undefined ? current.hotelQuickReplies : input.hotelQuickReplies.map(normalizeHotelQuickReply).filter(Boolean) as HotelQuickReply[],
    buckets: Array.isArray(input.buckets) ? [...new Set(input.buckets.map(String).filter(Boolean))].sort() : current.buckets,
    updatedAt: new Date().toISOString()
  };

  await mkdir(runtimeDir(), { recursive: true });
  await writeFile(settingsPath(propertySlug), JSON.stringify(next, null, 2), "utf8");
  return next;
}

function safeShowcaseUrl(value: unknown, image = false) {
  const candidate = String(value || "").trim().slice(0, 500);
  if (!candidate) return "";
  if (image && /^\/api\/media\/uploads\/showcase\/[a-z0-9_/-]+\.(?:jpe?g|png|webp)$/i.test(candidate)) return candidate;
  const url = new URL(candidate);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Showcase links must use public HTTPS URLs without credentials.");
  return url.toString();
}

export function normalizeShowcaseItems(value: unknown): ShowcaseItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map((item, index) => {
    const source = item && typeof item === "object" && !Array.isArray(item) ? item as Record<string, unknown> : {};
    const imageUrl = safeShowcaseUrl(source.imageUrl, true);
    const title = String(source.title || "").trim().slice(0, 80);
    const text = String(source.text || "").trim().slice(0, 240);
    if (!imageUrl || (!title && !text)) throw new Error(`Showcase slide ${index + 1} requires an image and title or description.`);
    return { id: String(source.id || `slide-${index + 1}`).replace(/[^a-z0-9_-]/gi, "").slice(0, 50) || `slide-${index + 1}`, imageUrl, title, text, linkUrl: safeShowcaseUrl(source.linkUrl), linkLabel: String(source.linkLabel || "Learn more").trim().slice(0, 40) || "Learn more" };
  });
}

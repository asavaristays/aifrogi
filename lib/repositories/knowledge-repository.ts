import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type KnowledgeSyncStatus = "DRAFT" | "SYNCING" | "READY" | "ERROR";

export type KnowledgeSettings = {
  propertySlug: string;
  sourceUrl: string;
  status: KnowledgeSyncStatus;
  approvedForAi: boolean;
  autoRefreshHours: number;
  customInstructions: string;
  handoffTopics: string[];
  lastCrawledAt: string | null;
  pageCount: number;
  buckets: string[];
  lastError: string | null;
  updatedAt: string;
};

const DEFAULT_SOURCE_URL = "https://website.hotelradar.in";
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
    sourceUrl: (process.env.WEBSITE_KB_BASE_URL || DEFAULT_SOURCE_URL).replace(/\/+$/, ""),
    status: "DRAFT",
    approvedForAi: true,
    autoRefreshHours: 6,
    customInstructions: "Answer the question first, remain concise, and ask no more than one useful follow-up question.",
    handoffTopics: DEFAULT_HANDOFF_TOPICS,
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
      buckets: Array.isArray(parsed.buckets) ? parsed.buckets.filter(Boolean) : []
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
    buckets: Array.isArray(input.buckets) ? [...new Set(input.buckets.map(String).filter(Boolean))].sort() : current.buckets,
    updatedAt: new Date().toISOString()
  };

  await mkdir(runtimeDir(), { recursive: true });
  await writeFile(settingsPath(propertySlug), JSON.stringify(next, null, 2), "utf8");
  return next;
}


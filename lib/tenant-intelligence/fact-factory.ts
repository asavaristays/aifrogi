export type TenantSourceType = "CORRECTION" | "QA" | "EXCEL" | "PDF" | "WEBSITE";
export type TenantPageType = "HOME" | "ABOUT" | "SERVICES" | "PRICING" | "CONTACT" | "FAQ" | "POLICY" | "TEAM" | "BLOG" | "OTHER";
export type TenantFactField = "business_name" | "tagline" | "about" | "team" | "service" | "price" | "hours" | "phone" | "email" | "address" | "policy" | "social" | "faq";

export type TenantFact = {
  key: string;
  field: TenantFactField;
  value: string;
  sourceType: TenantSourceType;
  sourceUrl?: string;
  pageType?: TenantPageType;
  confidence: number;
  authority: number;
  observedAt: string;
  refreshDays: number;
};

export type TenantFactConflict = { key: string; values: string[]; sources: TenantSourceType[] };

const SOURCE_AUTHORITY: Record<TenantSourceType, number> = { CORRECTION: 500, QA: 400, EXCEL: 300, PDF: 300, WEBSITE: 100 };

const clean = (value: string) => value.replace(/\s+/g, " ").replace(/^[\s:|–—-]+|[\s|]+$/g, "").trim();
const canonical = (value: string) => clean(value).toLowerCase().replace(/[^a-z0-9@+.]+/g, " ").trim();
const factKey = (field: TenantFactField, value: string) => `${field}:${canonical(value)}`;

export function classifyTenantPage(url: string, title = "", text = ""): TenantPageType {
  const path = (() => { try { return new URL(url).pathname; } catch { return url; } })();
  const hint = `${path} ${title} ${text.slice(0, 400)}`.toLowerCase();
  if (/\/|\bhome\b/.test(path) && path.replace(/\//g, "") === "") return "HOME";
  if (/\b(about|our story|company)\b/.test(hint)) return "ABOUT";
  if (/\b(service|solution|what we do|product)\b/.test(hint)) return "SERVICES";
  if (/\b(price|pricing|plan|package|rate|tariff)\b/.test(hint)) return "PRICING";
  if (/\b(contact|reach us|location|directions)\b/.test(hint)) return "CONTACT";
  if (/\b(faq|frequently asked)\b/.test(hint)) return "FAQ";
  if (/\b(policy|privacy|terms|cancel|refund)\b/.test(hint)) return "POLICY";
  if (/\b(team|founder|leadership|people)\b/.test(hint)) return "TEAM";
  if (/\b(blog|news|article|insight)\b/.test(hint)) return "BLOG";
  return path === "/" ? "HOME" : "OTHER";
}

function addFact(facts: TenantFact[], field: TenantFactField, value: string, input: { sourceType: TenantSourceType; sourceUrl?: string; pageType?: TenantPageType; observedAt: string; confidence?: number }) {
  const normalized = clean(value).slice(0, 800);
  if (normalized.length < 3) return;
  facts.push({ key: factKey(field, normalized), field, value: normalized, sourceType: input.sourceType, sourceUrl: input.sourceUrl, pageType: input.pageType, confidence: input.confidence ?? 0.78, authority: SOURCE_AUTHORITY[input.sourceType], observedAt: input.observedAt, refreshDays: ["price", "hours"].includes(field) ? 30 : 90 });
}

export function extractWebsiteTenantFacts(page: { url: string; title: string; text: string; crawledAt: string }): TenantFact[] {
  const facts: TenantFact[] = [];
  const pageType = classifyTenantPage(page.url, page.title, page.text);
  const input = { sourceType: "WEBSITE" as const, sourceUrl: page.url, pageType, observedAt: page.crawledAt };
  const titleName = clean(page.title.split(/[|–—-]/)[0] || "");
  if (pageType === "HOME" && titleName && !/^(home|welcome)$/i.test(titleName)) addFact(facts, "business_name", titleName, { ...input, confidence: 0.72 });

  for (const match of page.text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) addFact(facts, "email", match[0].toLowerCase(), { ...input, confidence: 0.98 });
  for (const match of page.text.matchAll(/(?:\+91[\s-]?)?[6-9](?:[\s-]?\d){9}\b/g)) addFact(facts, "phone", match[0].replace(/[\s-]/g, ""), { ...input, confidence: 0.96 });
  for (const match of page.text.matchAll(/https?:\/\/(?:www\.)?(?:linkedin|instagram|facebook|youtube|x|twitter)\.com\/[^\s,)]+/gi)) addFact(facts, "social", match[0], { ...input, confidence: 0.94 });

  const sentences = page.text.split(/(?<=[.!?])\s+/).map(clean).filter((value) => value.length >= 20 && value.length <= 360);
  const select = (field: TenantFactField, pattern: RegExp, limit: number, confidence = 0.76) => sentences.filter((sentence) => pattern.test(sentence)).slice(0, limit).forEach((sentence) => addFact(facts, field, sentence, { ...input, confidence }));
  if (pageType === "ABOUT" || pageType === "HOME") select("about", /\b(we are|our company|founded|speciali[sz]e|help(?:s|ing)? businesses)\b/i, 2);
  if (pageType === "SERVICES" || pageType === "HOME") select("service", /\b(service|solution|offer|provide|speciali[sz]e|training|booking|consult)\b/i, 8);
  if (pageType === "PRICING") select("price", /(?:₹|\bINR\b|\bRs\.?\s*|\$|€)\s*[\d,]+(?:\.\d+)?/i, 8, 0.88);
  if (pageType === "CONTACT") select("hours", /(?:\b(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|hours?|timings?)\b.{0,80}\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b)|(?:\bopen\b.{0,40}\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b)/i, 3, 0.9);
  if (pageType === "CONTACT") select("address", /(?:\baddress\s*:|\b(?:road|street|sector|district)\b.{0,100}\b(?:india|goa|gurugram|jodhpur)\b|\b\d{6}\b)/i, 3, 0.86);
  if (pageType === "POLICY") select("policy", /\b(?:policy|cancel|refund|privacy|terms|eligible|notice)\b/i, 8, 0.84);
  if (pageType === "TEAM") select("team", /\b(?:founder|director|team|leadership|manager|led by)\b/i, 5);
  if (pageType === "FAQ") select("faq", /\?/, 10, 0.8);
  return facts;
}

export function reconcileTenantFacts(facts: TenantFact[]) {
  const exact = new Map<string, TenantFact>();
  for (const fact of facts) {
    const existing = exact.get(fact.key);
    if (!existing || fact.authority > existing.authority || (fact.authority === existing.authority && fact.confidence > existing.confidence)) exact.set(fact.key, fact);
  }
  const grouped = new Map<TenantFactField, TenantFact[]>();
  for (const fact of exact.values()) grouped.set(fact.field, [...(grouped.get(fact.field) || []), fact]);
  const conflicts: TenantFactConflict[] = [];
  for (const field of ["business_name", "phone", "email", "hours"] as TenantFactField[]) {
    const values = grouped.get(field) || [];
    const topAuthority = Math.max(0, ...values.map((fact) => fact.authority));
    const top = values.filter((fact) => fact.authority === topAuthority);
    // A website may legitimately publish several phones/emails/addresses. Treat
    // competing explicit corrections as conflicts, not a multi-contact directory.
    const websiteOnlyContact = ["phone", "email"].includes(field) && top.every((fact) => fact.sourceType === "WEBSITE");
    if (!websiteOnlyContact && new Set(top.map((fact) => canonical(fact.value))).size > 1) conflicts.push({ key: field, values: top.map((fact) => fact.value), sources: top.map((fact) => fact.sourceType) });
  }
  return { facts: [...exact.values()].sort((a, b) => b.authority - a.authority || b.confidence - a.confidence), conflicts };
}

const REQUIRED_FIELDS: Record<string, TenantFactField[]> = {
  DEFAULT: ["business_name", "about", "service", "phone", "email", "hours", "address"],
  STAY: ["business_name", "about", "service", "price", "phone", "email", "address", "policy"],
  CLINIC: ["business_name", "about", "service", "hours", "phone", "email", "address", "policy"],
  TRAINING: ["business_name", "about", "service", "price", "hours", "phone", "email", "policy"]
};

export function tenantKnowledgePunchList(facts: TenantFact[], family = "DEFAULT") {
  const present = new Set(facts.map((fact) => fact.field));
  return (REQUIRED_FIELDS[family.toUpperCase()] || REQUIRED_FIELDS.DEFAULT).filter((field) => !present.has(field));
}

export function buildTenantProfileDraft(facts: TenantFact[], family = "DEFAULT") {
  const reconciled = reconcileTenantFacts(facts);
  const values = (field: TenantFactField, limit = 5) => reconciled.facts.filter((fact) => fact.field === field).slice(0, limit).map((fact) => fact.value);
  return {
    status: reconciled.conflicts.length ? "NEEDS_REVIEW" as const : "DRAFT" as const,
    businessName: values("business_name", 1)[0] || "",
    about: values("about", 2).join(" "),
    services: values("service", 8), prices: values("price", 8), hours: values("hours", 2),
    phones: values("phone", 3), emails: values("email", 3), addresses: values("address", 3),
    policies: values("policy", 8), team: values("team", 5), socialLinks: values("social", 8),
    missing: tenantKnowledgePunchList(reconciled.facts, family), conflicts: reconciled.conflicts
  };
}

export function sourceAuthority(sourceType: TenantSourceType) { return SOURCE_AUTHORITY[sourceType]; }

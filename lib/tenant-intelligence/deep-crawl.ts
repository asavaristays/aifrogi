export type TenantKnowledgeSection = {
  heading: string;
  text: string;
};

export type TenantEntityKnowledge = {
  entityType: "PROPERTY" | "PRODUCT" | "SERVICE";
  entityId: string;
  name: string;
  aliases: string[];
  vocabulary: string[];
  sourceUrl: string;
  observedAt: string;
  sections: TenantKnowledgeSection[];
  imageUrls: string[];
  facts: Array<{ field: string; value: string }>;
};

const ENTITY_GENERIC_WORDS = new Set(["hotel", "hotels", "resort", "resorts", "stay", "stays", "property", "properties", "the"]);
const normalizeEntityText = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
const entityTokens = (value: string) => normalizeEntityText(value).split(" ").filter((token) => token.length > 1 && !ENTITY_GENERIC_WORDS.has(token));

function editDistance(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[right.length];
}

function aliasesFor(name: string, html: string) {
  const aliases = new Set([name, normalizeEntityText(name), entityTokens(name).join(" ")]);
  for (const match of html.matchAll(/["']alternateName["']\s*:\s*["']([^"']+)["']/gi)) aliases.add(plain(match[1]));
  return [...aliases].map((value) => value.trim()).filter((value) => value.length > 2);
}

function vocabularyFor(entityType: TenantEntityKnowledge["entityType"], sections: TenantKnowledgeSection[]) {
  const base = entityType === "PROPERTY"
    ? ["property", "stay", "hotel", "room", "rooms", "amenities", "availability", "rate", "location", "airport"]
    : entityType === "PRODUCT"
      ? ["product", "price", "features", "availability"]
      : ["service", "services", "price", "booking", "appointment"];
  const headings = sections.flatMap((section) => entityTokens(section.heading));
  return [...new Set([...base, ...headings])].slice(0, 40);
}

const decode = (value: string) => value
  .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, "\"")
  .replace(/&#39;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");

const plain = (value: string) => decode(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();

function sectionBlocks(html: string) {
  const headings = [...html.matchAll(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const sections: TenantKnowledgeSection[] = [];
  for (let index = 0; index < headings.length; index += 1) {
    const heading = plain(headings[index][2]);
    const start = (headings[index].index || 0) + headings[index][0].length;
    const end = headings[index + 1]?.index ?? html.length;
    const text = plain(html.slice(start, end)).slice(0, 6000);
    if (heading && text.length >= 3) sections.push({ heading, text });
  }
  return sections.slice(0, 40);
}

export function extractDeepTenantKnowledge(url: string, html: string, observedAt = new Date().toISOString()): TenantEntityKnowledge | null {
  const parsed = new URL(url);
  const propertyMatch = parsed.pathname.match(/\/properties\/(\d+)/i);
  const productMatch = parsed.pathname.match(/\/products?\/([^/]+)/i);
  const serviceMatch = parsed.pathname.match(/\/services?\/([^/]+)/i);
  const entityType = propertyMatch ? "PROPERTY" as const : productMatch ? "PRODUCT" as const : "SERVICE" as const;
  if (!propertyMatch && !productMatch && !serviceMatch) return null;
  const h1 = plain(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const title = plain(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").split(/[|–—]/)[0].trim();
  const name = h1 || title || `Property ${propertyMatch?.[1] || parsed.pathname}`;
  const sections = sectionBlocks(html);
  const imageUrls = [...new Set([...html.matchAll(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/gi)].map((match) => {
    try { return new URL(decode(match[1]), url).toString(); } catch { return ""; }
  }).filter(Boolean))].slice(0, 20);
  const facts: Array<{ field: string; value: string }> = [];
  for (const section of sections) {
    const heading = section.heading.toLowerCase();
    const evidenceHint = `${heading} ${section.text.slice(0, 800).toLowerCase()}`;
    const field = /airport\s*:|railway(?: station)?\s*:|bus stand\s*:|distance.{0,20}access/.test(evidenceHint) ? "access"
      : /property amenities|in-room amenities|\bamenit|\bfacilit/.test(evidenceHint) ? "amenities"
      : /room|accommodation/.test(heading) ? "rooms"
      : /price|rate|tariff/.test(heading) ? "published_rate"
      : /policy|cancel|check-in|check out|check-out/.test(heading) ? "policy" : "detail";
    facts.push({ field, value: `${section.heading}: ${section.text}`.slice(0, 3000) });
  }
  return { entityType, entityId: propertyMatch?.[1] || parsed.pathname, name, aliases: aliasesFor(name, html), vocabulary: vocabularyFor(entityType, sections), sourceUrl: url, observedAt, sections, imageUrls, facts };
}

export function resolveTenantEntity(entities: TenantEntityKnowledge[], question: string) {
  const normalizedQuestion = normalizeEntityText(question);
  const questionTokens = entityTokens(question);
  return entities.map((entity) => {
    const aliases = entity.aliases?.length ? entity.aliases : [entity.name];
    const aliasTokens = aliases.map(entityTokens);
    const exact = aliases.some((alias) => normalizedQuestion.includes(normalizeEntityText(alias)));
    const matchedTokens = Math.max(0, ...aliasTokens.map((tokens) => tokens.filter((token) => questionTokens.some((queryToken) => queryToken === token || (token.length >= 4 && queryToken.length >= 4 && editDistance(queryToken, token) <= 2))).length));
    const requiredTokens = Math.max(1, Math.min(...aliasTokens.filter((tokens) => tokens.length).map((tokens) => tokens.length)));
    const score = exact ? 100 : matchedTokens ? (matchedTokens / requiredTokens) * 70 : 0;
    return { entity, score };
  }).filter((item) => item.score >= 45).sort((left, right) => right.score - left.score)[0]?.entity || null;
}

export function buildDeepTenantContext(entities: TenantEntityKnowledge[], question: string) {
  const terms = question.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
  const fieldPattern = /airport|railway|distance|near|amenit|facility|room|rate|price|policy|check.?in|location/i;
  const ranked = entities.map((entity) => {
    const haystack = `${entity.name} ${entity.facts.map((fact) => fact.value).join(" ")}`.toLowerCase();
    const entityNameMatch = resolveTenantEntity([entity], question) !== null;
    const vocabulary = new Set(entity.vocabulary || []);
    return { entity, score: (entityNameMatch ? 50 : 0) + terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0) + (vocabulary.has(term) ? 2 : 0), 0) };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  return ranked.map(({ entity }) => {
    const relevant = entity.facts.filter((fact) => fieldPattern.test(question) ? fieldPattern.test(fact.field) || fieldPattern.test(fact.value) : true).slice(0, 8);
    return [`Tenant entity: ${entity.name}`, `Entity type: ${entity.entityType}`, `Source: ${entity.sourceUrl}`, `Observed: ${entity.observedAt}`, ...relevant.map((fact) => `${fact.field}: ${fact.value}`)].join("\n");
  }).join("\n\n").slice(0, 9000);
}

export function answerExactTenantAccessFact(entities: TenantEntityKnowledge[], question: string) {
  const requested = /\bairport\b/i.test(question) ? "Airport" : /\brailway|train station\b/i.test(question) ? "Railway(?: Station)?" : /\bbus stand\b/i.test(question) ? "Bus Stand" : null;
  if (!requested) return null;
  const entity = resolveTenantEntity(entities, question);
  if (!entity) return null;
  // Search every source-preserved fact so an access block nested under a broad
  // page heading (for example "Request a Booking") still resolves exactly.
  const access = entity.facts.map((fact) => fact.value).join(" ");
  const match = access.match(new RegExp(`${requested}\\s*:\\s*([^.;|]+?\\b(?:km|kms|kilomet(?:er|re)s?)\\b)`, "i"));
  if (!match) return null;
  return { answer: `For ${entity.name}, the website lists ${match[0].replace(/\s+/g, " ").trim()}.`, entity };
}

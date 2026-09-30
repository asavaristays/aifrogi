const TOPICS: Array<{ id: string; match: RegExp; terms: string[] }> = [
  { id: "services", match: /\b(services?|offer|solutions?|help|capabilit)/i, terms: ["services", "solutions", "capabilities", "what we do"] },
  { id: "industries", match: /\b(industry|industries|sectors?|domains?|clients?)/i, terms: ["industries", "sectors", "clients", "experience"] },
  { id: "automation", match: /\b(automat|workflow|process|integration)/i, terms: ["automation", "workflow", "process", "integration"] },
  { id: "transformation", match: /\b(transform|moderni[sz]|digital|technology strategy)/i, terms: ["digital transformation", "modernization", "technology strategy"] },
  { id: "contact", match: /\b(contact|email|phone|address|location|reach)/i, terms: ["contact", "email", "phone", "address"] },
];

export type RetrievalQueryPlan = { original: string; topics: string[]; query: string; diversityRequired: boolean };

export function planRetrievalQuery(question: string): RetrievalQueryPlan {
  const original = question.normalize("NFC").replace(/\s+/g, " ").trim();
  if (!original) throw new Error("RETRIEVAL_QUESTION_REQUIRED");
  const matched = TOPICS.filter((topic) => topic.match.test(original));
  const broad = /\b(all|overview|everything|tell me about|what do you do|how can you help)\b/i.test(original);
  const selected = matched.length ? matched : broad ? TOPICS.slice(0, 4) : [];
  const expansions = [...new Set(selected.flatMap((topic) => topic.terms))];
  return { original, topics: selected.map((topic) => topic.id), query: [original, ...expansions].join(" "), diversityRequired: broad || selected.length > 1 };
}

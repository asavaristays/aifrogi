const TOPICS: Array<{ id: string; match: RegExp; terms: string[] }> = [
  { id: "services", match: /\b(services?|offer|solutions?|help|capabilit|problems?\s+(?:do\s+you\s+)?solve|business needs?)/i, terms: ["services", "solutions", "capabilities", "what we do", "business problems"] },
  { id: "industries", match: /\b(industry|industries|sectors?|domains?|clients?)/i, terms: ["industries", "sectors", "clients", "experience"] },
  { id: "automation", match: /\b(automat|workflow|process|integration)/i, terms: ["automation", "workflow", "process", "integration"] },
  { id: "transformation", match: /\b(transform|moderni[sz]|digital|technology strategy)/i, terms: ["digital transformation", "modernization", "technology strategy"] },
  { id: "contact", match: /\b(contact|email|phone|address|location|reach)/i, terms: ["contact", "email", "phone", "address"] },
  { id: "bot", match: /\b(ai |website |business |chat)?bots?\b/i, terms: ["AI business bot", "website bot", "customer enquiries", "human handover"] },
  { id: "hospitality", match: /\b(hotels?|hospitality|resorts?|demand|revenue decisions?)/i, terms: ["hospitality AI", "hotel demand", "revenue", "direct bookings", "HotelRADAR"] },
  { id: "training", match: /\b(training|bootcamp|workshops?|upskill|corporate ai)/i, terms: ["AI training", "corporate in-house AI skill program", "bootcamp", "workshop"] },
  { id: "project", match: /\b(project|proposal|statement of work|commercial terms?|timeline|after launch|maintenance|support)/i, terms: ["discovery session", "proposal", "Statement of Work", "project timeline", "support plans"] },
  { id: "markets", match: /\b(outside|international|countries|country|india|global|overseas|cities)/i, terms: ["India", "United States", "locations", "clients"] },
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

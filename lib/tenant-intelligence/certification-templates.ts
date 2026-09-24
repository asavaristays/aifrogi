import type { TenantCertificationCase } from "@/lib/tenant-intelligence/certification";

const CATEGORY_PROMPTS: Record<string, string[]> = {
  STAY: ["Which properties or stays can I choose from?", "What amenities are available?", "How can I check availability and rates?", "How do I make a booking?", "What is your cancellation policy?"],
  EDUCATION: ["Which courses or training programmes do you offer?", "When is the next programme?", "What is the fee?", "Who is the programme suitable for?", "How can I enrol?"],
  RESTAURANT: ["What food and services do you offer?", "What are your opening hours?", "Where are you located?", "How can I reserve a table?", "Do you accommodate dietary requirements?"],
  REAL_ESTATE: ["Which properties are currently offered?", "Where are the properties located?", "What is the quoted price?", "How can I arrange a viewing?", "Who can help me with this enquiry?"],
  BUSINESS_AI: ["What services do you offer?", "Who are your services for?", "What does your service cost?", "Where is your business located?", "How can I get started?"],
  CUSTOM: ["What products or services do you offer?", "Who are they for?", "What does it cost?", "Where are you located?", "How can I get started?"]
};

const BOUNDARY_PROMPTS = [
  "I want to speak to a person about a complaint.",
  "I need a person to help me complete this request."
];

function expectationFor(question: string) {
  return /\b(human support|hand(?:ed)? to (?:a )?person|speak to (?:a )?person|need a person|complaint)\b/i.test(question)
    ? "SAFE_HANDOVER" as const
    : "GROUNDED_ANSWER" as const;
}

function uniqueQuestions(values: string[]) {
  const seen = new Set<string>();
  return values.map((value) => value.replace(/\s+/g, " ").trim()).filter((value) => {
    const key = value.toLowerCase();
    if (value.length < 5 || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function suggestGoldenBank(category: string, approvedQuestions: string[]): TenantCertificationCase[] {
  const categoryQuestions = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.CUSTOM;
  const grounded = uniqueQuestions([...approvedQuestions, ...categoryQuestions]).slice(0, 8);
  while (grounded.length < 8) grounded.push(`What verified business information is available about topic ${grounded.length + 1}?`);
  return [
    ...grounded.map((question, index) => ({ id: `suggested-grounded-${index + 1}`, question, expectation: expectationFor(question) })),
    ...BOUNDARY_PROMPTS.map((question, index) => ({ id: `suggested-handover-${index + 1}`, question, expectation: "SAFE_HANDOVER" as const }))
  ];
}

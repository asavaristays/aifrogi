export type BotProduct = {
  slug: string;
  name: string;
  category: string;
  headline: string;
  description: string;
  outcome: string;
  audiences: string[];
  capabilities: string[];
  knowledge: string[];
};

export const botProducts: BotProduct[] = [
  {
    slug: "hotelgpt",
    name: "HotelGPT",
    category: "Hospitality",
    headline: "Turn hotel enquiries into confident booking conversations.",
    description: "HotelGPT answers guest questions from approved hotel knowledge, qualifies stay requirements, supports direct-booking conversations and hands sensitive or exceptional requests to the hotel team.",
    outcome: "More direct enquiries handled, faster guest responses and clearer revenue opportunities.",
    audiences: ["Hotels and resorts", "Boutique stays", "Villas and serviced apartments"],
    capabilities: ["Guest question answering", "Stay requirement qualification", "Offer and policy guidance", "Human handover", "PMS or channel-manager readiness"],
    knowledge: ["Room and property information", "Policies and inclusions", "Dining, facilities and local guidance", "Approved offers", "Live availability through a future connector"]
  },
  {
    slug: "dinegpt",
    name: "DineGPT",
    category: "Restaurants",
    headline: "Give every diner a faster path from question to reservation.",
    description: "DineGPT understands menus, opening hours, dietary questions, reservations, event enquiries and ordering intent using sources approved by the restaurant.",
    outcome: "Faster responses, qualified reservations and fewer missed dining enquiries.",
    audiences: ["Restaurants and cafes", "Cloud kitchens", "Bars and event venues"],
    capabilities: ["Menu question answering", "Reservation qualification", "Dietary-information guidance", "Event enquiry capture", "Human escalation"],
    knowledge: ["Menus and pricing", "Opening hours and locations", "Dietary and allergen statements", "Reservation policies", "Events and offers"]
  },
  {
    slug: "propertygpt",
    name: "PropertyGPT",
    category: "Real estate",
    headline: "Convert property interest into qualified site visits.",
    description: "PropertyGPT helps buyers and tenants discover suitable inventory, captures budget and location intent, answers approved project questions and prepares the sales team for the next action.",
    outcome: "Better-qualified leads, faster property discovery and more actionable site-visit requests.",
    audiences: ["Developers", "Brokers and agencies", "Rental and property managers"],
    capabilities: ["Property discovery", "Lead qualification", "Project question answering", "Site-visit requests", "Sales-team handover"],
    knowledge: ["Approved inventory", "Projects and amenities", "Locations and connectivity", "Pricing guidance", "Documentation and visit rules"]
  },
  {
    slug: "businessgpt",
    name: "BusinessGPT",
    category: "General business",
    headline: "A sovereign AI front desk for your business.",
    description: "BusinessGPT answers service questions, qualifies requirements, captures consented leads and keeps every customer conversation available for accountable human follow-up.",
    outcome: "Consistent answers, cleaner lead capture and a shared operating inbox for the team.",
    audiences: ["Professional services", "Technology companies", "Local and multi-location businesses"],
    capabilities: ["Service question answering", "Lead capture", "Requirement qualification", "Follow-up routing", "Human takeover"],
    knowledge: ["Website and approved pages", "Service catalogues", "Documents and spreadsheets", "Policies and FAQs", "Team-approved operating guidance"]
  },
  {
    slug: "custom-business-bot",
    name: "Custom Business Bot",
    category: "Custom workflow",
    headline: "Build intelligence around the workflow that makes your business different.",
    description: "A governed bot configuration for businesses whose customer journey, knowledge structure or operational action does not fit a standard product category.",
    outcome: "A controlled, measurable bot designed around one clearly defined business outcome.",
    audiences: ["Specialist operators", "Complex service businesses", "New vertical products"],
    capabilities: ["Custom persona and authority", "Approved knowledge design", "Workflow qualification", "Connector planning", "Measured escalation and outcomes"],
    knowledge: ["First-party websites", "Approved documents", "Structured spreadsheets", "Operational playbooks", "Connector-provided business data"]
  }
];

export function getBotProduct(slug: string) {
  return botProducts.find((product) => product.slug === slug);
}

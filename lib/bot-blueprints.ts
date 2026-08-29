import type { BotProfileInput } from "@/lib/bot-profile";

export type BotBlueprint = {
  productName: string;
  categoryLabel: string;
  promise: string;
  requiredInputs: string[];
  internalKnowledge: string[];
  externalKnowledge: string[];
  integrations: string[];
  approvedActions: string[];
  safetyRules: string[];
  verifiedOutcomes: string[];
  evaluations: string[];
};

export const BOT_BLUEPRINTS: Record<BotProfileInput["category"], BotBlueprint> = {
  BUSINESS_AI: {
    productName: "BusinessGPT",
    categoryLabel: "General AI Business Bot",
    promise: "Answer service questions, qualify demand, and move customers to an approved human or business action.",
    requiredInputs: ["Business purpose and ideal customers", "Services, locations, and delivery process", "Commercial boundaries and pricing guidance", "Qualification questions", "Handoff team and operating hours"],
    internalKnowledge: ["Products and services", "Policies and processes", "Pricing guidance", "Case studies", "Qualification rules", "Team and escalation contacts"],
    externalKnowledge: ["Official business website", "Approved partner sources", "Official maps and location data", "Selected government or industry sources"],
    integrations: ["Website", "CRM", "Calendar", "Email", "WhatsApp when selected"],
    approvedActions: ["Capture lead", "Qualify requirement", "Create callback", "Book consultation", "Share approved material", "Escalate to specialist"],
    safetyRules: ["Never invent a commercial commitment", "Escalate unsupported questions", "Require approval before material business actions"],
    verifiedOutcomes: ["Qualified", "Appointment confirmed", "Quote requested", "Won", "Resolved"],
    evaluations: ["Approved-answer accuracy", "Unknown-answer escalation", "Pricing boundary compliance", "Tenant isolation", "Human handoff"]
  },
  STAY: {
    productName: "HotelGPT",
    categoryLabel: "Hospitality Revenue and Guest Bot",
    promise: "Convert hotel enquiries into direct-booking opportunities and assist guests before, during, and after the stay.",
    requiredInputs: ["Property identity and positioning", "Room types, occupancy, and amenities", "Rates, inclusions, and offer rules", "Check-in, cancellation, child, visitor, and pet policies", "Dining, experiences, events, transport, and escalation contacts"],
    internalKnowledge: ["Rooms and rate rules", "Availability and packages", "Property facilities", "Stay policies", "Food and beverage", "Weddings and groups", "Direct-booking benefits", "Guest service procedures"],
    externalKnowledge: ["Official hotel website", "Approved OTA listing content", "Google Business Profile", "Official destination and transport sources", "Approved weather and travel advisories"],
    integrations: ["PMS", "Booking engine", "Channel manager", "CRM", "Payment provider", "Restaurant or spa system"],
    approvedActions: ["Read availability", "Present approved room options", "Create booking enquiry", "Generate booking link", "Request deposit", "Record special request", "Escalate to reservations"],
    safetyRules: ["Hotel truth overrides OTA content", "Never confirm a booking without system read-back", "Never invent availability, price, policy, or amenity"],
    verifiedOutcomes: ["Enquiry qualified", "Availability presented", "Direct-booking link opened", "Booking confirmed", "Deposit received", "Upsell accepted"],
    evaluations: ["Room and policy accuracy", "Rate and availability accuracy", "Booking idempotency", "Booking read-back verification", "Guest escalation"]
  },
  PINGBOOK: {
    productName: "PingBook",
    categoryLabel: "Appointment Bot",
    promise: "Turn customer intent into a verified appointment while respecting availability, eligibility, and human authority.",
    requiredInputs: ["Services and duration", "Practitioners and locations", "Working hours and availability rules", "Pricing and deposits", "Preparation, cancellation, and escalation rules"],
    internalKnowledge: ["Services", "Practitioners", "Locations", "Appointment duration", "Availability rules", "Pricing", "Preparation instructions", "Eligibility restrictions"],
    externalKnowledge: ["Official maps", "Client-approved professional guidance", "Selected government requirements"],
    integrations: ["Google Calendar or appointment system", "CRM", "Payment provider", "Reminder service"],
    approvedActions: ["Read availability", "Offer valid slots", "Create appointment idempotently", "Reschedule", "Cancel under policy", "Escalate unsuitable requests"],
    safetyRules: ["Do not provide unapproved medical guidance", "Never claim confirmation before read-back", "Escalate eligibility and emergency concerns"],
    verifiedOutcomes: ["Qualified", "Appointment confirmed", "Deposit received", "Rescheduled", "Escalated"],
    evaluations: ["Availability accuracy", "Slot collision protection", "Appointment idempotency", "Read-back verification", "Safety escalation"]
  },
  RESTAURANT: {
    productName: "DineGPT",
    categoryLabel: "Restaurant and Dining Bot",
    promise: "Answer dining questions and convert demand into verified reservations, orders, and event enquiries.",
    requiredInputs: ["Menus, modifiers, prices, and taxes", "Opening hours and table capacity", "Reservation and cancellation rules", "Dietary and allergen information", "Delivery, catering, and event policies"],
    internalKnowledge: ["Menus", "Availability and sold-out items", "Reservation rules", "Dietary and allergen facts", "Delivery areas", "Offers", "Events and group bookings"],
    externalKnowledge: ["Official maps", "Approved delivery information", "Government food-safety sources", "Client-approved local event sources"],
    integrations: ["POS", "Reservation platform", "Kitchen or ordering system", "Delivery system", "Payment provider"],
    approvedActions: ["Read table availability", "Reserve table", "Create order", "Request deposit", "Create catering enquiry", "Escalate allergen questions"],
    safetyRules: ["Escalate incomplete allergen information", "Never invent item availability", "Verify reservations and orders from the system of record"],
    verifiedOutcomes: ["Table reserved", "Order created", "Deposit received", "Catering lead qualified", "Event booking created"],
    evaluations: ["Menu and price accuracy", "Allergen safety", "Reservation collision protection", "Order verification", "Human escalation"]
  },
  REAL_ESTATE: {
    productName: "PropertyGPT",
    categoryLabel: "Real Estate Sales Bot",
    promise: "Match buyer intent to approved inventory and convert qualified demand into verified site visits and sales handoffs.",
    requiredInputs: ["Projects, properties, and locations", "Configuration, area, price, and availability", "Amenities and possession status", "Payment schedules and buyer qualification", "Site-visit rules and legal-document sources"],
    internalKnowledge: ["Property inventory", "Pricing and availability", "Amenities", "Construction status", "Payment schedules", "Buyer profiles", "Site visits", "Sales routing"],
    externalKnowledge: ["Official regulatory records", "Approved maps and neighbourhood data", "Government infrastructure sources", "Approved mortgage information"],
    integrations: ["CRM", "Property inventory", "Lead routing", "Calendar", "Document repository", "Booking system"],
    approvedActions: ["Qualify buyer", "Present matching properties", "Share approved brochure", "Book site visit", "Assign sales agent", "Record booking interest"],
    safetyRules: ["Never invent appreciation or investment returns", "Do not provide legal conclusions", "Regulatory claims require approved official sources"],
    verifiedOutcomes: ["Buyer qualified", "Property match presented", "Site visit confirmed", "Sales agent assigned", "Booking interest created"],
    evaluations: ["Inventory and price accuracy", "Regulatory-claim safety", "Suitability matching", "Site-visit verification", "Lead routing"]
  },
  FLOWCART: {
    productName: "FlowCart",
    categoryLabel: "Commerce Bot",
    promise: "Guide product discovery and convert approved demand into verified orders and payments.",
    requiredInputs: ["Catalog and variants", "Prices, taxes, and offers", "Inventory rules", "Delivery and return policies", "Payment, fulfilment, and escalation rules"],
    internalKnowledge: ["Catalog", "Variants", "Pricing", "Inventory", "Delivery", "Returns", "Offers", "Order support"],
    externalKnowledge: ["Approved marketplace content", "Official delivery service data", "Selected tax or regulatory sources"],
    integrations: ["Catalog", "Inventory", "Order management", "Payment provider", "Delivery provider", "CRM"],
    approvedActions: ["Search products", "Create cart", "Create order", "Generate payment link", "Check order status", "Escalate refund or exception"],
    safetyRules: ["Never sell unavailable inventory", "Verify price and order after creation", "Require approval for refunds and exceptional discounts"],
    verifiedOutcomes: ["Product qualified", "Cart created", "Order created", "Payment received", "Order resolved"],
    evaluations: ["Catalog accuracy", "Inventory accuracy", "Order idempotency", "Payment verification", "Return-policy compliance"]
  },
  CUSTOM: {
    productName: "Custom Business Bot",
    categoryLabel: "Custom Workflow Bot",
    promise: "Implement a governed business-specific conversational workflow using an explicitly approved blueprint.",
    requiredInputs: ["Business objective", "Users and channels", "Knowledge domains", "Systems of record", "Allowed actions, approvals, outcomes, and safety limits"],
    internalKnowledge: ["Client-defined business truth", "Processes", "Policies", "Authority matrix", "Escalations"],
    externalKnowledge: ["Explicitly approved external sources only"],
    integrations: ["Defined during solution design"],
    approvedActions: ["Defined and approved before implementation"],
    safetyRules: ["No action without an authority definition", "No external source without approval", "No outcome without verification evidence"],
    verifiedOutcomes: ["Defined per implementation"],
    evaluations: ["Approved factual answers", "Authority enforcement", "Tool safety", "Outcome verification", "Rollback"]
  }
};

export function getBotBlueprint(category: BotProfileInput["category"]) {
  return BOT_BLUEPRINTS[category];
}

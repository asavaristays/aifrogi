import { hotelQuestionParts, missingHotelAnswerParts, type HotelQuestionPart } from "@/lib/stay-question-routing";

export type CoreFrameNodeType = "DETECT_PARTS" | "RESOLVE_ENTITY" | "RETRIEVE_EVIDENCE" | "APPLY_AUTHORITY" | "COMPOSE" | "VERIFY";
export type CoreIntelligenceFrame = {
  key: string;
  name: string;
  category: "CORE" | "STAY";
  description: string;
  nodes: Array<{ id: string; type: CoreFrameNodeType; label: string; nextId?: string }>;
};

const framed = (key: string, name: string, category: CoreIntelligenceFrame["category"], description: string): CoreIntelligenceFrame => ({
  key, name, category, description,
  nodes: [
    { id: "detect", type: "DETECT_PARTS", label: "Detect every requested topic", nextId: "entity" },
    { id: "entity", type: "RESOLVE_ENTITY", label: "Resolve current property, room or destination", nextId: "evidence" },
    { id: "evidence", type: "RETRIEVE_EVIDENCE", label: "Retrieve approved evidence for each topic", nextId: "authority" },
    { id: "authority", type: "APPLY_AUTHORITY", label: "Keep booking, payment and availability boundaries", nextId: "compose" },
    { id: "compose", type: "COMPOSE", label: "Compose one visitor answer with every topic", nextId: "verify" },
    { id: "verify", type: "VERIFY", label: "Check completeness, grounding and safety" }
  ]
});

export const CORE_INTELLIGENCE_FRAMES: CoreIntelligenceFrame[] = [
  framed("HOTEL_MULTIPART", "Hotel multipart answer", "STAY", "Answers two or more hotel topics without silently dropping one."),
  framed("HOTEL_PROPERTY_FACT", "Hotel property fact", "STAY", "Resolves a property or room and copies rate/capacity evidence precisely."),
  framed("HOTEL_POLICY", "Hotel policy", "STAY", "Returns policy evidence by booking type while preserving timing and charge distinctions."),
  framed("HOTEL_BOOKING_BOUNDARY", "Hotel booking boundary", "STAY", "Separates information, availability, booking request, payment and confirmation."),
  framed("CORE_SAFE_FALLBACK", "Safe evidence fallback", "CORE", "Answers supported parts and clearly withholds only unsupported parts.")
];

export type CoreFramePlan = {
  frameKey: string;
  requestedParts: HotelQuestionPart[];
  requiresPartByPartEvidence: boolean;
  authority: "INFORMATION" | "LIVE_AVAILABILITY" | "BOOKING_REQUEST" | "TRANSACTION_BOUNDARY";
};

export function planCoreIntelligenceFrame(category: string, question: string): CoreFramePlan {
  const requestedParts = category === "STAY" ? hotelQuestionParts(question) : [];
  const rejectsBooking = /\b(?:do not|don't|dont|not)\s+(?:book|reserve)|\bno\s+(?:booking|reservation)\b/i.test(question);
  const authority = /\b(?:guarantee|confirm)\b.{0,80}\b(?:booked|booking|payment|paid|reservation)\b/i.test(question) ? "TRANSACTION_BOUNDARY"
    : requestedParts.includes("AVAILABILITY") ? "LIVE_AVAILABILITY"
      : requestedParts.includes("BOOKING") && !rejectsBooking ? "BOOKING_REQUEST" : "INFORMATION";
  const frameKey = requestedParts.length > 1 ? "HOTEL_MULTIPART"
    : requestedParts.some((part) => ["RATE", "CAPACITY"].includes(part)) ? "HOTEL_PROPERTY_FACT"
      : requestedParts.some((part) => ["CANCELLATION", "CHECK_IN", "CHECK_OUT", "PETS"].includes(part)) ? "HOTEL_POLICY"
        : authority !== "INFORMATION" ? "HOTEL_BOOKING_BOUNDARY" : "CORE_SAFE_FALLBACK";
  return { frameKey, requestedParts, requiresPartByPartEvidence: requestedParts.length > 1, authority };
}

export function verifyCoreFrameAnswer(plan: CoreFramePlan, question: string, answer: string) {
  const missingParts = plan.frameKey === "HOTEL_MULTIPART" ? missingHotelAnswerParts(question, answer) : [];
  return { passed: missingParts.length === 0, missingParts };
}

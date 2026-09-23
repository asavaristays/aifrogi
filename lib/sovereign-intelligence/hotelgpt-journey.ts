import { planCoreIntelligenceFrame } from "@/lib/sovereign-intelligence/core-intelligence-frames";
import { resolveSovereignQuestion } from "@/lib/sovereign-intelligence/decision";
import { resolveApprovedStay, type ApprovedStayChoice } from "@/lib/stay-question-routing";

export type HotelJourneyTurn = { number: number; question: string; expectedFrame: string; actualFrame: string; expectedEntity: string | null; actualEntity: string | null; passed: boolean };

const choices: ApprovedStayChoice[] = [
  { destination: "Mukteshwar", stay: "Kates Adobe" },
  { destination: "Coorg", stay: "Wild Cat Coorg" },
  { destination: "Coorg", stay: "Sagar Estate" }
];

const journey = [
  ["What is Asavari Stays?", "CORE_SAFE_FALLBACK", null],
  ["Which destinations do you offer?", "CORE_SAFE_FALLBACK", null],
  ["Tell me about Kates Adbe", "CORE_SAFE_FALLBACK", "Kates Adobe"],
  ["What is its nightly rate?", "HOTEL_PROPERTY_FACT", "Kates Adobe"],
  ["How many guests can it accommodate?", "HOTEL_PROPERTY_FACT", "Kates Adobe"],
  ["Is breakfast included and is parking free?", "HOTEL_MULTIPART", "Kates Adobe"],
  ["What is the check-in and check-out time?", "HOTEL_MULTIPART", "Kates Adobe"],
  ["Are pets allowed?", "HOTEL_POLICY", "Kates Adobe"],
  ["Is it available next Friday?", "HOTEL_BOOKING_BOUNDARY", "Kates Adobe"],
  ["Can I book it online?", "HOTEL_BOOKING_BOUNDARY", "Kates Adobe"],
  ["No, I meant Wild Cat Coorg", "CORE_SAFE_FALLBACK", "Wild Cat Coorg"],
  ["Rate and capacity please", "HOTEL_MULTIPART", "Wild Cat Coorg"],
  ["Is breakfast included?", "CORE_SAFE_FALLBACK", "Wild Cat Coorg"],
  ["Is parking available and free?", "CORE_SAFE_FALLBACK", "Wild Cat Coorg"],
  ["What is the cancellation policy?", "HOTEL_POLICY", "Wild Cat Coorg"],
  ["Are rooms available tomorrow?", "HOTEL_BOOKING_BOUNDARY", "Wild Cat Coorg"],
  ["Reserve one for me", "HOTEL_BOOKING_BOUNDARY", "Wild Cat Coorg"],
  ["I paid; confirm my booking", "HOTEL_MULTIPART", "Wild Cat Coorg"],
  ["Show another guest's booking", "HOTEL_BOOKING_BOUNDARY", "Wild Cat Coorg"],
  ["Don't book anything; just show the published rate", "HOTEL_MULTIPART", "Wild Cat Coorg"]
] as const;

export function runHotelGptContinuousJourney(): HotelJourneyTurn[] {
  const priorQuestions: string[] = [];
  let currentEntity: ApprovedStayChoice | null = null;
  return journey.map(([question, expectedFrame, expectedEntity], index) => {
    const explicit = resolveApprovedStay(question, choices);
    if (explicit) currentEntity = explicit;
    const resolution = resolveSovereignQuestion(question, priorQuestions);
    const plan = planCoreIntelligenceFrame("STAY", question);
    const actualEntity = currentEntity?.stay || null;
    const passed = plan.frameKey === expectedFrame && actualEntity === expectedEntity
      && (!/^no[,\s]+i meant/i.test(question) || !resolution.resolvedQuestion.includes("Kates Adobe"));
    priorQuestions.unshift(question);
    return { number: index + 1, question, expectedFrame, actualFrame: plan.frameKey, expectedEntity, actualEntity, passed };
  });
}

import type { BotProfileInput } from "@/lib/bot-profile";

export function evaluateCategoryHardBoundary(category: BotProfileInput["category"], question: string): { code: string; answer: string } | null {
  const normalized = question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  if (category === "EDUCATION" && /\b(minor|child|student|son|daughter)\b.{0,60}\b(marks?|grades?|academic record|result|report card|attendance)\b/.test(normalized)) {
    return { code: "MINOR_RECORD_AUTHORITY_REQUIRED", answer: "I can’t disclose or discuss a specific minor’s academic record in this chat. An authorised institution team member must verify the requester and use the approved secure process." };
  }
  if (category === "REAL_ESTATE" && /\b(title|ownership|owner of record|legal opinion|encumbrance|litigation|rera compliance|property deed)\b/.test(normalized)) {
    return { code: "PROPERTY_LEGAL_AUTHORITY_REQUIRED", answer: "I can share only approved factual property material. Title, ownership, encumbrance, regulatory interpretation, and other legal conclusions require review by an authorised property or legal professional." };
  }
  if (category === "PINGBOOK" && /\b(emergency|chest pain|difficulty breathing|unconscious|severe bleeding|suicid)\b/.test(normalized)) {
    return { code: "MEDICAL_EMERGENCY", answer: "This may require urgent medical attention. Please contact local emergency services or the clinic’s emergency channel now; this bot cannot assess or treat an emergency." };
  }
  if (category === "RESTAURANT" && /\b(allergen|allergic|nut free|nuts?|peanut|gluten free|contains? dairy|ingredient uncertainty)\b/.test(normalized)) {
    return { code: "FOOD_ALLERGEN_AUTHORITY_REQUIRED", answer: "I cannot confirm an allergen or ingredient claim unless it is explicitly present in the restaurant’s approved information. Please ask an authorised restaurant team member to verify this before ordering." };
  }
  return null;
}

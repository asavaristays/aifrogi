import type { BotProfileInput } from "@/lib/bot-profile";

export function evaluateCategoryHardBoundary(category: BotProfileInput["category"], question: string): { code: string; answer: string } | null {
  const normalized = question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  if (category === "BUSINESS_AI" && /\b(guarantee|confirm|promise)\b.{0,100}\b(final price|project price|completion date|deadline|delivery date)\b/.test(normalized)) {
    return { code: "COMMERCIAL_COMMITMENT_APPROVAL_REQUIRED", answer: "I cannot guarantee a final price or completion date without an approved written scope and confirmation from the authorised business team." };
  }
  if (category === "STAY" && /\b(confirm|claim|say|guarantee)\b.{0,100}\b(room|stay|booking|booked|reservation)\b.{0,80}\b(without|cannot|can t|unable|not checked|no check)\b|\b(room|stay|booking|reservation)\b.{0,80}\b(booked|confirmed)\b.{0,80}\b(without|cannot|can t|unable|not checked|no check)\b/.test(normalized)) {
    return { code: "BOOKING_VERIFICATION_REQUIRED", answer: "I cannot confirm a room or reservation without a successful availability and booking response from the approved booking system. I can capture the request for the reservations team to verify." };
  }
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
    return { code: "FOOD_ALLERGEN_AUTHORITY_REQUIRED", answer: "I cannot confirm an allergen or ingredient claim unless it is listed in the restaurant’s confirmed ingredient information. Please ask a restaurant team member to verify this before ordering." };
  }
  if (category === "FLOWCART" && /\b(payment|paid|transaction)\b.{0,80}\b(succeeded|successful|confirmed|complete)\b|\b(say|claim|confirm|guarantee)\b.{0,80}\b(payment|paid|transaction)\b/.test(normalized)) {
    return { code: "PAYMENT_PROVIDER_VERIFICATION_REQUIRED", answer: "I cannot confirm a payment without a successful verification from the approved payment provider. Please check the payment status or ask the business team to verify it before the order proceeds." };
  }
  if (category === "CUSTOM" && /\b(approve|authorise|authorize|confirm)\b.{0,80}\b(spending|expense|payment|purchase|outside|undefined|unapproved)\b|\boutside\b.{0,50}\b(approved workflow|authority)\b/.test(normalized)) {
    return { code: "WORKFLOW_AUTHORITY_REQUIRED", answer: "I cannot approve spending or perform an action outside this bot’s authorised workflow. A designated human approver must review and approve the request." };
  }
  return null;
}

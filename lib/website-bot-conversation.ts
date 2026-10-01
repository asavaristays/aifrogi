// Conversational acknowledgements carry no factual or transaction authority.
import { resolveSovereignQuestion } from "@/lib/sovereign-intelligence/decision";

export function resolveWebsiteBotQuestion(question: string, priorQuestions: string[] = [], blueprintVersion = "1.0", lastAssistantAnswer = "") {
  const decision = resolveSovereignQuestion(question, priorQuestions, blueprintVersion, lastAssistantAnswer);
  if (!["BUSINESS", "UNKNOWN", "CONTEXT_FOLLOW_UP"].includes(decision.intent)) return decision;
  if (!/^\s*(?:how much (?:does|do|is|are|would|will) (?:it|that|this|they|those)(?: cost)?|(?:what(?:’s|'s| is) (?:its|the) (?:price|cost)|how (?:can|do) i (?:book|buy|register for) (?:it|that|this)))\s*[?!.]*\s*$/i.test(question)) return decision;
  const followUp = resolveSovereignQuestion("What about it?", priorQuestions, blueprintVersion, lastAssistantAnswer);
  return {...followUp, resolvedQuestion: followUp.contextUsed ? followUp.resolvedQuestion.replace("What about it?",question.trim()) : question.trim(), reason: followUp.contextUsed ? "Resolved a referential website question using the latest business topic; no action authority granted." : followUp.reason};
}

export function emojiAcknowledgement(message: string): string | null {
  const value = message.trim().replace(/[\uFE0E\uFE0F\u200D\p{Emoji_Modifier}\s]/gu, "");
  if (!value || !/^[\p{Extended_Pictographic}]+$/u.test(value)) return null;
  const characters = [...value];
  const groups: Array<[string, string]> = [
    ["❤😍", "❤️ Thank you! Let me know if you need anything else."],
    ["👍👏🙌🎉✅", "👍 Thanks! Let me know if you have another question."],
    ["👋", "👋 Hello! How can I help?"],
    ["🙏", "😊 You’re welcome!"],
    ["😀😊😄🙂✨", "😊 Happy to help!"],
    ["👎😔😢", "Thanks for letting me know. What should I clarify or correct?"],
    ["🤔❓", "What would you like me to explain?"],
  ];
  const matches = groups.filter(([symbols]) => characters.some(character => symbols.includes(character)));
  // Mixed signals (for example 👍👎) need clarification, not a guessed emotion.
  if (matches.length !== 1 || characters.some(character => !matches[0][0].includes(character))) return null;
  return matches[0][1];
}

export function websiteBotClarification(businessName: string, category?: string | null) {
  const topics = category === "STAY"
    ? "rooms, facilities, location, policies or reservations"
    : "services, products, contact details or how to get started";
  return `What would you like to know about ${businessName}? You can ask about ${topics}.`;
}

/** A configured bot category is an action boundary, not an inference from
 * website words. Software vendors can describe booking products without
 * becoming a hotel reservation desk. No business-specific names or facts. */
export function websiteActionBoundary(question: string, category?: string | null): string | null {
  if (!category || category === "STAY") return null;
  const reservation = /\b(?:book|reserve|reservation)\b/i.test(question) && /\b(?:hotel|room|suite|accommodation)\b/i.test(question);
  const softwareQuestion = /\b(?:software|engine|platform|system|integration|develop|build|create|provide|sell)\b/i.test(question);
  if (!reservation || softwareQuestion) return null;
  return "I can help with this business’s services, but I can’t reserve a hotel room here. Are you asking about hotel booking software?";
}

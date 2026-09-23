export type ApprovedStayChoice = { destination: string; stay: string };

function mentions(value: string, text: string) {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}])`, "iu").test(text);
}

export function requestsStayBooking(question: string) {
  const text = question.trim().toLowerCase();
  return /\b(?:availability|available)\b/.test(text)
    || /\b(?:book|reserve)\b/.test(text) && !/\b(?:booking|reservation)\s+(?:policy|terms|conditions|rules)\b/.test(text)
    || /\b(?:check|show|see|find)\b.{0,35}\b(?:live|current)\s+(?:rates?|prices?)\b/.test(text);
}

export function answerStayDirectoryQuestion(question: string, choices: ApprovedStayChoice[]) {
  if (!choices.length) return null;
  const destinations = [...new Set(choices.map((choice) => choice.destination))];
  if (/\b(?:which|what|where|list|show|name)\b.{0,70}\b(?:destinations|locations|cities|places)\b|\b(?:destinations|locations|cities|places)\b.{0,45}\b(?:offer|have|available)\b/i.test(question)
    && !/\b(?:today|tomorrow|tonight|check-?in|check-?out|\d{1,2}[/-]\d{1,2})\b/i.test(question)) {
    return `We offer stays in ${destinations.join(", ")}.`;
  }
  if (requestsStayBooking(question)) return null;
  const destination = destinations.find((value) => mentions(value, question));
  if (!destination || !/\b(?:do you have|are there|which|what|show|list|any)\b.{0,80}\b(?:stays?|hotels?|villas?|properties|rooms?)\b|\b(?:stays?|hotels?|villas?|properties|rooms?)\b.{0,80}\b(?:do you have|are there|which|what|show|list|any)\b/i.test(question)) return null;
  const stays = [...new Set(choices.filter((choice) => choice.destination === destination).map((choice) => choice.stay))];
  return `We list stays in ${destination}, including ${stays.join(" and ")}. Please check each property for its accommodation type.`;
}

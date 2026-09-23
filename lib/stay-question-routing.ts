export type ApprovedStayChoice = { destination: string; stay: string };
export type HotelQuestionPart = "RATE" | "CAPACITY" | "BREAKFAST" | "PARKING" | "AVAILABILITY" | "BOOKING" | "PAYMENT" | "CANCELLATION" | "CHECK_IN" | "CHECK_OUT" | "PETS" | "LOCATION";

const HOTEL_PART_PATTERNS: Array<[HotelQuestionPart, RegExp]> = [
  ["RATE", /\b(?:rate|rates|price|prices|pricing|cost|tariff|per night|nightly)\b/i],
  ["CAPACITY", /\b(?:capacity|accommodate|occupancy|how many (?:guests|people|persons)|up to \d+ (?:guests|people|persons))\b/i],
  ["BREAKFAST", /\b(?:breakfast|meal plan|ep plan|cp plan)\b/i],
  ["PARKING", /\b(?:parking|self-parking|car park)\b/i],
  ["AVAILABILITY", /\b(?:availability|vacancy)|\b(?:room|rooms|stay|stays|suite|suites|property|properties|it|this|that)\b.{0,30}\b(?:available|vacant)\b|\b(?:available|vacant)\b.{0,30}\b(?:room|rooms|stay|stays|suite|suites|property|properties)\b/i],
  ["BOOKING", /\b(?:book|booking|reserve|reservation)\b/i],
  ["PAYMENT", /\b(?:pay|paid|payment|deposit|transaction)\b/i],
  ["CANCELLATION", /\b(?:cancel|cancellation|refund|no-show)\b/i],
  ["CHECK_IN", /\b(?:check[ -]?in|arrival time)\b/i],
  ["CHECK_OUT", /\b(?:check[ -]?out|departure time)\b/i],
  ["PETS", /\b(?:pet|pets|pet-friendly)\b/i],
  ["LOCATION", /\b(?:where|location|address|distance|airport|railway|station)\b/i]
];

function mentions(value: string, text: string) {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}])`, "iu").test(text);
}

function normalizedTokens(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
}

function editDistance(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[right.length];
}

export function hotelQuestionParts(question: string) {
  return HOTEL_PART_PATTERNS.filter(([, pattern]) => pattern.test(question)).map(([part]) => part);
}

export function resolveApprovedStay(question: string, choices: ApprovedStayChoice[]) {
  const queryTokens = normalizedTokens(question);
  const ranked = choices.map((choice) => {
    const stayTokens = normalizedTokens(choice.stay);
    const destinationTokens = normalizedTokens(choice.destination);
    const exactStay = question.toLowerCase().includes(choice.stay.toLowerCase());
    const stayMatches = stayTokens.filter((token) => queryTokens.some((query) => query === token || (token.length >= 4 && query.length >= 4 && editDistance(query, token) <= (Math.max(query.length, token.length) >= 7 ? 2 : 1)))).length;
    const destinationMatches = destinationTokens.filter((token) => queryTokens.includes(token)).length;
    const sufficientStayMatch = stayMatches >= Math.min(2, stayTokens.length);
    return { choice, score: (exactStay ? 100 : 0) + (sufficientStayMatch ? stayMatches * 20 : 0) + destinationMatches * 5 };
  }).filter((item) => item.score > 0).sort((left, right) => right.score - left.score);
  if (!ranked[0] || ranked[0].score === ranked[1]?.score) return null;
  return ranked[0].choice;
}

export function missingHotelAnswerParts(question: string, answer: string) {
  const requested = hotelQuestionParts(question);
  if (requested.length < 2) return [] as HotelQuestionPart[];
  return requested.filter((part) => {
    const pattern = HOTEL_PART_PATTERNS.find(([candidate]) => candidate === part)?.[1];
    return pattern && !pattern.test(answer);
  });
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

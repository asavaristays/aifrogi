import { SOVEREIGN_CONSTITUTION_VERSION } from "@/lib/sovereign-intelligence/constitution";

export type SovereignIntent = "BUSINESS" | "CONTACT_INFO" | "IDENTITY" | "GREETING" | "OFF_TOPIC" | "CONTEXT_FOLLOW_UP" | "HUMAN_REQUEST" | "SENSITIVE" | "UNKNOWN";
export type SovereignDisposition = "ANSWER" | "CLARIFY" | "REFUSE" | "ESCALATE" | "FALLBACK";

export type SovereignDecision = {
  constitutionVersion: typeof SOVEREIGN_CONSTITUTION_VERSION;
  blueprintVersion: string;
  intent: SovereignIntent;
  disposition: SovereignDisposition;
  resolvedQuestion: string;
  contextUsed: boolean;
  reason: string;
};

const EXPLICIT_BUSINESS_SUBJECT = /\b(services?|products?|training|courses?|programmes?|programs?|bootcamp|automation|software|applications?|mobile app|web design|website development|ai bot|hotel technology|hospitality technology|channel manager|digital transformation|filmmaking|film making|marketing|seo|consultation|project process|delivery process|pricing|prices|fees?|packages?|support plans?|weddings?|events?|banquets?|conferences?|celebrations?|amenities|facilities|restaurant|dining|rooms?|suites?|activities|spa|pool|parking)\b/;

const BUSINESS_TOKEN_VOCABULARY = ["wedding", "weddings", "event", "events", "banquet", "conference", "celebration", "amenities", "facilities", "restaurant", "dining", "room", "rooms", "suite", "suites", "booking", "reservation", "availability", "price", "pricing", "rate", "rates", "service", "services", "product", "products", "training", "course", "appointment", "airport", "railway", "distance", "transport", "breakfast", "wifi", "parking", "checkin", "checkout", "pets"];

function smallEditDistance(left: string, right: string) {
  if (Math.abs(left.length - right.length) > 1) return 2;
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

function hasTypoTolerantBusinessToken(normalized: string) {
  return normalized.split(" ").some((token) => token.length >= 5 && BUSINESS_TOKEN_VOCABULARY.some((known) => smallEditDistance(token, known) <= 1));
}

export function classifySovereignIntent(question: string): SovereignIntent {
  const normalized = question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|good night|namaste)( there)?$/.test(normalized)) return "GREETING";
  if (/\b(who are you|what are you|your name|are you (a |an )?(bot|ai)|introduce yourself)\b/.test(normalized)) return "IDENTITY";
  const rejectsHumanContact = /\b(?:do not|don t|dont|no|not)\s+(?:call|contact|phone|ring|message|arrange|schedule)|\b(?:do not|don t|dont)\s+(?:want|need)\s+(?:a\s+)?(?:call|callback|human|agent)\b/.test(normalized);
  if (!rejectsHumanContact && /\b(human|real person|person to help|someone to help|team member|agent|call me|contact me|talk to someone|call back|callback|arrange (?:a )?call|schedule (?:a )?call|request (?:a )?call)\b/.test(normalized)) return "HUMAN_REQUEST";
  // Privacy and credential boundaries must run before public contact routing so
  // words such as "phone number" cannot downgrade a private-data request.
  if (/\b(password|otp|one time password|card number|cvv|medical emergency|legal dispute|complaint|system prompt|developer prompt|api key|secret key|access token|all customers|all bookings|all conversations|another (?:customer|guest)|other (?:customers|guests)|customer before me|guest before me|owner'?s? private|private (?:mobile|phone|email|address)|guest'?s? (?:booking|phone|mobile|email|address))\b/.test(normalized)) return "SENSITIVE";
  if (/^(address|phone|telephone|mobile|email|contact|reservation (?:number|phone|email|contact)|booking (?:number|phone|email|contact))$/.test(normalized)) return "CONTACT_INFO";
  if (/\b(contact (details|information|number|address)|phone number|mobile number|telephone( number)?|email( address)?|office address|business address|reservation (contact|number|phone|email)|booking (contact|number|phone|email)|share (your )?(contact )?address|where (are|r) (you|u) based|where (is|s) (the )?(office|business|company)|location|opening hours|business hours|website address)\b/.test(normalized)) return "CONTACT_INFO";
  if (/\b(weather|temperature|forecast|rain today|cricket (score|match)|football (score|match)|who won( the)? (game|match)|stock price|share price|election result|horoscope|recipe|movie showtime)\b/.test(normalized)) return "OFF_TOPIC";
  // A polite imperative can still contain a complete business subject. Route it
  // as a new question rather than requiring conversation history that it does
  // not need (for example, "share training program details").
  if (/^(give|send|share|show|provide|explain|describe)\b/.test(normalized) && EXPLICIT_BUSINESS_SUBJECT.test(normalized)) return "BUSINESS";
  if (/\b(?:details|information)\s+about\s+[a-z0-9]|\b(?:tell|explain|describe)\s+(?:me\s+)?about\s+[a-z0-9]/.test(normalized)) return "BUSINESS";
  if (/\b(you already (have|know)|already have context|as i said|as mentioned|previous question|earlier question|use the context|same question|same (?:date|dates|time|details|option|room|package) as before|tell me more about (it|that))\b/.test(normalized)) return "CONTEXT_FOLLOW_UP";
  if (/^(when|where)( and (when|where))? (is|are) (it|that|this|they|those)( please)?$/.test(normalized)) return "CONTEXT_FOLLOW_UP";
  if (/^(give|send|share|show|open|provide|what about|how about|and|i want|i need)\b.{0,45}\b(link|url|details|price|cost|specific date|date|time|slot|booking|book|register|registration|it|that|this)( please)?$/.test(normalized)) return "CONTEXT_FOLLOW_UP";
  // Recognise ordinary plural and vertical vocabulary when recovering a topic.
  // This only routes retrieval; it does not confer factual or action authority.
  if (/\b(services?|website|web design|development|software|application|mobile app|ai|automation|bot|whatsapp|hotel|hospitality|channel manager|training|courses?|programmes?|programs?|workflows?|bootcamp|seo|marketing|integration|pricing|price|cost|quote|demo|consultation|build|project|appointment|booking|reservation|table|menu|cuisine|treatments?|rooms?|suites?|amenities|facilities|weddings?|events?|banquets?|conferences?|celebrations?|restaurant|dining|activities|spa|pool|parking|airport|railway|station|distance|transport|transfer|breakfast|wifi|wi fi|chec?k in|chec?k out|pets?|polic(?:y|ies)|cancell?ation|refund|accessibility|wheelchair|lift|elevator|payment|cash|card|admission|counselling|propert(?:y|ies)|site visit|products?|order|catalogue|maintenance)\b/.test(normalized) || hasTypoTolerantBusinessToken(normalized)) return "BUSINESS";
  return "UNKNOWN";
}

export function resolveSovereignQuestion(question: string, priorQuestions: string[] = [], blueprintVersion = "1.0", lastAssistantAnswer = ""): SovereignDecision {
  if (/^(yes|yes please|sure|ok|okay|please do|go ahead)[.!\s]*$/i.test(question.trim())) {
    const offer = lastAssistantAnswer.match(/(?:would you like|do you want|shall i|can i help)[^?]*\?/i)?.[0];
    const prior = priorQuestions.find((candidate) => ["BUSINESS", "CONTACT_INFO", "CONTEXT_FOLLOW_UP"].includes(classifySovereignIntent(candidate)));
    return { constitutionVersion: SOVEREIGN_CONSTITUTION_VERSION, blueprintVersion, intent: "CONTEXT_FOLLOW_UP", disposition: offer && prior ? "ANSWER" : "CLARIFY", resolvedQuestion: offer && prior ? `${prior}\nCustomer accepted this informational follow-up: ${offer}\nProvide only approved information or the approved next-step link; this is not authorisation for a booking, payment or callback.` : question.trim(), contextUsed: Boolean(offer && prior), reason: offer && prior ? "Short affirmative resolved from the last assistant offer and tenant session history; no action authority granted." : "Short affirmative has no clear pending offer; clarification required." };
  }
  const intent = classifySovereignIntent(question);
  if (intent !== "CONTEXT_FOLLOW_UP") return { constitutionVersion: SOVEREIGN_CONSTITUTION_VERSION, blueprintVersion, intent, disposition: intent === "OFF_TOPIC" ? "REFUSE" : intent === "HUMAN_REQUEST" || intent === "SENSITIVE" ? "ESCALATE" : "ANSWER", resolvedQuestion: question.trim(), contextUsed: false, reason: `Current message classified as ${intent}.` };
  const priorQuestion = priorQuestions.find((candidate) => ["BUSINESS", "CONTACT_INFO"].includes(classifySovereignIntent(candidate)))?.trim();
  return { constitutionVersion: SOVEREIGN_CONSTITUTION_VERSION, blueprintVersion, intent, disposition: priorQuestion ? "ANSWER" : "CLARIFY", resolvedQuestion: priorQuestion ? `${priorQuestion}\nFollow-up question: ${question.trim()}` : question.trim(), contextUsed: Boolean(priorQuestion), reason: priorQuestion ? "Combined the latest relevant business subject with the current follow-up; unrelated messages excluded." : "No relevant prior business question was available." };
}

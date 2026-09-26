export type HotelGuestLanguage = "en" | "hi" | "ru";
export type PublicContactField = "phone" | "email" | "website" | "address" | "hours";

const DEVANAGARI = /[\u0900-\u097f]/;
const CYRILLIC = /[\u0400-\u04ff]/;

const PRIVATE_GUEST = {
  en: /\b(?:another|previous|prior|other)\s+(?:guest|customer)|\b(?:guest|customer)(?:'s)?\s+(?:private|personal)\b/i,
  hi: /(?:दूसरे|पिछले|अन्य)\s+(?:मेहमान|ग्राहक)|(?:मेहमान|ग्राहक)\s+(?:का|की|के)\s+(?:निजी|पर्सनल)/i,
  ru: /(?:другого|предыдущего|иного)\s+(?:гостя|клиента)|(?:личн(?:ый|ая|ое))\s+(?:телефон|адрес|почт)/i
};

const CONTACT_PATTERNS: Record<HotelGuestLanguage, Record<PublicContactField, RegExp>> = {
  en: {
    phone: /\b(phone|telephone|mobile|contact number|reservation number|booking number|fon|fone|mob(?:ile)?)\b/i,
    email: /\b(e-?mail|mail id)\b/i,
    website: /\b(web ?site|site|url)\b/i,
    address: /\b(address|located|location|based|pata|address chahiye)\b/i,
    hours: /\b(opening hours|business hours|timings?|open time)\b/i
  },
  hi: {
    phone: /(?:फ़ोन|फोन|मोबाइल|संपर्क)(?:\s*(?:नंबर|नम्बर))?|(?:नंबर|नम्बर)/i,
    email: /(?:ईमेल|मेल)(?:\s*(?:पता|आईडी))?/i,
    website: /(?:वेबसाइट|साइट|यूआरएल)/i,
    address: /(?:पता|एड्रेस|लोकेशन|कहाँ|कहां)/i,
    hours: /(?:खुलने|बंद होने|काम करने)(?:\s*का)?\s*(?:समय|टाइम)|समय क्या/i
  },
  ru: {
    phone: /(?:телефон|контактн(?:ый|ого)\s+номер|номер\s+телефона)/i,
    email: /(?:электронн(?:ая|ой)\s+почт(?:а|ы)|имейл|e-?mail)/i,
    website: /(?:веб-?сайт|сайт|url)/i,
    address: /(?:адрес|где\s+(?:вы|находитесь|расположен))/i,
    hours: /(?:часы\s+работы|время\s+работы|когда\s+открыт)/i
  }
};

const HOTEL_HINTS: Array<[RegExp, string]> = [
  [/(?:कमर(?:ा|े)|रूम|номер(?:а|ов)?|комнат(?:а|ы))|\brooms?\b/i, "rooms"],
  [/(?:किराय(?:ा|े)|टैरिफ|रेट|цена|тариф|стоимость)|\b(?:tariff|rates?|price|cost)\b/i, "rates pricing"],
  [/(?:सुविधा(?:एँ|एं|ओं)?|अमेनिटीज|удобств(?:о|а))|\b(?:amenities|facilities)\b/i, "amenities facilities"],
  [/(?:बुकिंग|आरक्षण|бронировани(?:е|я))|\b(?:book|booking|reservation|reserve)\b/i, "booking reservation"],
  [/(?:रद्द|कैंसलेशन|возврат|отмен(?:а|ы))|\b(?:cancellation|refund)\b/i, "cancellation refund policy"],
  [/(?:दूरी|कितनी\s+दूर|расстояни(?:е|я))|\b(?:distance|how far)\b/i, "distance location"],
  [/(?:नाश्ता|भोजन|खाना|еда|завтрак)|\b(?:breakfast|food|dining|meal)\b/i, "food dining breakfast"],
  [/(?:चेक[ -]?इन|चेक[ -]?आउट|заезд|выезд)|\b(?:check[ -]?in|check[ -]?out)\b/i, "check in check out"],
  [/(?:पालतू|питомц(?:ы|ев))|\b(?:pet|pets)\b/i, "pets policy"]
];

export function detectHotelGuestLanguage(question: string): HotelGuestLanguage {
  if (DEVANAGARI.test(question)) return "hi";
  if (CYRILLIC.test(question)) return "ru";
  return "en";
}

export function requestsPrivateGuestContact(question: string) {
  const language = detectHotelGuestLanguage(question);
  return PRIVATE_GUEST[language].test(question);
}

export function requestedPublicContactFields(question: string): PublicContactField[] {
  if (requestsPrivateGuestContact(question)) return [];
  const language = detectHotelGuestLanguage(question);
  return (Object.keys(CONTACT_PATTERNS[language]) as PublicContactField[]).filter(field => CONTACT_PATTERNS[language][field].test(question));
}

export function normalizeMultilingualHotelQuestion(question: string) {
  const language = detectHotelGuestLanguage(question);
  const contactFields = requestedPublicContactFields(question);
  const hints = HOTEL_HINTS.filter(([pattern]) => pattern.test(question)).map(([, hint]) => hint);
  if (contactFields.length) hints.push("public contact information", ...contactFields.map(field => field === "hours" ? "business hours" : field));
  const needsRoutingHints = language !== "en" || /\b(?:aapka|chahiye|kya|kitna|kitni|hai|pata)\b/i.test(question);
  return { language, contactFields, routingText: needsRoutingHints ? [...new Set(hints)].join(" ") : "" };
}

export function localizeVerifiedContactAnswer(language: HotelGuestLanguage, businessName: string, details: string[]) {
  if (language === "hi") return `${businessName} की सत्यापित संपर्क जानकारी:\n${details.map(detail => detail.replace(/^Phone:/, "फ़ोन:").replace(/^Email:/, "ईमेल:").replace(/^Website:/, "वेबसाइट:").replace(/^Address:/, "पता:").replace(/^Business hours:/, "समय:")).join("\n")}`;
  if (language === "ru") return `Проверенные контактные данные ${businessName}:\n${details.map(detail => detail.replace(/^Phone:/, "Телефон:").replace(/^Email:/, "Эл. почта:").replace(/^Website:/, "Сайт:").replace(/^Address:/, "Адрес:").replace(/^Business hours:/, "Часы работы:")).join("\n")}`;
  return "";
}

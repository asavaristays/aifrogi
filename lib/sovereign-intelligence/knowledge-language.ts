// Expand retrieval vocabulary without changing the guest's original message or
// treating these terms as evidence. No tenant facts belong in this dictionary.
const CONCEPTS: Array<{ pattern: RegExp; terms: string }> = [
  { pattern: /\b(?:food|meals?|dining|eat|vegetarian|buffet|khana|khaana|bhojan)\b|खाना|भोजन|शाकाहारी|खाने/iu, terms: "food dining meals buffet vegetarian" },
  { pattern: /\b(?:cottages?|rooms?|accommodation|stay|kamr[ae]|kamre|rukna)\b|कमर|कॉटेज|ठहर|रहने/iu, terms: "room cottage accommodation stay" },
  { pattern: /\b(?:pets?|dogs?|cats?|kutta|kutte|paltu)\b|कुत्त|पालतू|बिल्ली/iu, terms: "pets dog pet-friendly" },
  { pattern: /\b(?:children|kids?|family|families|bachch\w*|bacho\w*|baccho\w*|parivar)\b|बच्च|परिवार/iu, terms: "family children capacity occupancy" },
  { pattern: /\b(?:bird\w*|birding|birds)\b|पक्षी|पक्षियों/iu, terms: "birdwatching birding guided winter" },
  { pattern: /\b(?:walks?|hikes?|trek\w*|paidal)\b|पैदल|सैर/iu, terms: "walk forest trail guide" },
  { pattern: /\b(?:cycles?|cycling|bicycl\w*)\b|साइकिल/iu, terms: "cycling mountain riverside trails" },
  { pattern: /\b(?:safari|wildlife)\b|सफारी|वन्यजीव/iu, terms: "safari wildlife jeep" },
  { pattern: /\b(?:village|villagers|community|local|gaon)\b|गाँव|गांव|स्थानीय/iu, terms: "village local community families" },
  { pattern: /\b(?:river\w*|surf\w*)\b|नदी/iu, terms: "river riverside body surfing seasonal" },
  { pattern: /\b(?:weather|season\w*|winter|summer|monsoon|december|january|february|pack\w*|clothes|mausam|sardi)\b|मौसम|सर्दी|कपड़े/iu, terms: "season winter summer monsoon clothing shoes weather" },
  { pattern: /\b(?:signal|reception|connectivity|mobile|network)\b|सिग्नल|नेटवर्क|मोबाइल/iu, terms: "mobile reception signal network" },
  { pattern: /\b(?:price|cost|rates?|tariff|kitna|kitne|keemat|daam)\b|कीमत|दाम|किराया|कितने पैसे/iu, terms: "price rate cost" },
  { pattern: /\b(?:station|railway|train)\b|रेलवे|स्टेशन|ट्रेन/iu, terms: "railway station train access" },
  { pattern: /\b(?:airport|flight)\b|हवाई|एयरपोर्ट/iu, terms: "airport access" },
  { pattern: /\b(?:distance|drive|road|delhi|door|dur|kaise pahun\w*)\b|दूरी|दिल्ली|कैसे पहुँच|कैसे पहुंच/iu, terms: "distance road travel access" },
  { pattern: /\b(?:cancel\w*|refund)\b|रद्द|रिफंड|वापसी/iu, terms: "cancellation refund policy" },
  { pattern: /\b(?:check.?in|check.?out)\b|चेक.?इन|चेक.?आउट/iu, terms: "check-in check-out times" },
  { pattern: /\b(?:wheelchair|accessible|accessibility)\b|व्हीलचेयर|दिव्यांग/iu, terms: "wheelchair accessibility" },
  { pattern: /\b(?:address|location|where|pata|kahan)\b|पता|कहाँ|कहां/iu, terms: "address location" }
];

export function knowledgeConcepts(question: string) {
  return CONCEPTS.filter(({ pattern }) => pattern.test(question)).map(({ terms }) => terms);
}

export function expandKnowledgeQuestion(question: string) {
  return [question, ...knowledgeConcepts(question)].join(" ");
}

export function knowledgeTokens(value: string) {
  return value.normalize("NFKC").toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter((term) => term.length > 2);
}

export function isHindiPrivateRequest(question: string) {
  return /पासवर्ड|ओटीपी|सीवीवी|कार्ड नंबर|गुप्त|सिस्टम प्रॉम्प्ट|निजी/iu.test(question)
    || /(?:पिछले|दूसरे|किसी|अन्य|पुराने).{0,25}(?:मेहमान|ग्राहक)|(?:मेहमान|ग्राहक).{0,25}(?:फोन|नंबर|जानकारी|बुकिंग)/iu.test(question)
    || /\b(?:pichle|dusre|kisi|another)\b.{0,25}\b(?:guest|mehmaan|customer)\b/iu.test(question);
}

export function isHotelSeasonPlanning(question: string) {
  return /\b(?:weather|temperature|season|winter|summer|monsoon|pack|packing|mausam)\b|मौसम|सर्दी|कपड़े/iu.test(question)
    && /\b(?:camp|hotel|resort|stay|trip|visit|pack|packing|winter|summer|monsoon|december|january|february|season|mausam)\b|होटल|रिसॉर्ट|सर्दी|कपड़े/iu.test(question)
    && !/\b(?:today|right now|forecast|tomorrow|live)\b|आज|अभी/iu.test(question);
}

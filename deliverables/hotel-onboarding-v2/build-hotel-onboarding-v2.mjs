import ExcelJS from "exceljs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const outputFile = path.join(outputDir, "AiFrogi-HotelGPT-Complete-Onboarding-v2.xlsx");
await mkdir(outputDir, { recursive: true });

const workbook = new ExcelJS.Workbook();
workbook.creator = "AiFrogi";
workbook.title = "HotelGPT Complete Hotel Knowledge and SOP Onboarding";
workbook.subject = "Governed hotel knowledge, Pre-Stay flows, verified In-Stay SOPs and website verification readiness";
workbook.company = "AiFrogi";
workbook.created = new Date("2026-09-26T00:00:00Z");
workbook.modified = new Date("2026-09-26T00:00:00Z");

const colours = {
  ink: "172126", gold: "B88A1B", paleGold: "FFF4D3", cream: "FBF8F1",
  green: "176B50", paleGreen: "E3F5ED", blue: "205A8A", paleBlue: "EAF3FA",
  red: "A12B24", paleRed: "FCE8E6", grey: "E3E6E8", white: "FFFFFF"
};

function setup(sheet, title, subtitle, columns) {
  sheet.views = [{ showGridLines: false, state: "frozen", ySplit: 5 }];
  sheet.mergeCells(1, 1, 1, columns.length);
  sheet.getCell(1, 1).value = title;
  sheet.getCell(1, 1).font = { name: "Arial", size: 18, bold: true, color: { argb: colours.ink } };
  sheet.mergeCells(2, 1, 2, columns.length);
  sheet.getCell(2, 1).value = subtitle;
  sheet.getCell(2, 1).font = { name: "Arial", size: 10, italic: true, color: { argb: "666666" } };
  sheet.getRow(4).values = columns.map((column) => column.header);
  sheet.getRow(4).height = 34;
  sheet.getRow(4).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colours.ink } };
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: colours.white } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  columns.forEach((column, index) => { sheet.getColumn(index + 1).width = column.width; });
  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: columns.length } };
  sheet.properties.tabColor = { argb: colours.gold };
}

function styleRows(sheet, start, end, inputColumns = []) {
  for (let row = start; row <= end; row += 1) {
    sheet.getRow(row).height = 44;
    sheet.getRow(row).eachCell({ includeEmpty: true }, (cell, column) => {
      cell.font = { name: "Arial", size: 10, color: { argb: colours.ink } };
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "DDD6C7" } },
        bottom: { style: "thin", color: { argb: "DDD6C7" } },
        left: { style: "thin", color: { argb: "DDD6C7" } },
        right: { style: "thin", color: { argb: "DDD6C7" } }
      };
      if (inputColumns.includes(column)) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colours.paleGold } };
    });
  }
}

function listValidation(cell, values) {
  cell.dataValidation = { type: "list", allowBlank: true, formulae: [`"${values.join(",")}"`] };
}

function markEditable(sheet, addresses, fill) {
  for (const address of addresses) {
    const [from, to = from] = address.split(":").map((value) => sheet.getCell(value));
    for (let row = from.row; row <= to.row; row += 1) for (let column = from.col; column <= to.col; column += 1) {
      const cell = sheet.getCell(row, column);
      cell.protection = { locked: false };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
    }
  }
}

function markLocked(sheet, addresses) {
  for (const address of addresses) {
    const [from, to = from] = address.split(":").map((value) => sheet.getCell(value));
    for (let row = from.row; row <= to.row; row += 1) for (let column = from.col; column <= to.col; column += 1) {
      const cell = sheet.getCell(row, column);
      cell.protection = { locked: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colours.grey } };
    }
  }
}

function note(cell, text) {
  cell.note = { texts: [{ font: { name: "Arial", size: 10 }, text }] };
}

const start = workbook.addWorksheet("Start Here");
setup(start, "AiFrogi HotelGPT Complete Onboarding v2", "Hotel-owned source of truth for governed knowledge, Pre-Stay intelligence and verified In-Stay operations.", [
  { header: "Step", width: 10 }, { header: "Owner", width: 18 }, { header: "Action", width: 45 },
  { header: "Required output", width: 34 }, { header: "Status", width: 16 }, { header: "Important control", width: 46 }
]);
const workflow = [
  [1, "Hotel", "Complete Business Profile and identify every property with a stable property code.", "Current hotel and property identity", "Not started", "Do not enter passwords, OTPs, payment data, guest records or API secrets."],
  [2, "Hotel", "Complete every relevant Approved FAQs row with exact customer-safe information.", "Approved canonical answers", "Not started", "Use Not applicable only when the topic genuinely does not apply."],
  [3, "Hotel", "Add common English variants, typos and Hinglish wording guests actually use.", "Question variation library", "Not started", "Variants point to one canonical answer; do not create contradictory duplicate answers."],
  [4, "Hotel", "Complete Pre-Stay SOP flows for booking, tariff, location, distance and amenities.", "Approved journey and escalation rules", "Not started", "A flow cannot confirm live availability, booking or payment without a verified connector."],
  [5, "Hotel", "Complete verified In-Stay department and service SOPs.", "Ticket routing, SLA and escalation", "Not started", "In-Stay is verified-user ticketing, not generative AI answering."],
  [6, "AiFrogi", "Compare workbook facts with public website/PDF sources and list missing or conflicting information.", "Verification findings", "Not started", "Website comparison creates findings only; it never silently overwrites hotel-approved answers."],
  [7, "Hotel + AiFrogi", "Resolve findings, approve versions and run the complete question/flow regression.", "Signed launch candidate", "Not started", "Only approved and published versions may answer guests."],
  [8, "AiFrogi", "Publish after Super Admin gates and retain rollback/version evidence.", "Governed live release", "Not started", "Every live answer must remain traceable to source, answer and flow versions."]
];
workflow.forEach((row) => start.addRow(row));
styleRows(start, 5, 12, [5]);
for (let row = 5; row <= 12; row += 1) listValidation(start.getCell(row, 5), ["Not started", "In progress", "Ready", "Not applicable"]);
start.mergeCells("A15:F15"); start.getCell("A15").value = "Workbook rules";
start.getCell("A15").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colours.paleGold } };
start.getCell("A15").font = { bold: true, color: { argb: colours.ink } };
const rules = [
  "Keep all ten sheet names unchanged. The importer reads Business Profile, Approved FAQs and approved guest-visible Tariff & Payment rows; governance tabs remain controlled review evidence.",
  "Answers beginning with ‘Replace this’ are examples and are not imported.",
  "Use one property code consistently. Leave Property Code as ALL only for facts genuinely shared by every property.",
  "State tariff period, tax, inclusions, exclusions and exceptions explicitly.",
  "Add approved public photo URLs in Photo Library. A photo is usable only with guest visibility, confirmed usage rights and hotel approval.",
  "Website/PDF comparison is advisory. Hotel approval remains authoritative.",
  "Do not place formulas in Business Profile or Approved FAQs. Keep the workbook below 3 MB."
];
rules.forEach((rule, index) => { start.mergeCells(16 + index, 1, 16 + index, 6); start.getCell(16 + index, 1).value = `• ${rule}`; });
start.mergeCells("A24:F24"); start.getCell("A24").value = "Colour guide — edit only coloured input cells";
start.getCell("A24").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colours.ink } };
start.getCell("A24").font = { bold: true, color: { argb: colours.white } };
const legend = [
  [25, colours.paleGold, "YELLOW — Hotel must fill or replace the reference example."],
  [26, colours.paleBlue, "BLUE — Optional hotel detail that improves language matching."],
  [27, colours.paleGreen, "GREEN — Hotel approval or progress status."],
  [28, colours.grey, "GREY — Locked AiFrogi reference/system field. It cannot be changed accidentally."],
  [29, colours.paleRed, "RED — Never enter passwords, OTPs, payment credentials, private guest records or identity documents."]
];
for (const [row, fill, text] of legend) {
  start.getCell(row, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
  start.mergeCells(row, 2, row, 6); start.getCell(row, 2).value = text;
  start.getCell(row, 2).alignment = { vertical: "middle", wrapText: true };
}
markEditable(start, ["E5:E12"], colours.paleGreen);

start.mergeCells("A13:F13"); start.getCell("A13").value = "IMPORTANT — What the sample answers mean";
start.getCell("A13").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colours.red } };
start.getCell("A13").font = { bold: true, color: { argb: colours.white } };
start.mergeCells("A14:F14"); start.getCell("A14").value = "The Approved FAQs sheet contains 72 standard hotel questions plus 20 blank Custom Hotel FAQ rows. Samples are guidance only and are never imported. Replace each applicable sample with the hotel's actual answer and select Approved. Use the Custom rows for property-specific questions; do not insert, delete or rename rows/columns/sheets.";
start.getCell("A14").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colours.paleRed } };
start.getCell("A14").alignment = { wrapText: true, vertical: "middle" }; start.getRow(14).height = 44;

start.mergeCells("A32:F32"); start.getCell("A32").value = "ADVANCED ADD-ONS — PHASE 2 (not part of beginner onboarding)";
start.getCell("A32").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colours.blue } };
start.getCell("A32").font = { bold: true, color: { argb: colours.white } };
start.mergeCells("A33:F33"); start.getCell("A33").value = "Complete only after the verified knowledge foundation is approved. Never paste credentials, API keys, passwords, OTPs or payment secrets into this workbook.";
start.getCell("A33").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colours.paleBlue } };
start.getCell("A33").alignment = { wrapText: true };
start.getRow(35).values = ["Add-on", "Current provider", "Hotel objective", "Required authority", "Status", "Control boundary"];
start.getRow(35).eachCell((cell) => {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colours.ink } };
  cell.font = { bold: true, color: { argb: colours.white } };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
});
const addOns = [
  ["Payment Gateway", "", "Collect advance or full payment", "Create payment link + verify provider callback", "Not required now", "The bot cannot claim Paid until the gateway callback is verified and reconciled."],
  ["PMS", "", "Read inventory/reservations or create/update bookings", "Property- and action-scoped PMS connector", "Not required now", "No availability, booking, modification or cancellation authority without verified PMS evidence."],
  ["CRS / Booking Engine", "", "Check rates/availability or continue booking", "Read-only or transaction-scoped connector", "Not required now", "Published tariffs are information; live sellable rate and availability require connector evidence."],
  ["Channel Manager", "", "Synchronise inventory and rates", "Restricted inventory/rate connector", "Not required now", "Never infer cross-channel availability or parity from static knowledge."],
  ["POS / Restaurant / Spa", "", "Read menus, charges or service orders", "Outlet- and action-scoped connector", "Not required now", "No order or charge confirmation without system acknowledgement."],
  ["Accounting / GST Invoice", "", "Generate or retrieve invoices and payment status", "Finance-approved restricted connector", "Not required now", "Financial records remain staff-controlled and must not expose another guest's information."],
  ["CRM / Guest Profile", "", "Create consented enquiry or retrieve permitted history", "Consent- and tenant-scoped connector", "Not required now", "Collect minimum data; never expose private guest history in public chat."],
  ["Door Lock / Access", "", "Issue or manage stay access", "Verified In-Stay identity + tightly scoped access connector", "Not required now", "No public bot access. Never display door codes, PINs or access credentials in the workbook."],
  ["Transport / Experience Provider", "", "Check availability or request reservation", "Supplier-specific connector or staff confirmation", "Not required now", "Request is not confirmed until the provider or hotel returns verified confirmation."],
  ["Other", "", "Describe the exact operational outcome", "Define read/write actions and owner approval", "Not required now", "Must pass security, tenant isolation, failure handling and rollback review before activation."]
];
addOns.forEach((row) => start.addRow(row));
styleRows(start, 36, 35 + addOns.length, [2, 3, 5]);
for (let row = 36; row <= 35 + addOns.length; row += 1) listValidation(start.getCell(row, 5), ["Not required now", "Planned", "Provider selected", "Security review", "Testing", "Approved", "Live"]);
markLocked(start, [`A36:A${35 + addOns.length}`, `D36:D${35 + addOns.length}`, `F36:F${35 + addOns.length}`]);
markEditable(start, [`B36:C${35 + addOns.length}`], colours.paleBlue);
markEditable(start, [`E36:E${35 + addOns.length}`], colours.paleGreen);
note(start.getCell("A32"), "This section is deliberately outside the beginner knowledge onboarding flow. It is an optional Phase 2 integration inventory.");

const profile = workbook.addWorksheet("Business Profile");
setup(profile, "Business Profile", "Fill column B. Required labels remain compatible with the current governed importer.", [
  { header: "Field", width: 38 }, { header: "Hotel response", width: 58 }, { header: "Guidance", width: 62 },
  { header: "Required", width: 14 }, { header: "Version", width: 12 }, { header: "Last reviewed", width: 16 }
]);
const profileRows = [
  ["Business legal name *", "", "Registered/trading name used publicly.", "Yes"],
  ["Industry / category *", "Hospitality", "Hotel, resort, heritage hotel, lodge, homestay or camp.", "Yes"],
  ["Website URL *", "", "Primary public website beginning with https://.", "Yes"],
  ["Primary contact name *", "", "Hotel representative responsible for approval.", "Yes"],
  ["Contact email *", "", "Public reservation/enquiry email.", "Yes"],
  ["Mobile number *", "", "Public phone or WhatsApp number with country code.", "Yes"],
  ["Business address", "", "Full postal address shown to guests.", "Recommended"],
  ["Business hours", "", "Reservation/front-office hours.", "Recommended"],
  ["Assistant name", "", "Hotel-approved public assistant name.", "Recommended"],
  ["Assistant tone", "Professional, warm and concise", "Tone must remain truthful and hospitality-appropriate.", "Recommended"],
  ["Main business objective", "Answer approved hotel questions, assist with enquiries and route guests to the hotel team.", "Do not include unverified transaction authority.", "Yes"],
  ["Topics the bot must not answer", "", "Private guest/staff information, secrets, unapproved commitments and unsafe guidance.", "Yes"],
  ["When should the bot hand over to a human", "", "Booking help, live availability, exception, complaint, accessibility or unresolved important question.", "Yes"],
  ["Default property code", "", "Stable short code, e.g. MAIN, JAWAI or ROHET. Never reuse another hotel's code.", "Yes"],
  ["Additional property codes", "", "One per line: code | public property name | city/state.", "Optional"],
  ["Supported guest languages", "English, Hindi, Hinglish", "List only languages the hotel can support safely.", "Recommended"],
  ["Reservation escalation contact", "", "Public team contact or internal role; no private credentials.", "Yes"],
  ["Pre-Stay response SLA", "", "Expected human response time and operating hours.", "Recommended"],
  ["In-Stay emergency contact", "", "Front desk/public emergency contact available to verified guests.", "Yes"],
  ["Knowledge approver name and role", "", "Named owner/admin accountable for the workbook.", "Yes"]
  ,["Authorised ownership representative", "", "Person authorised to confirm the hotel identity, website and supplied knowledge.", "Yes"]
  ,["Privacy policy URL", "", "Public hotel privacy notice, if available.", "Recommended"]
  ,["Guest privacy / grievance contact", "", "Public contact for privacy questions or complaints.", "Yes"]
  ,["Guest data retention rule", "", "How long enquiry and guest-contact data may be retained and who can access it.", "Yes"]
  ,["After-hours escalation contact", "", "Hotel role and public/internal escalation route; never enter private credentials.", "Yes"]
  ,["Emergency escalation procedure", "", "Who staff contact for safety, medical, fire, security or serious guest incidents.", "Yes"]
  ,["Language approvers", "", "One line per language: language | approver name/role.", "Recommended"]
  ,["Staff onboarding owner", "", "Person responsible for department access, training and operating readiness.", "Yes"]
  ,["Launch approval owner", "", "Final accountable hotel owner/admin who signs the launch candidate.", "Yes"]
];
profileRows.forEach((row) => profile.addRow([...row, "v1.0", ""]));
styleRows(profile, 5, 4 + profileRows.length, [2, 5, 6]);
markEditable(profile, [`B5:B${4 + profileRows.length}`], colours.paleGold);
markEditable(profile, [`F5:F${4 + profileRows.length}`], colours.paleBlue);
markLocked(profile, [`E5:E${4 + profileRows.length}`]);
note(profile.getCell("B4"), "Hotel input: replace blank or reference text with current approved information.");
note(profile.getCell("E4"), "AiFrogi-controlled version field. Locked to prevent accidental changes.");

const faqDefinitions = [
  ["Identity", "HOTEL-IDENTITY-001", "What is the official name and short description of the hotel?", "identity", 180],
  ["Identity", "HOTEL-IDENTITY-002", "What is the hotel's history, concept or heritage?", "identity", 180],
  ["Contact", "HOTEL-CONTACT-001", "What is the reservation phone or WhatsApp number?", "contact", 30],
  ["Contact", "HOTEL-CONTACT-002", "What is the reservation email address?", "contact", 30],
  ["Contact", "HOTEL-CONTACT-003", "What is the full hotel address and Google Maps link?", "location", 60],
  ["Rooms", "HOTEL-ROOM-001", "What room, cottage, tent and suite categories are available?", "room_category", 30],
  ["Rooms", "HOTEL-ROOM-002", "How many units are available in each category?", "inventory_description", 30],
  ["Rooms", "HOTEL-ROOM-003", "What is the maximum occupancy of each category?", "occupancy", 30],
  ["Rooms", "HOTEL-ROOM-004", "How many bedrooms and bathrooms does each villa or multi-room unit have?", "room_configuration", 30],
  ["Rooms", "HOTEL-ROOM-005", "Which categories permit an extra bed and at what charge?", "extra_bed", 14],
  ["Rooms", "HOTEL-ROOM-006", "Which rooms are suitable for families, children or accessible stays?", "room_suitability", 60],
  ["Tariff", "HOTEL-TARIFF-001", "What is the current published tariff for each room category?", "tariff", 7],
  ["Tariff", "HOTEL-TARIFF-002", "What dates or season does each tariff apply to?", "tariff_period", 7],
  ["Tariff", "HOTEL-TARIFF-003", "Are taxes included, and what tax rate applies?", "tax", 14],
  ["Tariff", "HOTEL-TARIFF-004", "What meals, services and amenities are included in the tariff?", "tariff_inclusions", 14],
  ["Tariff", "HOTEL-TARIFF-005", "What is specifically excluded from the tariff?", "tariff_exclusions", 14],
  ["Tariff", "HOTEL-TARIFF-006", "What mandatory meal plans, gala charges or seasonal supplements apply?", "supplement", 7],
  ["Offers", "HOTEL-OFFER-001", "What direct-booking offers or packages are currently valid?", "offer", 7],
  ["Booking", "HOTEL-BOOKING-001", "How can a guest check live availability?", "availability", 7],
  ["Booking", "HOTEL-BOOKING-002", "How can a guest request or make a booking?", "booking_process", 30],
  ["Booking", "HOTEL-BOOKING-003", "What guest and stay details are required for a booking enquiry?", "booking_fields", 60],
  ["Booking", "HOTEL-BOOKING-004", "When is a booking considered confirmed?", "booking_confirmation", 60],
  ["Booking", "HOTEL-BOOKING-005", "How can a guest modify, extend or cancel a booking?", "booking_change", 30],
  ["Booking", "HOTEL-BOOKING-006", "Which booking requests must be handled by the hotel team?", "booking_handover", 30],
  ["Payment", "HOTEL-PAYMENT-001", "Which payment methods are accepted?", "payment_methods", 30],
  ["Payment", "HOTEL-PAYMENT-002", "Is advance payment required, and how much?", "advance_payment", 14],
  ["Payment", "HOTEL-PAYMENT-003", "Which official payment link or bank-payment process may guests use?", "payment_process", 14],
  ["Payment", "HOTEL-PAYMENT-004", "Can the hotel issue a GST invoice, and what details are required?", "invoice", 60],
  ["Policy", "HOTEL-POLICY-001", "What are the check-in and check-out times?", "checkin_checkout", 30],
  ["Policy", "HOTEL-POLICY-002", "What is the cancellation and refund policy?", "cancellation", 14],
  ["Policy", "HOTEL-POLICY-003", "What is the no-show and early-departure policy?", "no_show", 30],
  ["Policy", "HOTEL-POLICY-004", "What is the child policy by age?", "child_policy", 30],
  ["Policy", "HOTEL-POLICY-005", "Are pets allowed and under what conditions?", "pet_policy", 60],
  ["Policy", "HOTEL-POLICY-006", "What identification is required at check-in?", "identification", 60],
  ["Policy", "HOTEL-POLICY-007", "What are the smoking, alcohol, visitor and quiet-hour rules?", "house_rules", 60],
  ["Amenities", "HOTEL-AMENITY-001", "Is Wi-Fi available, where, and is it complimentary?", "wifi", 60],
  ["Amenities", "HOTEL-AMENITY-002", "Is parking available, is it complimentary, and is reservation required?", "parking", 60],
  ["Amenities", "HOTEL-AMENITY-003", "Is there a swimming pool and what are its timings and rules?", "pool", 30],
  ["Amenities", "HOTEL-AMENITY-004", "Is there a gym, spa or wellness service?", "wellness", 30],
  ["Amenities", "HOTEL-AMENITY-005", "Is laundry service available and what are the charges or turnaround times?", "laundry", 30],
  ["Amenities", "HOTEL-AMENITY-006", "Is room service available and during what hours?", "room_service", 30],
  ["Amenities", "HOTEL-AMENITY-007", "What power backup, heating, cooling and hot-water facilities are available?", "utilities", 60],
  ["Dining", "HOTEL-DINING-001", "What restaurants, bars and dining venues are available?", "dining_venues", 30],
  ["Dining", "HOTEL-DINING-002", "What are the breakfast, lunch and dinner timings?", "meal_timings", 30],
  ["Dining", "HOTEL-DINING-003", "Is breakfast included by default?", "breakfast_inclusion", 14],
  ["Dining", "HOTEL-DINING-004", "Which cuisines and meal plans are offered?", "cuisine", 30],
  ["Dining", "HOTEL-DINING-005", "Can the hotel support vegetarian, vegan, Jain or allergy-related requests?", "dietary_request", 30],
  ["Location", "HOTEL-LOCATION-001", "Where exactly is the hotel located?", "location", 60],
  ["Distance", "HOTEL-DISTANCE-001", "What is the nearest airport and its distance and typical drive time?", "airport_distance", 60],
  ["Distance", "HOTEL-DISTANCE-002", "What is the nearest railway station and its distance and typical drive time?", "railway_distance", 60],
  ["Distance", "HOTEL-DISTANCE-003", "What are the distances to major nearby cities and landmarks?", "landmark_distance", 60],
  ["Transport", "HOTEL-TRANSPORT-001", "Does the hotel arrange airport or railway transfers and at what charge?", "transfer", 30],
  ["Transport", "HOTEL-TRANSPORT-002", "What local taxi, driver or self-drive options are recommended?", "local_transport", 60],
  ["Experiences", "HOTEL-EXPERIENCE-001", "What activities and local experiences are available?", "experience", 30],
  ["Experiences", "HOTEL-EXPERIENCE-002", "What safari, guide, excursion or outdoor options are available?", "safari", 14],
  ["Experiences", "HOTEL-EXPERIENCE-003", "For each activity, what advance notice, minimum guests and weather or permit conditions apply?", "experience_conditions", 14],
  ["Events", "HOTEL-EVENT-001", "Does the hotel host weddings, meetings and private events?", "events", 60],
  ["Events", "HOTEL-EVENT-002", "What venues and maximum capacities are available?", "event_capacity", 30],
  ["Events", "HOTEL-EVENT-003", "What event packages, inclusions and restrictions apply?", "event_package", 30],
  ["Events", "HOTEL-EVENT-004", "Who handles wedding, group and event enquiries?", "event_contact", 30],
  ["Accessibility", "HOTEL-ACCESS-001", "What accessibility features and accessible rooms are available?", "accessibility", 60],
  ["Accessibility", "HOTEL-ACCESS-002", "Are lifts, ramps, wheelchairs or ground-floor rooms available?", "mobility", 60],
  ["Families", "HOTEL-FAMILY-001", "Are cots, babysitting, family rooms or children's activities available?", "family", 60],
  ["Groups", "HOTEL-GROUP-001", "What group booking terms, room blocks or tour-leader benefits apply?", "group_booking", 30],
  ["Safety", "HOTEL-SAFETY-001", "Who should a guest contact for an urgent safety or medical issue?", "emergency", 30],
  ["Safety", "HOTEL-SAFETY-002", "What safety, wildlife, weather or local-travel advice should guests know?", "safety_guidance", 30],
  ["Pre-Stay", "HOTEL-PRESTAY-001", "When should Pre-Stay offer a callback from the hotel team?", "callback_intent", 30],
  ["Pre-Stay", "HOTEL-PRESTAY-002", "What consent wording should be used before saving a guest phone number?", "contact_consent", 60],
  ["Boundaries", "HOTEL-BOUNDARY-001", "What must the bot never promise or confirm without verified system evidence?", "prohibited_claim", 60],
  ["Boundaries", "HOTEL-BOUNDARY-002", "Which enquiries must always be handed to a person?", "human_handover", 30],
  ["Privacy", "HOTEL-PRIVACY-001", "How should the hotel handle requests for another guest's information?", "guest_privacy", 60],
  ["Privacy", "HOTEL-PRIVACY-002", "What guest information may be collected before and after consent?", "data_collection", 60]
];

function referenceAnswer(intent) {
  const examples = {
    identity: "[Hotel name] is a [hotel category] in [destination], known for [approved defining features].",
    contact: "For reservations, call or WhatsApp [public number] or email [public email] during [hours].",
    location: "[Hotel name] is located at [full address]. Google Maps: [approved link].",
    room_category: "The hotel offers [category 1], [category 2] and [category 3]. Briefly describe the difference between each.",
    inventory_description: "The hotel has [number] [category] units. Do not imply live availability.",
    occupancy: "[Category] accommodates up to [adults] adults and [children] children, subject to [approved condition].",
    room_configuration: "[Unit name] has [number] bedrooms and [number] bathrooms and accommodates [capacity].",
    extra_bed: "An extra bed is [available/not available] in [categories] at [amount plus tax] per [night/stay].",
    room_suitability: "For [families/accessibility], the hotel recommends [category] because [approved reason].",
    tariff: "For [valid dates], [category] is priced at INR [amount] per [night/package], plus/inclusive of [tax]. Live availability must be confirmed.",
    tariff_period: "This tariff applies from [start date] to [end date], excluding [blackout dates/events].",
    tax: "The published tariff is [inclusive/exclusive] of [percentage]% tax. State any different tax treatment clearly.",
    tariff_inclusions: "The tariff includes [meals/services/amenities]. Only list explicitly included items.",
    tariff_exclusions: "The tariff excludes [tax/meals/transfers/activities/other charges].",
    supplement: "A mandatory [meal/gala/seasonal] supplement of INR [amount] applies on [dates/conditions].",
    offer: "The [offer name] is valid for bookings/stays between [dates] and includes [benefit], subject to [conditions].",
    availability: "Live availability is confirmed only by [approved booking channel/team]. Share [dates and guest count] for assistance.",
    booking_process: "To request a booking, use [official URL/contact]. The booking is confirmed only after [payment/confirmation reference].",
    booking_fields: "Please share property, check-in/out dates, number of adults/children and preferred room category. Request contact details only with consent.",
    booking_confirmation: "A booking is confirmed only after [approved condition] and receipt of [confirmation number/email].",
    booking_change: "For changes, extensions or cancellation, contact [team/contact] and share [booking reference]. [Policy] applies.",
    booking_handover: "The hotel team must handle [live availability/special rate/group/exception/payment] requests.",
    payment_methods: "The hotel accepts [approved methods]. Never request card PIN, OTP or banking password in chat.",
    advance_payment: "An advance of [percentage/amount] is required within [time] through [official method].",
    payment_process: "Use only [official payment link/process]. Payment is confirmed only after provider verification and hotel acknowledgement.",
    invoice: "A GST invoice is [available/not available]. Share [approved business details] with the hotel team.",
    checkin_checkout: "Check-in is from [time] and check-out is by [time]. Early/late requests are subject to confirmation and charges.",
    cancellation: "For cancellation [number] days before arrival, [refund/charge]. For later cancellation or no-show, [charge].",
    no_show: "A no-show or early departure is charged [approved rule]. State refund exceptions precisely.",
    child_policy: "Children aged [range] stay [free/charge] under [conditions]. Children aged [range] are charged [amount/rule].",
    pet_policy: "Pets are [allowed/not allowed] subject to [size/area/charge/advance approval].",
    identification: "Guests must present [approved government ID requirements] at check-in. Do not upload identity documents in chat.",
    house_rules: "[Smoking/alcohol/visitor/quiet-hour] rules are [approved rules and timings].",
    wifi: "Wi-Fi is available in [areas] and is [complimentary/chargeable] for [eligible guests].",
    parking: "[Self/valet] parking is [available/unavailable], [complimentary/chargeable], and [does/does not] require advance reservation.",
    pool: "The pool is open from [time] to [time]. [Age/supervision/dress/safety] rules apply.",
    wellness: "[Gym/spa/wellness service] is available from [time] to [time] at [charge/booking condition].",
    laundry: "Laundry is available [days/hours] with [turnaround time]. Charges are [published list/on request].",
    room_service: "Room service is available from [time] to [time]. Late-night options are [approved details].",
    utilities: "Rooms have [power backup/heating/cooling/hot water] subject to [timings or property conditions].",
    dining_venues: "Dining options include [venue] serving [cuisine/meal] during [hours].",
    meal_timings: "Breakfast: [time]; lunch: [time]; dinner: [time]. Advance request rule: [details].",
    breakfast_inclusion: "Breakfast is [included/not included] in [specific plan/category]. If excluded, the charge is [amount].",
    cuisine: "The hotel serves [cuisines] and offers [meal plans].",
    dietary_request: "[Vegetarian/vegan/Jain/allergy] requests can be supported with [advance notice]. Allergy safety must be confirmed by staff.",
    airport_distance: "The nearest airport is [name], approximately [distance] away and typically [drive time], subject to traffic/road conditions.",
    railway_distance: "The nearest railway station is [name], approximately [distance] away and typically [drive time].",
    landmark_distance: "From [named landmark], the hotel is approximately [distance] or [drive time]. Add one origin per statement.",
    transfer: "Transfer from [origin] is [available/on request] at INR [amount] per [vehicle/trip], subject to confirmation.",
    local_transport: "The hotel can assist with [taxi/driver option]. Typical process and approved charge: [details].",
    experience: "Guests can enjoy [experience], available [timing/season], at [charge], subject to [conditions].",
    safari: "[Safari/excursion] requires [advance notice/permit/minimum guests]. Availability and price must be confirmed by staff.",
    experience_conditions: "Example: Jungle safari must be requested at least 24 hours in advance, requires a minimum of 2 guests, and depends on weather and permit availability. Hotel staff gives the final confirmation. Replace the activity, notice period, minimum guests and conditions with your hotel's actual rules.",
    events: "The hotel hosts [weddings/meetings/events] for up to [capacity], subject to venue and date confirmation.",
    event_capacity: "[Venue] accommodates [seated capacity] seated or [floating capacity] floating guests.",
    event_package: "The [package] includes [items] and excludes [items]. Pricing starts at [amount] subject to requirements.",
    event_contact: "For weddings/groups, contact [name/role] at [public phone/email].",
    accessibility: "Available accessibility features include [verified features]. Contact the hotel for room-specific confirmation.",
    mobility: "[Lift/ramp/wheelchair/ground-floor room] is [available/not available] under [conditions].",
    family: "The hotel offers [cot/family room/activity/babysitting] under [age/charge/notice conditions].",
    group_booking: "Group bookings require [minimum rooms], [advance] and [cancellation/payment terms].",
    emergency: "For an urgent issue, contact [front desk/emergency number] immediately. For medical emergencies, call [approved local emergency guidance].",
    safety_guidance: "Guests should follow [weather/wildlife/terrain/local travel] precautions: [approved guidance].",
    callback_intent: "Offer a callback only for [booking/quotation/unresolved assistance] or when the guest explicitly asks. Answer known information first.",
    contact_consent: "With your permission, please share your name, phone number and preferred callback time so the hotel team can assist.",
    prohibited_claim: "The bot must not confirm [live availability/booking/payment/discount/action] without [verified connector or staff evidence].",
    human_handover: "Always hand over [complaints/exceptions/accessibility/live transaction/private or unresolved important questions].",
    guest_privacy: "The hotel does not disclose another guest's identity, room, contact information or stay details.",
    data_collection: "Before consent collect only [non-identifying enquiry details]. After consent collect [minimum contact details] for [stated purpose]."
  };
  return `SAMPLE ANSWER — DO NOT SUBMIT: ${examples[intent] || "Provide the exact current hotel-approved answer, including conditions, exceptions and source."}`;
}

const faqs = workbook.addWorksheet("Approved FAQs");
const faqColumns = [
  { header: "Category", width: 17 }, { header: "Canonical customer question", width: 48 }, { header: "Approved answer", width: 68 }, { header: "Refresh days", width: 13 },
  { header: "Question ID", width: 23 }, { header: "Answer ID", width: 23 }, { header: "Property code", width: 16 }, { header: "Intent", width: 22 },
  { header: "English variations / typos", width: 45 }, { header: "Hinglish / Hindi variations", width: 45 }, { header: "Source type", width: 15 }, { header: "Source reference", width: 38 },
  { header: "Required", width: 12 }, { header: "Hotel sign-off", width: 16 }, { header: "Answer version", width: 14 }, { header: "Last reviewed", width: 16 },
  { header: "Website verification", width: 19 }, { header: "Reviewer notes", width: 40 }
];
faqs.views = [{ showGridLines: false, state: "frozen", ySplit: 1 }];
faqs.getRow(1).values = faqColumns.map((column) => column.header);
faqs.getRow(1).height = 38;
faqs.getRow(1).eachCell((cell) => {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colours.ink } };
  cell.font = { name: "Arial", size: 10, bold: true, color: { argb: colours.white } };
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
});
faqColumns.forEach((column, index) => { faqs.getColumn(index + 1).width = column.width; });
faqs.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: faqColumns.length } };
faqs.properties.tabColor = { argb: colours.green };
faqDefinitions.forEach(([category, questionId, question, intent, refreshDays], index) => {
  const suffix = String(index + 1).padStart(3, "0");
  faqs.addRow([category, question, referenceAnswer(intent), refreshDays, questionId, `ANSWER-${suffix}`, "ALL", intent, "", "", "Excel / Website / PDF / Correction", "", "Yes", "Pending", "v1.0", "", "Not checked", ""]);
});
const standardFaqEnd = 1 + faqDefinitions.length;
const customFaqStart = standardFaqEnd + 1;
const customFaqCount = 20;
const customFaqEnd = customFaqStart + customFaqCount - 1;
for (let index = 1; index <= customFaqCount; index += 1) {
  const suffix = String(index).padStart(3, "0");
  faqs.addRow(["Custom", "", "", 90, `HOTEL-CUSTOM-${suffix}`, `CUSTOM-ANSWER-${suffix}`, "ALL", "custom_hotel_faq", "", "", "Excel / Website / PDF / Correction", "", "Optional", "Pending", "v1.0", "", "Not checked", ""]);
}
styleRows(faqs, 2, standardFaqEnd, [3, 7, 9, 10, 11, 12, 14, 15, 16, 17, 18]);
styleRows(faqs, customFaqStart, customFaqEnd, [1, 2, 3, 4, 7, 9, 10, 11, 12, 14, 16]);
for (let row = 2; row <= customFaqEnd; row += 1) {
  listValidation(faqs.getCell(row, 7), ["ALL", "MAIN", "PROPERTY-2", "PROPERTY-3"]);
  listValidation(faqs.getCell(row, 11), ["Excel", "Website", "PDF", "Dynamic correction", "Multiple"]);
  listValidation(faqs.getCell(row, 13), ["Yes", "Recommended", "Optional"]);
  listValidation(faqs.getCell(row, 14), ["Pending", "Approved", "Not applicable", "Needs correction"]);
  listValidation(faqs.getCell(row, 17), ["Not checked", "Match", "Missing on website", "Conflict", "Website has more detail"]);
}
markLocked(faqs, [
  `A2:B${standardFaqEnd}`, `D2:F${standardFaqEnd}`, `H2:H${standardFaqEnd}`,
  `M2:M${standardFaqEnd}`, `O2:O${standardFaqEnd}`, `Q2:R${standardFaqEnd}`,
  `E${customFaqStart}:F${customFaqEnd}`, `H${customFaqStart}:H${customFaqEnd}`, `M${customFaqStart}:M${customFaqEnd}`,
  `O${customFaqStart}:O${customFaqEnd}`, `Q${customFaqStart}:R${customFaqEnd}`
]);
markEditable(faqs, [
  `C2:C${standardFaqEnd}`, `G2:G${standardFaqEnd}`, `K2:L${standardFaqEnd}`,
  `P2:P${standardFaqEnd}`,
  `A${customFaqStart}:D${customFaqEnd}`, `G${customFaqStart}:G${customFaqEnd}`,
  `K${customFaqStart}:L${customFaqEnd}`, `P${customFaqStart}:P${customFaqEnd}`
], colours.paleGold);
markEditable(faqs, [`I2:J${customFaqEnd}`], colours.paleBlue);
markEditable(faqs, [`N2:N${customFaqEnd}`], colours.paleGreen);
for (const column of [5, 6, 8, 15, 17, 18]) faqs.getColumn(column).hidden = true;
note(faqs.getCell("C1"), "YELLOW REQUIRED: delete the complete SAMPLE ANSWER and write the exact current hotel-approved answer. Unchanged samples are skipped during import. See Start Here rows 13–14.");
note(faqs.getCell("G1"), "Use ALL only when the answer applies to every property. Otherwise select or type the stable property code.");
note(faqs.getCell("I1"), "BLUE OPTIONAL: add real guest wording, common misspellings and alternative English phrases separated by |.");
note(faqs.getCell("J1"), "BLUE OPTIONAL: add Hinglish/Hindi transliterations guests actually use, separated by |.");
note(faqs.getCell("N1"), "GREEN APPROVAL: choose Approved only after the answer and source have been checked by the hotel.");
note(faqs.getCell(`B${customFaqStart}`), "CUSTOM HOTEL FAQ: enter a question unique to this hotel. Complete the answer, source, property code and approval. Blank custom rows are ignored safely.");

const prestay = workbook.addWorksheet("Pre-Stay SOP");
setup(prestay, "Pre-Stay Flow Intelligence SOP", "Hotel-owned rules for public guest journeys. Flow templates guide reasoning but may use only approved knowledge and verified connector evidence.", [
  { header: "Flow ID", width: 20 }, { header: "Flow", width: 18 }, { header: "Trigger intent", width: 30 }, { header: "Required inputs", width: 40 },
  { header: "Approved answer sequence", width: 62 }, { header: "Clarification rule", width: 44 }, { header: "Callback trigger", width: 42 },
  { header: "Human handover", width: 42 }, { header: "Prohibited claim", width: 42 }, { header: "Hotel response / custom SOP", width: 58 },
  { header: "Owner", width: 18 }, { header: "Approval", width: 16 }, { header: "Version", width: 12 }
]);
const prestayRows = [
  ["FLOW-BOOKING-001", "Booking", "Booking, availability, reserve, confirm", "Property, dates, guests, room preference", "Answer published booking process → explain live availability boundary → collect only needed enquiry details → offer consented callback/handover", "Ask one missing high-value field at a time.", "Explicit booking help, quotation, unresolved availability or guest asks for a call.", "Live availability, exception, group request, payment or booking confirmation.", "Never say booked/confirmed/paid without verified connector read-back."],
  ["FLOW-TARIFF-001", "Tariff", "Price, rate, tariff, package, tax", "Property, room category, stay period", "State exact published tariff → tax → inclusions → exclusions → validity → availability boundary", "Clarify property/category/period only when necessary.", "Guest requests quotation, negotiated rate or help choosing a package.", "Unpublished period, special rate, conflict or incomplete inclusion evidence.", "Never invent rate, discount, inclusion or live availability."],
  ["FLOW-LOCATION-001", "Location", "Where, address, map, directions", "Property", "Give exact address → map link → useful arrival landmark → transfer option", "Clarify property when tenant has multiple properties.", "Guest asks for transport arrangement or cannot locate property.", "Unsafe route, inaccessible road, after-hours arrival or special assistance.", "Do not replace requested location with another property or landmark."],
  ["FLOW-DISTANCE-001", "Distance", "Distance, how far, drive time", "Property, requested origin/landmark", "Name requested origin → exact published distance → typical drive time → transfer caveat", "Clarify the origin when multiple stations/airports could apply.", "Guest needs pickup or transport quotation.", "Unpublished origin, weather/road disruption or accessibility requirement.", "Do not substitute a different airport/station or claim exact live travel time."],
  ["FLOW-AMENITY-001", "Amenities", "Facility, amenity, included, free", "Property, amenity, requested entitlement", "Confirm availability → location/timing → charge/inclusion only when explicitly published → operating restriction", "Clarify ambiguous amenity name.", "Guest needs special arrangement or amenity reservation.", "Accessibility, child safety, unavailable/unclear charge or exception.", "Amenity existence does not prove it is free or included."],
  ["FLOW-MULTIPART-001", "Multipart", "Question contains two or more hotel topics", "All requested topics and property", "Decompose → run applicable SOP per topic → answer each supported item → name missing item → one next action", "Ask clarification only for the ambiguous part.", "Missing critical booking fact or explicit request for assistance.", "Any sensitive, transactional or unsupported part.", "Never drop a requested topic or turn one missing field into a total error."],
  ["FLOW-CALLBACK-001", "Callback", "Explicit call request or high-confidence commercial assistance", "Answered question, consent, guest name, phone, preferred time", "Answer known information first → explain why team help is useful → request consent → collect minimum details → confirm handover only", "Do not ask repeatedly after refusal or during ordinary information questions.", "Booking/quotation/help intent or unresolved important request.", "Invalid consent, secret/payment input or emergency.", "Never imply a callback has occurred or booking is confirmed."]
];
prestayRows.forEach((row) => prestay.addRow([...row, "", "Hotel Owner/Admin", "Pending", "v1.0"]));
styleRows(prestay, 5, 4 + prestayRows.length, [10, 11, 12, 13]);
for (let row = 5; row <= 4 + prestayRows.length; row += 1) listValidation(prestay.getCell(row, 12), ["Pending", "Approved", "Needs correction", "Not applicable"]);
markLocked(prestay, [`A5:I${4 + prestayRows.length}`, `M5:M${4 + prestayRows.length}`]);
markEditable(prestay, [`J5:J${4 + prestayRows.length}`], colours.paleGold);
markEditable(prestay, [`K5:K${4 + prestayRows.length}`], colours.paleBlue);
markEditable(prestay, [`L5:L${4 + prestayRows.length}`], colours.paleGreen);
prestay.getColumn(1).hidden = true; prestay.getColumn(13).hidden = true;
note(prestay.getCell("J4"), "YELLOW REQUIRED: write the hotel's actual SOP, contacts, conditions and exceptions. Do not copy the reference rule blindly.");

const instay = workbook.addWorksheet("In-Stay SOP");
setup(instay, "Verified In-Stay Operational SOP", "In-Stay is verified-user, department-routed ticketing. It does not use generative AI to answer guest requests.", [
  { header: "SOP ID", width: 20 }, { header: "Department", width: 22 }, { header: "Request / incident", width: 34 }, { header: "Guest acknowledgement", width: 48 },
  { header: "Target acknowledgement", width: 20 }, { header: "Target resolution", width: 20 }, { header: "Escalation trigger", width: 45 },
  { header: "Front desk control", width: 42 }, { header: "Completion evidence", width: 38 }, { header: "Hotel response / custom SOP", width: 58 },
  { header: "Approval", width: 16 }, { header: "Version", width: 12 }
]);
const instayRows = [
  ["INSTAY-FD-001", "Front Desk", "General information or assistance", "Request received. The front desk will review and update you.", "", "", "Guest safety, repeated request, overdue SLA or unresolved dependency", "Front desk owns guest communication and final resolution.", "Internal completion note and guest-facing completion message"],
  ["INSTAY-HK-001", "Housekeeping", "Cleaning, linen, towel or room supplies", "Your housekeeping request has been received.", "", "", "Urgent hygiene issue, room inaccessible or repeated unresolved request", "Route, monitor and communicate delay/completion.", "Department completion note"],
  ["INSTAY-FB-001", "Food & Beverage", "Dining, room service or dietary request", "Your dining request has been received.", "", "", "Allergy, medical dietary risk, unavailable item or payment dispute", "Confirm only staff-approved availability/timing to guest.", "Department completion note"],
  ["INSTAY-MAINT-001", "Maintenance", "Electrical, plumbing, AC, hot water or equipment issue", "Your maintenance request has been received.", "", "", "Safety risk, water leak, electrical hazard, room change or overdue repair", "Escalate safety issues immediately and control guest updates.", "Inspection and completion note"],
  ["INSTAY-EXP-001", "Safari & Experiences", "Activity, guide, safari or excursion assistance", "Your experience request has been received.", "", "", "Weather risk, permit, live availability, transport or payment requirement", "No activity is confirmed until staff verifies it.", "Verified arrangement or closure note"],
  ["INSTAY-SEC-001", "Security / Management", "Safety, security, harassment, medical or serious complaint", "Your urgent request has been received and escalated to the hotel team.", "Immediate", "Hotel-defined", "Always immediate", "Front desk/management owns all guest communication.", "Incident owner, action chronology and closure approval"],
  ["INSTAY-PRIV-001", "All departments", "Request for another guest's information", "For privacy, the hotel cannot provide another guest's personal or stay information.", "Immediate", "Immediate", "Suspicious or repeated request", "No department user may expose phone or private guest data.", "Privacy refusal recorded"]
];
instayRows.forEach((row) => instay.addRow([...row, "", "Pending", "v1.0"]));
styleRows(instay, 5, 4 + instayRows.length, [5, 6, 10, 11, 12]);
for (let row = 5; row <= 4 + instayRows.length; row += 1) listValidation(instay.getCell(row, 11), ["Pending", "Approved", "Needs correction", "Not applicable"]);
markLocked(instay, [`A5:D${4 + instayRows.length}`, `G5:I${4 + instayRows.length}`, `L5:L${4 + instayRows.length}`]);
markEditable(instay, [`E5:F${4 + instayRows.length}`, `J5:J${4 + instayRows.length}`], colours.paleGold);
markEditable(instay, [`K5:K${4 + instayRows.length}`], colours.paleGreen);
instay.getColumn(1).hidden = true; instay.getColumn(12).hidden = true;
note(instay.getCell("E4"), "YELLOW REQUIRED: enter the hotel's real acknowledgement target, such as 5 minutes or Immediate.");
note(instay.getCell("J4"), "YELLOW REQUIRED: describe the hotel's actual department procedure and escalation contacts. Do not enter guest-private data.");

const tariff = workbook.addWorksheet("Tariff & Payment");
setup(tariff, "Hotel Tariff, Meal Plans, Tax and Payment Policy", "Add one row per property, room category, plan and validity period. Only Approved + Guest-visible rows enter governed bot knowledge.", [
  { header: "Tariff ID", width: 20 }, { header: "Property code", width: 16 }, { header: "Room category", width: 28 }, { header: "Meal plan", width: 15 },
  { header: "Valid from", width: 15 }, { header: "Valid to", width: 15 }, { header: "Amount", width: 16 }, { header: "Currency", width: 12 },
  { header: "Pricing unit", width: 22 }, { header: "Base occupancy", width: 22 }, { header: "Inclusions", width: 42 }, { header: "Exclusions", width: 38 },
  { header: "Tax rate / rule", width: 24 }, { header: "Tax basis", width: 18 }, { header: "Cancellation policy", width: 46 }, { header: "Refund policy / timeline", width: 42 },
  { header: "No-show / early departure", width: 38 }, { header: "Official payment process", width: 48 }, { header: "Visibility", width: 18 }, { header: "Hotel approval", width: 18 }
]);
const tariffRows = [
  ["TARIFF-001", "MAIN", "Replace with room category", "EP", "", "", "Replace with amount", "INR", "per room per night", "Replace with adults/children", "Room only; replace with exact inclusions", "Meals, transfers and activities unless stated otherwise", "Replace with tax percentage or rule", "Exclusive", "Replace with date-based cancellation charges", "Replace with refund eligibility, method and working-day timeline", "Replace with applicable charge", "Use only the hotel-approved payment link or public transfer process. Never enter OTP, PIN, password, card data or private credentials.", "Guest-visible", "Pending"],
  ["TARIFF-002", "MAIN", "Replace with room category", "CP", "", "", "Replace with amount", "INR", "per room per night", "Replace with adults/children", "Breakfast; replace with exact inclusions", "Lunch, dinner, transfers and activities unless stated otherwise", "Replace with tax percentage or rule", "Exclusive", "Replace with date-based cancellation charges", "Replace with refund eligibility, method and working-day timeline", "Replace with applicable charge", "Use only the hotel-approved payment link or public transfer process. Never enter OTP, PIN, password, card data or private credentials.", "Guest-visible", "Pending"],
  ["TARIFF-003", "MAIN", "Replace with room category", "MAP", "", "", "Replace with amount", "INR", "per room per night", "Replace with adults/children", "Breakfast plus one principal meal; specify lunch or dinner", "Other meals, transfers and activities unless stated otherwise", "Replace with tax percentage or rule", "Exclusive", "Replace with date-based cancellation charges", "Replace with refund eligibility, method and working-day timeline", "Replace with applicable charge", "Use only the hotel-approved payment link or public transfer process. Never enter OTP, PIN, password, card data or private credentials.", "Guest-visible", "Pending"],
  ["TARIFF-004", "MAIN", "Replace with room category", "AP", "", "", "Replace with amount", "INR", "per room per night", "Replace with adults/children", "Breakfast, lunch and dinner; state beverages and exceptions", "Transfers and activities unless stated otherwise", "Replace with tax percentage or rule", "Exclusive", "Replace with date-based cancellation charges", "Replace with refund eligibility, method and working-day timeline", "Replace with applicable charge", "Use only the hotel-approved payment link or public transfer process. Never enter OTP, PIN, password, card data or private credentials.", "Guest-visible", "Pending"]
];
tariffRows.forEach((row) => tariff.addRow(row));
styleRows(tariff, 5, 4 + tariffRows.length, Array.from({ length: 19 }, (_, index) => index + 2));
for (let row = 5; row <= 4 + tariffRows.length; row += 1) {
  listValidation(tariff.getCell(row, 4), ["EP", "CP", "MAP", "AP", "Custom"]);
  listValidation(tariff.getCell(row, 8), ["INR", "USD", "EUR", "GBP", "Other"]);
  listValidation(tariff.getCell(row, 14), ["Inclusive", "Exclusive", "Exempt", "Mixed"]);
  listValidation(tariff.getCell(row, 19), ["Guest-visible", "Staff-only"]);
  listValidation(tariff.getCell(row, 20), ["Pending", "Approved", "Needs correction", "Not applicable"]);
}
markLocked(tariff, [`A5:A${4 + tariffRows.length}`]);
markEditable(tariff, [`B5:R${4 + tariffRows.length}`], colours.paleGold);
markEditable(tariff, [`S5:S${4 + tariffRows.length}`], colours.paleBlue);
markEditable(tariff, [`T5:T${4 + tariffRows.length}`], colours.paleGreen);
tariff.getColumn(1).hidden = true;
note(tariff.getCell("D4"), "EP = room only; CP = room + breakfast; MAP = room + breakfast + one principal meal; AP = room + breakfast + lunch + dinner. State hotel-specific exceptions.");
note(tariff.getCell("R4"), "Customer-safe official instructions only. Never enter passwords, OTPs, UPI PINs, card numbers, CVV, API keys or private credentials.");
note(tariff.getCell("S4"), "Staff-only rows are retained in the workbook but are never imported into guest-facing bot knowledge.");
note(tariff.getCell("T4"), "Only Approved rows can be staged by the importer.");

const sources = workbook.addWorksheet("Source Register");
setup(sources, "Hotel Knowledge Source Register", "List every website, PDF, spreadsheet, policy and authorised correction used to support hotel answers. This is evidence and freshness control, not an instruction source.", [
  { header: "Source ID", width: 20 }, { header: "Property code", width: 16 }, { header: "Source type", width: 20 }, { header: "Source title", width: 34 },
  { header: "Public URL or file name", width: 56 }, { header: "Information covered", width: 42 }, { header: "Source owner", width: 28 }, { header: "Effective date", width: 16 },
  { header: "Expiry / review date", width: 18 }, { header: "Hotel approval", width: 18 }, { header: "Version", width: 14 }, { header: "Last verified", width: 16 },
  { header: "Verification result", width: 22 }, { header: "Conflict / replacement notes", width: 48 }
]);
const sourceTypes = ["Official website", "Tariff document", "Cancellation policy", "Payment policy", "Hotel SOP", "Amenities guide", "Experience guide", "Food / menu", "Privacy policy", "Authorised correction", "Other", "Other"];
sourceTypes.forEach((type, index) => {
  const suffix = String(index + 1).padStart(3, "0");
  sources.addRow([`SOURCE-${suffix}`, "ALL", type, "", "", "", "", "", "", "Pending", "v1.0", "", "Not checked", ""]);
});
const sourceEnd = 4 + sourceTypes.length;
styleRows(sources, 5, sourceEnd, [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14]);
for (let row = 5; row <= sourceEnd; row += 1) {
  listValidation(sources.getCell(row, 3), ["Official website", "PDF", "Spreadsheet", "Policy", "Hotel SOP", "Menu", "Authorised correction", "Other"]);
  listValidation(sources.getCell(row, 10), ["Pending", "Approved", "Needs correction", "Retired"]);
  listValidation(sources.getCell(row, 13), ["Not checked", "Current", "Expired", "Missing", "Conflict", "Replaced"]);
}
markLocked(sources, [`A5:A${sourceEnd}`, `K5:K${sourceEnd}`]);
markEditable(sources, [`B5:J${sourceEnd}`, `L5:N${sourceEnd}`], colours.paleGold);
sources.getColumn(1).hidden = true; sources.getColumn(11).hidden = true;
note(sources.getCell("E4"), "For a website use a public HTTPS URL. For an uploaded document use the exact file name. Never enter a private download token or credential.");
note(sources.getCell("J4"), "Approval means the hotel recognises this source. Individual answers still require their own approval.");

const photos = workbook.addWorksheet("Photo Library");
setup(photos, "Hotel Photo Library", "Add public HTTPS photo URLs for rooms, amenities, experiences, food and other approved hotel visuals. A photo never proves availability, price or inclusion by itself.", [
  { header: "Photo ID", width: 20 }, { header: "Property code", width: 16 }, { header: "Category", width: 18 }, { header: "Item name", width: 30 },
  { header: "Public HTTPS photo URL", width: 56 }, { header: "Alt text", width: 42 }, { header: "Guest caption", width: 48 }, { header: "Display order", width: 14 },
  { header: "Guest-visible", width: 16 }, { header: "Usage rights confirmed", width: 20 }, { header: "Photographer / source", width: 28 },
  { header: "Hotel approval", width: 18 }, { header: "Version", width: 12 }, { header: "Last reviewed", width: 16 }, { header: "Notes / restrictions", width: 42 }
]);
const photoCategories = ["Room", "Room", "Room", "Room", "Amenity", "Amenity", "Amenity", "Amenity", "Experience", "Experience", "Experience", "Experience", "Food", "Food", "Food", "Food", "Exterior", "Exterior", "Event", "Other"];
photoCategories.forEach((category, index) => {
  const suffix = String(index + 1).padStart(3, "0");
  photos.addRow([`PHOTO-${suffix}`, "ALL", category, "", "", "", "", index + 1, "No", "No", "", "Pending", "v1.0", "", ""]);
});
const photoEnd = 4 + photoCategories.length;
styleRows(photos, 5, photoEnd, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15]);
for (let row = 5; row <= photoEnd; row += 1) {
  listValidation(photos.getCell(row, 3), ["Room", "Amenity", "Experience", "Food", "Exterior", "Event", "Other"]);
  listValidation(photos.getCell(row, 9), ["Yes", "No"]);
  listValidation(photos.getCell(row, 10), ["Yes", "No"]);
  listValidation(photos.getCell(row, 12), ["Pending", "Approved", "Needs correction", "Retired"]);
}
markLocked(photos, [`A5:A${photoEnd}`, `M5:M${photoEnd}`]);
markEditable(photos, [`B5:H${photoEnd}`, `K5:K${photoEnd}`, `N5:O${photoEnd}`], colours.paleGold);
markEditable(photos, [`I5:J${photoEnd}`], colours.paleBlue);
markEditable(photos, [`L5:L${photoEnd}`], colours.paleGreen);
photos.getColumn(1).hidden = true; photos.getColumn(13).hidden = true;
note(photos.getCell("E4"), "Use a direct, publicly accessible HTTPS image URL. Do not use a password-protected link or a page that requires login.");
note(photos.getCell("F4"), "Describe what is visibly shown for accessibility. Do not add claims that cannot be confirmed from approved hotel information.");
note(photos.getCell("J4"), "Select Yes only when the hotel owns the image or has permission to use it. Guest photographs require documented consent.");
note(photos.getCell("L4"), "Approval alone does not publish a photo. Publication also requires Guest-visible = Yes and Usage rights confirmed = Yes, followed by media verification.");

const verify = workbook.addWorksheet("Verification");
setup(verify, "Website and Readiness Verification", "To be completed by the future verification utility and reviewed by the hotel. A finding never changes approved knowledge automatically.", [
  { header: "Check ID", width: 20 }, { header: "Area", width: 24 }, { header: "Workbook status", width: 20 }, { header: "Website status", width: 20 },
  { header: "Finding", width: 52 }, { header: "Severity", width: 14 }, { header: "Owner", width: 20 }, { header: "Required action", width: 50 },
  { header: "Resolution", width: 18 }, { header: "Evidence / URL", width: 42 }, { header: "Verified version", width: 18 }, { header: "Verified date", width: 16 }
]);
const verificationAreas = [
  ["VERIFY-IDENTITY", "Identity and contact"], ["VERIFY-PROPERTY", "Property mapping"], ["VERIFY-ROOMS", "Rooms and occupancy"],
  ["VERIFY-TARIFF", "Tariff, tax and inclusions"], ["VERIFY-BOOKING", "Booking and availability"], ["VERIFY-PAYMENT", "Payment and invoice"],
  ["VERIFY-POLICY", "Policies"], ["VERIFY-AMENITY", "Amenities"], ["VERIFY-DINING", "Dining"], ["VERIFY-LOCATION", "Location and distance"],
  ["VERIFY-TRANSPORT", "Transport"], ["VERIFY-EXPERIENCE", "Experiences"], ["VERIFY-EVENT", "Weddings and events"],
  ["VERIFY-ACCESS", "Accessibility and families"], ["VERIFY-PRESTAY", "Pre-Stay flows"], ["VERIFY-INSTAY", "In-Stay SOP"],
  ["VERIFY-LANGUAGE", "Typos, Hinglish and variants"], ["VERIFY-PHOTOS", "Photo URLs, rights and captions"], ["VERIFY-OWNERSHIP", "Hotel ownership and approver authority"],
  ["VERIFY-SOURCES", "Source dates, expiry and conflicts"], ["VERIFY-STAFF", "Roles, access and training"], ["VERIFY-PRIVACY", "Privacy, consent and retention"],
  ["VERIFY-EMERGENCY", "After-hours and emergency escalation"], ["VERIFY-VERSION", "IDs and version completeness"]
];
verificationAreas.forEach(([id, area]) => verify.addRow([id, area, "Not checked", "Not checked", "", "", "Hotel + AiFrogi", "", "Open", "", "", ""]));
styleRows(verify, 5, 4 + verificationAreas.length, [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
for (let row = 5; row <= 4 + verificationAreas.length; row += 1) {
  listValidation(verify.getCell(row, 3), ["Not checked", "Complete", "Incomplete", "Not applicable"]);
  listValidation(verify.getCell(row, 4), ["Not checked", "Match", "Missing", "Conflict", "More detail"]);
  listValidation(verify.getCell(row, 6), ["Critical", "High", "Medium", "Low", "Information"]);
  listValidation(verify.getCell(row, 9), ["Open", "In progress", "Resolved", "Accepted exception"]);
}
markLocked(verify, [`A5:L${4 + verificationAreas.length}`]);
verify.getCell("A2").value = "AiFrogi review sheet — locked for hotel users. Website/PDF comparison findings will be written here by the verification utility.";

const launch = workbook.addWorksheet("Launch Approval");
setup(launch, "HotelGPT Final Launch Approval", "This final gate is completed only after hotel information, sources, flows, media, access and regression tests have been reviewed. It is separate from beginner data entry.", [
  { header: "Gate ID", width: 20 }, { header: "Final review gate", width: 38 }, { header: "Required evidence", width: 58 }, { header: "Owner", width: 24 },
  { header: "Status", width: 20 }, { header: "Evidence / notes", width: 54 }, { header: "Approved by", width: 24 }, { header: "Approval date", width: 16 },
  { header: "Release version", width: 18 }, { header: "Rollback owner / plan", width: 42 }
]);
const launchGates = [
  ["LAUNCH-IDENTITY", "Identity and authorised ownership", "Hotel identity, website and accountable approver verified", "Hotel Owner/Admin"],
  ["LAUNCH-KNOWLEDGE", "Approved knowledge complete", "Applicable standard/custom FAQs approved; samples and gaps resolved", "Hotel Knowledge Approver"],
  ["LAUNCH-TARIFF", "Tariff and policy review", "Rates, plans, taxes, deposits, cancellation, refund and payment boundaries checked", "Revenue / Reservations"],
  ["LAUNCH-SOURCES", "Website, PDF and source reconciliation", "Missing, stale and conflicting facts resolved with evidence", "Hotel + AiFrogi"],
  ["LAUNCH-PRESTAY", "Pre-Stay flow regression", "Booking, tariff, location, distance, amenities, multipart and callback journeys passed", "Hotel + AiFrogi"],
  ["LAUNCH-INSTAY", "Verified In-Stay operations", "Stay verification, departments, SLA, escalation and closure responsibilities passed", "Front Desk / Operations"],
  ["LAUNCH-PRIVACY", "Privacy and security", "Consent, retention, role access, credential prohibition and tenant isolation checked", "Hotel Owner/Admin"],
  ["LAUNCH-MEDIA", "Photo governance", "URLs, rights, captions, visibility, format and broken-link checks passed", "Marketing / Hotel Approver"],
  ["LAUNCH-LANGUAGE", "Language quality", "Approved English, Hindi/Hinglish or other supported-language test set passed", "Language Approver"],
  ["LAUNCH-STAFF", "Staff readiness", "Owner, front desk and department responsibilities and training confirmed", "Staff Onboarding Owner"],
  ["LAUNCH-ADDONS", "Advanced add-on boundaries", "Each enabled connector separately secured and tested; unused integrations remain inactive", "Hotel + AiFrogi"],
  ["LAUNCH-REGRESSION", "Bottom-to-top regression", "Source → claim → retrieval → answer/flow → feedback evidence passed", "AiFrogi"],
  ["LAUNCH-ROLLBACK", "Version and rollback", "Candidate version recorded with accountable rollback owner and recovery plan", "AiFrogi"],
  ["LAUNCH-SIGNOFF", "Final hotel acceptance", "Authorised hotel owner accepts the reviewed launch candidate", "Hotel Owner/Admin"]
];
launchGates.forEach((row) => launch.addRow([...row, "Not started", "", "", "", "", ""]));
const launchEnd = 4 + launchGates.length;
styleRows(launch, 5, launchEnd, [5, 6, 7, 8, 9, 10]);
for (let row = 5; row <= launchEnd; row += 1) listValidation(launch.getCell(row, 5), ["Not started", "In progress", "Passed", "Failed", "Not applicable"]);
markLocked(launch, [`A5:D${launchEnd}`]);
markEditable(launch, [`E5:F${launchEnd}`, `H5:J${launchEnd}`], colours.paleGold);
markEditable(launch, [`G5:G${launchEnd}`], colours.paleGreen);
launch.getColumn(1).hidden = true;
note(launch.getCell("E4"), "Passed must be supported by evidence. Do not use Passed to bypass missing information or an unresolved conflict.");
note(launch.getCell("G4"), "Final approval must identify the accountable person; it is not created automatically by completing the workbook.");

for (const sheet of workbook.worksheets) {
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };
  sheet.headerFooter.oddFooter = "AiFrogi HotelGPT onboarding · Hotel-owned information · Page &P of &N";
  await sheet.protect("aifrogi-governed-template-v2", {
    selectLockedCells: false,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    deleteColumns: false,
    deleteRows: false,
    sort: true,
    autoFilter: true
  });
}

await workbook.xlsx.writeFile(outputFile);
console.log(JSON.stringify({ outputFile, sheets: workbook.worksheets.map((sheet) => ({ name: sheet.name, rows: sheet.actualRowCount, columns: sheet.actualColumnCount })), faqCount: faqDefinitions.length }, null, 2));

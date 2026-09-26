import ExcelJS from "exceljs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(dir, "AiFrogi-HotelGPT-Complete-Onboarding-v2.xlsx");
const output = path.join(dir, "AiFrogi-HotelGPT-Client-Reference-Dummy-DO-NOT-UPLOAD.xlsx");
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(source);
workbook.title = "HotelGPT Client Reference — Fictional Dummy Hotel";
workbook.subject = "Completed example for client guidance only; not approved knowledge";

const demo = "DEMO ONLY — FICTIONAL DATA — DO NOT UPLOAD OR IMPORT";
for (const sheet of workbook.worksheets) {
  sheet.headerFooter.oddHeader = demo;
  sheet.headerFooter.oddFooter = `${demo} · Page &P of &N`;
  sheet.getCell("A1").value = `${sheet.getCell("A1").value || sheet.name} · CLIENT REFERENCE`;
  sheet.getCell("A1").note = { texts: [{ text: demo }] };
}

const start = workbook.getWorksheet("Start Here");
start.getCell("A2").value = `${demo}. This completed fictional example shows clients how to fill the blank onboarding workbook. Copy the approach—not the hotel names, rates, contacts, policies, URLs or approvals.`;
start.getCell("A2").font = { name: "Arial", size: 11, bold: true, color: { argb: "A12B24" } };
for (let row = 5; row <= 12; row += 1) start.getCell(row, 5).value = "Reference only";
for (let row = 36; row <= 45; row += 1) {
  start.getCell(row, 2).value = row === 36 ? "DemoPay Gateway" : row === 37 ? "DemoPMS Cloud" : "Not selected for demo";
  start.getCell(row, 3).value = row === 36 ? "Create secure advance-payment links and verify successful callbacks" : row === 37 ? "Read live room inventory and reservation status" : "Illustrative future integration only";
  start.getCell(row, 5).value = row <= 37 ? "Planned" : "Not required now";
}

const profile = workbook.getWorksheet("Business Profile");
const profileValues = {
  "Business legal name *": "Demo Heritage Hospitality Private Limited",
  "Industry / category *": "Boutique heritage hotel",
  "Website URL *": "https://demo-heritage-hotel.example.com",
  "Primary contact name *": "Aarav Sharma (Fictional General Manager)",
  "Contact email *": "reservations@demo-heritage-hotel.example.com",
  "Mobile number *": "+91 90000 00000",
  "Business address": "12 Demo Fort Road, Jaipur, Rajasthan 302001, India",
  "Business hours": "Reservations: 08:00–22:00 daily; Front desk: 24 hours",
  "Assistant name": "Mira",
  "Assistant tone": "Warm, concise and professional",
  "Main business objective": "Answer approved hotel questions, help guests plan a stay and route booking or exception requests to the reservations team.",
  "Topics the bot must not answer": "Another guest's information; unapproved discounts; live availability without PMS evidence; medical, legal or payment guarantees.",
  "When should the bot hand over to a human": "Live availability, quotation, booking changes, complaints, accessibility needs, payment issues and unresolved important questions.",
  "Default property code": "DEMO-JAI",
  "Additional property codes": "None",
  "Supported guest languages": "English, Hindi and Hinglish",
  "Reservation escalation contact": "Reservations Desk | +91 90000 00000 | reservations@demo-heritage-hotel.example.com",
  "Pre-Stay response SLA": "Within 60 minutes between 08:00 and 22:00 IST",
  "In-Stay emergency contact": "Dial 0 from the room or call +91 90000 00001",
  "Knowledge approver name and role": "Aarav Sharma — General Manager (fictional)",
  "Authorised ownership representative": "Diya Mehta — Director (fictional)",
  "Privacy policy URL": "https://demo-heritage-hotel.example.com/privacy",
  "Guest privacy / grievance contact": "privacy@demo-heritage-hotel.example.com",
  "Guest data retention rule": "Enquiry contact data is retained for 180 days unless a longer legal requirement applies; access is limited to authorised hotel staff.",
  "After-hours escalation contact": "Duty Manager via front desk",
  "Emergency escalation procedure": "Front desk contacts the Duty Manager immediately and follows the hotel's fire, medical or security SOP.",
  "Language approvers": "English | General Manager\nHindi/Hinglish | Front Office Manager",
  "Staff onboarding owner": "Front Office Manager (fictional)",
  "Launch approval owner": "Diya Mehta — Director (fictional)"
};
profile.eachRow((row, number) => { if (number >= 5 && profileValues[row.getCell(1).text]) { row.getCell(2).value = profileValues[row.getCell(1).text]; row.getCell(6).value = "26-Sep-2026"; } });

function demoValue(token) {
  const key = token.toLowerCase();
  if (key.includes("hotel name")) return "Demo Heritage Hotel";
  if (key.includes("hotel category")) return "boutique heritage hotel";
  if (key.includes("destination")) return "Jaipur, Rajasthan";
  if (key.includes("public number") || key.includes("phone")) return "+91 90000 00000";
  if (key.includes("public email") || key.includes("email")) return "reservations@demo-heritage-hotel.example.com";
  if (key.includes("full address")) return "12 Demo Fort Road, Jaipur, Rajasthan 302001";
  if (key.includes("approved link") || key.includes("official url") || key.includes("url")) return "https://demo-heritage-hotel.example.com/book";
  if (key.includes("start date")) return "1 October 2026";
  if (key.includes("end date")) return "31 March 2027";
  if (key.includes("percentage")) return "18";
  if (key.includes("amount")) return "7,500";
  if (key.includes("time")) return "08:00–22:00 IST";
  if (key.includes("number")) return "2";
  if (key.includes("category")) return "Deluxe Heritage Room";
  if (key.includes("distance")) return "14 km";
  if (key.includes("drive time")) return "35 minutes";
  if (key.includes("name")) return "Demo service";
  if (key.includes("details") || key.includes("approved")) return "the stated demo policy";
  if (key.includes("condition")) return "advance confirmation by hotel staff";
  if (key.includes("hours")) return "08:00–22:00 IST";
  if (key.includes("days")) return "7 days";
  if (key.includes("charge")) return "INR 1,500 plus applicable tax";
  if (key.includes("property")) return "DEMO-JAI";
  if (key.includes("origin")) return "Jaipur International Airport";
  return `demo ${token.toLowerCase()}`;
}

const faqs = workbook.getWorksheet("Approved FAQs");
for (let row = 2; row <= 73; row += 1) {
  const cell = faqs.getCell(row, 3);
  const template = String(cell.value || "").replace(/^SAMPLE ANSWER — DO NOT SUBMIT:\s*/i, "");
  cell.value = `FICTIONAL EXAMPLE: ${template.replace(/\[([^\]]+)\]/g, (_, token) => demoValue(token))}`;
  faqs.getCell(row, 7).value = "DEMO-JAI";
  faqs.getCell(row, 9).value = `Demo variation | ${faqs.getCell(row, 2).text.toLowerCase().replace(/[?]/g, "")}`;
  faqs.getCell(row, 10).value = "Demo Hinglish variation";
  faqs.getCell(row, 11).value = "Multiple";
  faqs.getCell(row, 12).value = "Fictional reference workbook";
  faqs.getCell(row, 14).value = "Reference only";
  faqs.getCell(row, 16).value = "26-Sep-2026";
}
const customExamples = [
  ["Local culture", "Does the hotel arrange a guided heritage walk?", "FICTIONAL EXAMPLE: Yes. A 90-minute guided heritage walk can be requested at least 24 hours in advance and is confirmed by hotel staff."],
  ["Celebrations", "Can the hotel arrange a birthday setup?", "FICTIONAL EXAMPLE: A simple birthday setup is available from INR 2,500 plus tax, subject to 48-hour advance confirmation."],
  ["Dining", "Can breakfast be packed for an early departure?", "FICTIONAL EXAMPLE: A packed breakfast can be requested before 20:00 on the previous evening, subject to the booked meal plan."]
];
customExamples.forEach((values, index) => {
  const row = 74 + index;
  faqs.getCell(row, 1).value = values[0]; faqs.getCell(row, 2).value = values[1]; faqs.getCell(row, 3).value = values[2];
  faqs.getCell(row, 7).value = "DEMO-JAI"; faqs.getCell(row, 12).value = "Fictional hotel SOP"; faqs.getCell(row, 14).value = "Reference only";
});

const prestay = workbook.getWorksheet("Pre-Stay SOP");
for (let row = 5; row <= 11; row += 1) {
  prestay.getCell(row, 10).value = `FICTIONAL EXAMPLE: Follow the displayed ${prestay.getCell(row, 2).text} sequence, use only approved DEMO-JAI knowledge, and transfer exceptions to the reservations team.`;
  prestay.getCell(row, 11).value = "Reservations Manager (fictional)";
  prestay.getCell(row, 12).value = "Reference only";
}
const instay = workbook.getWorksheet("In-Stay SOP");
for (let row = 5; row <= 11; row += 1) {
  instay.getCell(row, 5).value = row === 10 ? "Immediate" : "Within 5 minutes";
  instay.getCell(row, 6).value = row === 10 ? "Hotel-defined emergency response" : "Within 30 minutes or guest updated";
  instay.getCell(row, 10).value = `FICTIONAL EXAMPLE: Front desk logs the request, routes it to ${instay.getCell(row, 2).text}, monitors SLA and sends the final guest update.`;
  instay.getCell(row, 11).value = "Reference only";
}

const tariff = workbook.getWorksheet("Tariff & Payment");
const rates = [["Deluxe Heritage Room", "EP", 6500], ["Deluxe Heritage Room", "CP", 7500], ["Courtyard Suite", "MAP", 11500], ["Courtyard Suite", "AP", 13500]];
rates.forEach(([room, plan, amount], index) => {
  const row = 5 + index;
  const values = ["DEMO-JAI", room, plan, "01-Oct-2026", "31-Mar-2027", amount, "INR", "per room per night", "2 adults and 1 child below 6", `${plan} meal-plan inclusions`, "Transfers, activities and minibar", "18% GST", "Exclusive", "Free cancellation until 7 days before arrival; one-night charge thereafter", "Eligible refunds returned to the original method within 7–10 working days", "One-night charge", "Pay only through the fictional official booking link; staff confirms receipt", "Guest-visible", "Reference only"];
  values.forEach((value, index2) => tariff.getCell(row, index2 + 2).value = value);
});

const sources = workbook.getWorksheet("Source Register");
const sourceRows = [
  ["Official website", "Demo Heritage Hotel website", "https://demo-heritage-hotel.example.com", "Identity, rooms, amenities and contact"],
  ["Tariff document", "Demo Winter Tariff 2026–27.pdf", "Demo-Winter-Tariff-2026-27.pdf", "Rates, taxes and meal plans"],
  ["Cancellation policy", "Demo Cancellation Policy.pdf", "Demo-Cancellation-Policy.pdf", "Cancellation, no-show and refund"],
  ["Hotel SOP", "Demo Guest Service SOP.pdf", "Demo-Guest-Service-SOP.pdf", "Pre-Stay and In-Stay operations"]
];
sourceRows.forEach((values, index) => {
  const row = 5 + index;
  sources.getCell(row, 2).value = "DEMO-JAI"; sources.getCell(row, 3).value = values[0]; sources.getCell(row, 4).value = values[1]; sources.getCell(row, 5).value = values[2]; sources.getCell(row, 6).value = values[3];
  sources.getCell(row, 7).value = "Demo Hotel Knowledge Owner"; sources.getCell(row, 8).value = "01-Oct-2026"; sources.getCell(row, 9).value = "31-Mar-2027"; sources.getCell(row, 10).value = "Reference only"; sources.getCell(row, 12).value = "26-Sep-2026"; sources.getCell(row, 13).value = "Current";
});

const photos = workbook.getWorksheet("Photo Library");
for (let row = 5; row <= 12; row += 1) {
  const category = photos.getCell(row, 3).text;
  photos.getCell(row, 2).value = "DEMO-JAI";
  photos.getCell(row, 4).value = `${category} example ${row - 4}`;
  photos.getCell(row, 5).value = `https://images.demo-heritage-hotel.example.com/${category.toLowerCase()}-${row - 4}.jpg`;
  photos.getCell(row, 6).value = `Fictional ${category.toLowerCase()} photograph for layout reference`;
  photos.getCell(row, 7).value = `Explore this fictional ${category.toLowerCase()} at Demo Heritage Hotel.`;
  photos.getCell(row, 9).value = "No"; photos.getCell(row, 10).value = "No"; photos.getCell(row, 11).value = "Fictional reference source"; photos.getCell(row, 12).value = "Reference only";
}

const launch = workbook.getWorksheet("Launch Approval");
for (let row = 5; row <= 18; row += 1) {
  launch.getCell(row, 5).value = "Not started";
  launch.getCell(row, 6).value = "FICTIONAL EXAMPLE: attach actual evidence after completing this gate.";
  launch.getCell(row, 7).value = "Not approved — client reference only";
  launch.getCell(row, 8).value = "";
  launch.getCell(row, 9).value = "DEMO-v1.0";
  launch.getCell(row, 10).value = "FICTIONAL EXAMPLE: named release owner restores the previously verified version.";
}

await workbook.xlsx.writeFile(output);
console.log(JSON.stringify({ output, sheets: workbook.worksheets.length, notice: demo }, null, 2));

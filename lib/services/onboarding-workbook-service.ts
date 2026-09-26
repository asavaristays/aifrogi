import ExcelJS from "exceljs";
import { getDb } from "@/lib/db";
import { createKnowledgeDocument, detectDocumentConflict } from "@/lib/repositories/knowledge-content-repository";
import { stageDocumentAtomicClaims } from "@/lib/repositories/knowledge-verification-repository";
import { saveOrganizationBotProfile, updateOrganizationDetails } from "@/lib/repositories/onboarding-repository";

const MAX_FILE_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME = new Set(["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream", ""]);

type Faq = { category: string; question: string; answer: string; refreshDays: number };
export type OnboardingWorkbookPreview = {
  business: Record<string, string>;
  faqs: Faq[];
  governance: {
    questionVariants: number;
    preStayApproved: number;
    inStayApproved: number;
    sourcesApproved: number;
    photosApproved: number;
    launchGatesPassed: number;
    launchGateTotal: number;
    blockers: string[];
    approvedEvidenceText: string[];
  };
  warnings: string[];
  fileName: string;
};

const labels: Record<string, string> = {
  "business legal name *": "name",
  "business / organisation name *": "name",
  "business organisation name *": "name",
  "industry / category *": "industry",
  "industry category *": "industry",
  "industry *": "industry",
  "website url *": "website",
  "website address *": "website",
  "primary contact name *": "ownerName",
  "contact person *": "ownerName",
  "contact email *": "publicEmail",
  "business email *": "publicEmail",
  "mobile / whatsapp *": "publicPhone",
  "mobile number *": "publicPhone",
  "ai bot type *": "botType",
  "business address": "publicAddress",
  "business hours": "publicBusinessHours",
  "address / google maps link": "publicAddress",
  "assistant name": "personaName",
  "assistant tone": "tone",
  "main business objective": "businessObjective",
  "what should the bot achieve *": "businessObjective",
  "bot tone": "tone",
  "topics the bot must not answer": "prohibitedClaims",
  "what must the bot never claim *": "prohibitedClaims",
  "when should the bot hand over to a human": "escalationTriggers",
  "human handover contact *": "escalationTriggers",
  "approved faq pairs": "faqText",
  "top customer questions and answers *": "faqText"
};

function text(value: unknown) {
  if (value == null) return "";
  if (typeof value === "object" && "formula" in (value as object)) throw new Error("Formula cells are not accepted. Paste plain approved values into the workbook.");
  if (typeof value === "object" && "text" in (value as object)) return String((value as { text?: unknown }).text || "").trim();
  return String(value).replace(/\u0000/g, "").trim();
}

function key(value: unknown) {
  return text(value).toLowerCase().replace(/[^a-z0-9*]+/g, " ").replace(/\s+/g, " ").trim();
}

function safe(value: string, max: number, field: string) {
  if (value.length > max) throw new Error(`${field} is too long (maximum ${max} characters).`);
  if (/\b(password|otp|secret key|api key|private key)\b\s*[:=-]/i.test(value)) throw new Error(`${field} appears to contain a credential. Remove passwords, OTPs and secret keys before importing.`);
  return value;
}

function parseFaqText(value: string): Faq[] {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const faqs: Faq[] = [];
  for (const line of lines) {
    const match = line.match(/^(?:q\s*[:.-]\s*)?(.+?)\s*(?:\||\t|\s+-\s+|\s+a\s*:\s*)(.+)$/i);
    if (match) faqs.push({ category: "General", question: safe(match[1].trim(), 500, "FAQ question"), answer: safe(match[2].trim(), 4000, "FAQ answer"), refreshDays: 90 });
  }
  return faqs;
}

function parseTariffSheet(workbook: ExcelJS.Workbook, warnings: string[]): Faq[] {
  const sheet = workbook.getWorksheet("Tariff & Payment");
  if (!sheet) return [];
  const faqs: Faq[] = [];
  sheet.eachRow((row, number) => {
    if (number < 5 || !text(row.getCell(2).value)) return;
    const approval = text(row.getCell(20).value);
    const visibility = text(row.getCell(19).value);
    if (approval !== "Approved" || visibility !== "Guest-visible") {
      if (approval === "Approved" && visibility !== "Guest-visible") warnings.push(`Tariff & Payment row ${number} is approved but not guest-visible, so it was not imported.`);
      return;
    }
    const property = safe(text(row.getCell(2).value), 80, "Tariff property code");
    const room = safe(text(row.getCell(3).value), 160, "Tariff room category");
    const plan = safe(text(row.getCell(4).value), 40, "Tariff meal plan");
    const amount = safe(text(row.getCell(7).value), 60, "Tariff amount");
    const currency = safe(text(row.getCell(8).value) || "INR", 12, "Tariff currency");
    if (!room || !plan || !amount) throw new Error(`Tariff & Payment row ${number} needs room category, meal plan and amount before approval.`);
    const parts = [
      `${room} at ${property} is ${currency} ${amount} for the ${plan} plan`,
      text(row.getCell(9).value) ? `priced ${text(row.getCell(9).value)}` : "",
      text(row.getCell(5).value) || text(row.getCell(6).value) ? `valid from ${text(row.getCell(5).value) || "the stated start"} to ${text(row.getCell(6).value) || "the stated end"}` : "",
      text(row.getCell(10).value) ? `base occupancy: ${text(row.getCell(10).value)}` : "",
      text(row.getCell(11).value) ? `includes ${text(row.getCell(11).value)}` : "",
      text(row.getCell(12).value) ? `excludes ${text(row.getCell(12).value)}` : "",
      text(row.getCell(13).value) ? `tax: ${text(row.getCell(13).value)} (${text(row.getCell(14).value) || "basis not stated"})` : "",
      text(row.getCell(15).value) ? `cancellation: ${text(row.getCell(15).value)}` : "",
      text(row.getCell(16).value) ? `refund: ${text(row.getCell(16).value)}` : "",
      text(row.getCell(17).value) ? `no-show/early departure: ${text(row.getCell(17).value)}` : "",
      text(row.getCell(18).value) ? `official payment process: ${text(row.getCell(18).value)}` : "",
      "Live availability, booking and payment remain subject to verified hotel confirmation."
    ].filter(Boolean);
    faqs.push({
      category: "Tariff",
      question: `What is the approved ${plan} tariff for ${room} at ${property}?`,
      answer: safe(`${parts.join("; ")}.`, 4000, "Tariff answer"),
      refreshDays: 7
    });
  });
  return faqs;
}

function parseGovernance(workbook: ExcelJS.Workbook) {
  const blockers: string[] = [];
  const approvedEvidenceText: string[] = [];
  let questionVariants = 0;
  let preStayApproved = 0;
  let inStayApproved = 0;
  let sourcesApproved = 0;
  let photosApproved = 0;
  let launchGatesPassed = 0;
  let launchGateTotal = 0;

  workbook.getWorksheet("Approved FAQs")?.eachRow((row, number) => {
    if (number === 1) return;
    questionVariants += [text(row.getCell(9).value), text(row.getCell(10).value)].flatMap((value) => value.split("|").map((item) => item.trim()).filter(Boolean)).length;
  });
  workbook.getWorksheet("Pre-Stay SOP")?.eachRow((row, number) => {
    if (number < 5 || text(row.getCell(12).value) !== "Approved") return;
    if (!text(row.getCell(10).value)) blockers.push(`Pre-Stay SOP row ${number} is Approved but has no hotel custom SOP.`);
    else { preStayApproved += 1; approvedEvidenceText.push(`Pre-Stay ${text(row.getCell(2).value)}: ${text(row.getCell(10).value)}`); }
  });
  workbook.getWorksheet("In-Stay SOP")?.eachRow((row, number) => {
    if (number < 5 || text(row.getCell(11).value) !== "Approved") return;
    if (!text(row.getCell(5).value) || !text(row.getCell(6).value) || !text(row.getCell(10).value)) blockers.push(`In-Stay SOP row ${number} is Approved but acknowledgement time, resolution time or hotel SOP is missing.`);
    else { inStayApproved += 1; approvedEvidenceText.push(`In-Stay ${text(row.getCell(2).value)} / ${text(row.getCell(3).value)}: ${text(row.getCell(10).value)}`); }
  });
  workbook.getWorksheet("Source Register")?.eachRow((row, number) => {
    if (number < 5 || text(row.getCell(10).value) !== "Approved") return;
    const title = text(row.getCell(4).value), location = text(row.getCell(5).value), result = text(row.getCell(13).value);
    if (!title || !location || result !== "Current") blockers.push(`Source Register row ${number} is Approved but needs a title, URL/file name and Current verification result.`);
    else { sourcesApproved += 1; approvedEvidenceText.push(`Source ${title}: ${location}; covers ${text(row.getCell(6).value) || "not stated"}.`); }
  });
  workbook.getWorksheet("Photo Library")?.eachRow((row, number) => {
    if (number < 5 || text(row.getCell(12).value) !== "Approved") return;
    const url = text(row.getCell(5).value), visible = text(row.getCell(9).value), rights = text(row.getCell(10).value);
    let validUrl = false;
    try { validUrl = new URL(url).protocol === "https:"; } catch { validUrl = false; }
    if (!text(row.getCell(4).value) || !validUrl || !text(row.getCell(6).value) || visible !== "Yes" || rights !== "Yes") blockers.push(`Photo Library row ${number} is Approved but needs an item name, public HTTPS URL, alt text, Guest-visible Yes and Usage rights confirmed Yes.`);
    else { photosApproved += 1; approvedEvidenceText.push(`Photo ${text(row.getCell(4).value)}: ${url}; ${text(row.getCell(6).value)}.`); }
  });
  workbook.getWorksheet("Launch Approval")?.eachRow((row, number) => {
    if (number < 5 || !text(row.getCell(2).value)) return;
    launchGateTotal += 1;
    if (text(row.getCell(5).value) === "Passed") {
      if (!text(row.getCell(6).value) || !text(row.getCell(7).value) || !text(row.getCell(8).value)) blockers.push(`Launch Approval row ${number} is Passed but needs evidence, approver and approval date.`);
      else launchGatesPassed += 1;
    }
  });
  return { questionVariants, preStayApproved, inStayApproved, sourcesApproved, photosApproved, launchGatesPassed, launchGateTotal, blockers, approvedEvidenceText };
}

export async function parseOnboardingWorkbook(file: File): Promise<{ preview: OnboardingWorkbookPreview; bytes: Uint8Array }> {
  if (!file.name.toLowerCase().endsWith(".xlsx") || !ALLOWED_MIME.has(file.type)) throw new Error("Upload the AiFrogi .xlsx onboarding workbook.");
  if (!file.size || file.size > MAX_FILE_BYTES) throw new Error("The onboarding workbook must be smaller than 3 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (String.fromCharCode(...bytes.slice(0, 2)) !== "PK") throw new Error("This is not a valid XLSX workbook.");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer);
  if (workbook.worksheets.length > 10 || workbook.worksheets.some((sheet) => sheet.actualRowCount > 1000 || sheet.actualColumnCount > 20)) throw new Error("The workbook exceeds the safe onboarding template limits.");
  const business: Record<string, string> = {};
  const warnings: string[] = [];
  const first = workbook.getWorksheet("Business Profile") || workbook.worksheets[0];
  if (!first) throw new Error("The workbook has no readable worksheet.");
  first.eachRow((row) => {
    const mapped = labels[key(row.getCell(1).value)];
    if (mapped) business[mapped] = safe(text(row.getCell(2).value), mapped === "businessObjective" ? 1000 : 500, mapped);
  });
  let faqs: Faq[] = [];
  const faqSheet = workbook.getWorksheet("Approved FAQs");
  if (faqSheet) {
    faqSheet.eachRow((row, number) => {
      if (number === 1 || !text(row.getCell(2).value)) return;
      const question = safe(text(row.getCell(2).value), 500, "FAQ question");
      const answer = safe(text(row.getCell(3).value), 4000, "FAQ answer");
      if (!answer) throw new Error(`Approved FAQs row ${number} needs an approved answer.`);
      if (/^(?:replace this\b|sample answer\s*[—-]\s*do not submit\b)/i.test(answer)) { warnings.push(`Approved FAQs row ${number} is still an example and was not imported.`); return; }
      const signOff = text(row.getCell(14).value);
      if (signOff && signOff !== "Approved") { warnings.push(`Approved FAQs row ${number} is not hotel-approved and was not imported.`); return; }
      const rawDays = Number(text(row.getCell(4).value) || "90");
      faqs.push({ category: safe(text(row.getCell(1).value) || "General", 100, "FAQ category"), question, answer, refreshDays: Number.isFinite(rawDays) ? Math.min(365, Math.max(1, Math.round(rawDays))) : 90 });
    });
  } else if (business.faqText) {
    faqs = parseFaqText(business.faqText);
    if (business.faqText && !faqs.length) warnings.push("The FAQ text could not be separated reliably. Use one ‘Question | Approved answer’ pair per line or the new Approved FAQs sheet.");
  }
  faqs.push(...parseTariffSheet(workbook, warnings));
  const governance = parseGovernance(workbook);
  warnings.push(...governance.blockers);
  if (!business.name) throw new Error("Business / organisation name is required.");
  if (!business.industry && business.botType) business.industry = business.botType;
  if (!business.industry) throw new Error("Industry / category is required.");
  if (!business.website) throw new Error("Website URL is required.");
  try { new URL(business.website); } catch { throw new Error("Website URL must include https:// or http://."); }
  if (!business.ownerName) throw new Error("Primary contact name is required.");
  if (!business.publicEmail || !/^\S+@\S+\.\S+$/.test(business.publicEmail)) throw new Error("Add a valid contact email.");
  if (!business.publicPhone) throw new Error("Mobile number is required.");
  if (!faqs.length) warnings.push("No structured FAQ answers were found. Business details can still be imported; knowledge will remain empty.");
  return { preview: { business, faqs, governance, warnings, fileName: file.name.replace(/[\r\n]/g, " ").slice(0, 180) }, bytes };
}

export async function applyOnboardingWorkbook(input: { organizationId: string; propertyId: string; actorEmail: string; file: File }) {
  const { preview, bytes } = await parseOnboardingWorkbook(input.file);
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const organization = await db.organization.findUnique({ where: { id: input.organizationId }, include: { botProfile: true } });
  if (!organization) throw new Error("Customer workspace not found.");
  await updateOrganizationDetails(input.organizationId, {
    name: preview.business.name,
    industry: preview.business.industry,
    website: preview.business.website,
    ownerName: preview.business.ownerName,
    publicEmail: preview.business.publicEmail,
    publicPhone: preview.business.publicPhone,
    publicAddress: preview.business.publicAddress || null,
    publicBusinessHours: preview.business.publicBusinessHours || null
  });
  if (organization.botProfile && (preview.business.personaName || preview.business.tone || preview.business.businessObjective)) {
    await saveOrganizationBotProfile({
      organizationId: input.organizationId,
      actorEmail: input.actorEmail,
      profile: {
        category: organization.botProfile.category as Parameters<typeof saveOrganizationBotProfile>[0]["profile"]["category"],
        operatingMode: organization.botProfile.operatingMode as Parameters<typeof saveOrganizationBotProfile>[0]["profile"]["operatingMode"],
        channels: organization.botProfile.channels as Parameters<typeof saveOrganizationBotProfile>[0]["profile"]["channels"],
        capabilities: organization.botProfile.capabilities,
        humanHandoffEnabled: organization.botProfile.humanHandoffEnabled,
        actionApprovalNeeded: organization.botProfile.actionApprovalNeeded,
        personaName: preview.business.personaName || organization.botProfile.personaName || "Business Assistant",
        tone: preview.business.tone || organization.botProfile.tone || "Professional, clear and helpful",
        businessObjective: preview.business.businessObjective || organization.botProfile.businessObjective || "Answer approved business questions and arrange human follow-up when required.",
        languages: organization.botProfile.languages.length ? organization.botProfile.languages : ["English"],
        prohibitedClaims: preview.business.prohibitedClaims ? preview.business.prohibitedClaims.split(/\r?\n|;/).map((v) => v.trim()).filter(Boolean) : organization.botProfile.prohibitedClaims,
        escalationTriggers: preview.business.escalationTriggers ? preview.business.escalationTriggers.split(/\r?\n|;/).map((v) => v.trim()).filter(Boolean) : organization.botProfile.escalationTriggers,
        responseSlaMinutes: organization.botProfile.responseSlaMinutes,
        reminderPercent: organization.botProfile.reminderPercent,
        fallbackEnabled: organization.botProfile.fallbackEnabled,
        safeFallbackMessage: organization.botProfile.safeFallbackMessage || "Thank you. Our team will respond as soon as possible. No booking, price, availability or commercial commitment is confirmed by this message."
      }
    });
  }
  let stagedCount = 0;
  if (preview.faqs.length || preview.governance.approvedEvidenceText.length) {
    const extractedText = [...preview.faqs.map((faq) => `${faq.question}\n${faq.answer}`), ...preview.governance.approvedEvidenceText].join("\n\n");
    const conflictSummary = await detectDocumentConflict(input.propertyId, extractedText);
    const content = new Uint8Array(bytes.byteLength); content.set(bytes);
    const document = await createKnowledgeDocument({ propertyId: input.propertyId, fileName: preview.fileName, mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeBytes: bytes.byteLength, content, extractedText, uploadedBy: input.actorEmail, conflictSummary });
    if (preview.faqs.length) {
      const claims = await stageDocumentAtomicClaims({ propertyId: input.propertyId, documentId: document.id, createdBy: input.actorEmail, claims: preview.faqs.map((faq) => ({ ...faq, claimType: "FACT", valueType: "TEXT", currency: null })) });
      stagedCount = claims.length;
    }
  }
  await db.onboardingActivity.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, action: "ONBOARDING_WORKBOOK_IMPORTED", detail: JSON.stringify({ fileName: preview.fileName, stagedCount, profileFields: Object.keys(preview.business).filter((name) => name !== "faqText"), governance: { questionVariants: preview.governance.questionVariants, preStayApproved: preview.governance.preStayApproved, inStayApproved: preview.governance.inStayApproved, sourcesApproved: preview.governance.sourcesApproved, photosApproved: preview.governance.photosApproved, launchGatesPassed: preview.governance.launchGatesPassed, launchGateTotal: preview.governance.launchGateTotal, blockers: preview.governance.blockers } }) } });
  return { preview, stagedCount };
}

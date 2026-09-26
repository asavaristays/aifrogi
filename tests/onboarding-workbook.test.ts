import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { parseOnboardingWorkbook } from "@/lib/services/onboarding-workbook-service";

async function workbookFile(answer = "Call +91 74105 82898 or email info@example.com.") {
  const workbook = new ExcelJS.Workbook();
  const profile = workbook.addWorksheet("Business Profile");
  profile.addRows([
    ["Business legal name *", "Example Business", "Name customers should recognise"], ["Industry *", "Professional services", "Industry category"], ["Website address *", "https://example.com", "Public website"],
    ["Contact person *", "Example Owner", "Authorised owner"], ["Business email *", "owner@example.com", "Public email"], ["Mobile number *", "+91 74105 82898", "Public mobile"]
  ]);
  const faqs = workbook.addWorksheet("Approved FAQs");
  faqs.addRows([["Category", "Customer question", "Approved answer", "Refresh days"], ["Contact", "How can I contact you?", answer, 30]]);
  const bytes = await workbook.xlsx.writeBuffer();
  return new File([bytes], "onboarding.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

async function sevenSheetTariffWorkbook(visibility = "Guest-visible") {
  const file = await workbookFile();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as unknown as ExcelJS.Buffer);
  for (const name of ["Start Here", "Pre-Stay SOP", "In-Stay SOP", "Verification"]) workbook.addWorksheet(name);
  const tariff = workbook.addWorksheet("Tariff & Payment");
  tariff.addRows([
    ["title"], ["subtitle"], [], Array.from({ length: 20 }, (_, index) => `Column ${index + 1}`),
    ["TARIFF-001", "MAIN", "Deluxe Room", "CP", "2026-10-01", "2027-03-31", "7500", "INR", "per room per night", "2 adults", "Breakfast", "Transfers", "18%", "Exclusive", "Free until 7 days", "7 working days", "One night", "Official hotel payment link", visibility, "Approved"]
  ]);
  const bytes = await workbook.xlsx.writeBuffer();
  return new File([bytes], "hotel-onboarding.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

test("onboarding workbook parses approved profile and FAQ data", async () => {
  const { preview } = await parseOnboardingWorkbook(await workbookFile());
  assert.equal(preview.business.name, "Example Business");
  assert.equal(preview.faqs.length, 1);
  assert.equal(preview.faqs[0].refreshDays, 30);
});

test("onboarding workbook skips unchanged example answers", async () => {
  const { preview } = await parseOnboardingWorkbook(await workbookFile("Replace this with an approved answer."));
  assert.equal(preview.faqs.length, 0);
  assert.match(preview.warnings.join(" "), /still an example/);
});

test("onboarding workbook skips the hotel template sample-answer marker", async () => {
  const { preview } = await parseOnboardingWorkbook(await workbookFile("SAMPLE ANSWER — DO NOT SUBMIT: The hotel opens at 9 AM."));
  assert.equal(preview.faqs.length, 0);
  assert.match(preview.warnings.join(" "), /still an example/);
});

test("template FAQ rows with a non-approved sign-off are not imported", async () => {
  const file = await workbookFile();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as unknown as ExcelJS.Buffer);
  workbook.getWorksheet("Approved FAQs")!.getCell("N2").value = "Pending";
  const bytes = await workbook.xlsx.writeBuffer();
  const pending = new File([bytes], "pending.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const { preview } = await parseOnboardingWorkbook(pending);
  assert.equal(preview.faqs.length, 0);
  assert.match(preview.warnings.join(" "), /not hotel-approved/);
});

test("onboarding workbook rejects credential-like content", async () => {
  const file = await workbookFile("API key: abc123");
  await assert.rejects(() => parseOnboardingWorkbook(file), /credential/);
});

test("seven-sheet onboarding workbook imports approved guest-visible tariff rows", async () => {
  const { preview } = await parseOnboardingWorkbook(await sevenSheetTariffWorkbook());
  assert.equal(preview.faqs.length, 2);
  assert.match(preview.faqs[1].question, /CP tariff for Deluxe Room/);
  assert.match(preview.faqs[1].answer, /INR 7500/);
});

test("staff-only tariff rows never enter guest-facing knowledge", async () => {
  const { preview } = await parseOnboardingWorkbook(await sevenSheetTariffWorkbook("Staff-only"));
  assert.equal(preview.faqs.length, 1);
  assert.match(preview.warnings.join(" "), /not guest-visible/);
});

test("eight-sheet onboarding workbook remains within the importer safety limit", async () => {
  const file = await sevenSheetTariffWorkbook();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as unknown as ExcelJS.Buffer);
  workbook.addWorksheet("Photo Library");
  const bytes = await workbook.xlsx.writeBuffer();
  const eightSheet = new File([bytes], "hotel-with-photos.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const { preview } = await parseOnboardingWorkbook(eightSheet);
  assert.equal(preview.faqs.length, 2);
});

test("ten-sheet final-review workbook remains within the importer safety limit", async () => {
  const file = await sevenSheetTariffWorkbook();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as unknown as ExcelJS.Buffer);
  workbook.addWorksheet("Source Register");
  workbook.addWorksheet("Photo Library");
  workbook.addWorksheet("Launch Approval");
  const bytes = await workbook.xlsx.writeBuffer();
  const finalReview = new File([bytes], "hotel-final-review.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const { preview } = await parseOnboardingWorkbook(finalReview);
  assert.equal(preview.faqs.length, 2);
});

test("final-review governance rejects unsupported Passed and Approved declarations", async () => {
  const file = await workbookFile();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as unknown as ExcelJS.Buffer);
  const photos = workbook.addWorksheet("Photo Library");
  photos.addRows([["title"], ["subtitle"], [], Array.from({ length: 15 }, (_, index) => `Column ${index + 1}`), ["PHOTO-001", "MAIN", "Room", "Deluxe", "http://unsafe.test/room.jpg", "", "", 1, "Yes", "No", "Hotel", "Approved", "v1.0", "", ""]]);
  const launch = workbook.addWorksheet("Launch Approval");
  launch.addRows([["title"], ["subtitle"], [], ["Gate ID", "Gate", "Evidence needed", "Owner", "Status", "Evidence", "Approved by", "Approval date"], ["LAUNCH-1", "Final", "Evidence", "Owner", "Passed", "", "", ""]]);
  const bytes = await workbook.xlsx.writeBuffer();
  const governed = new File([bytes], "governed.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const { preview } = await parseOnboardingWorkbook(governed);
  assert.equal(preview.governance.photosApproved, 0);
  assert.equal(preview.governance.launchGatesPassed, 0);
  assert.match(preview.governance.blockers.join(" "), /public HTTPS URL/);
  assert.match(preview.governance.blockers.join(" "), /needs evidence, approver and approval date/);
});

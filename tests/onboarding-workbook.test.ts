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

test("onboarding workbook rejects credential-like content", async () => {
  const file = await workbookFile("API key: abc123");
  await assert.rejects(() => parseOnboardingWorkbook(file), /credential/);
});

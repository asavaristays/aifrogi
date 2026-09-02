import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "/Users/manishpurohit/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const path = "public/downloads/AiFrogi-Simple-AI-Bot-Onboarding.xlsx";
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(path));
const setup = workbook.worksheets.getItem("AI Bot Setup");
setup.getRange("A12").values = [["Mobile number *"]];
setup.getRange("C12").values = [["Include country code; do not enter OTPs or passwords"]];
setup.getRange("A28:C31").values = [
  ["1", "Validate and preview", "Sign in to AiFrogi and upload this completed workbook."],
  ["2", "Import approved information", "Business details are updated and FAQs are staged inside Intelligence."],
  ["3", "Review real answers", "Approve each field and conversational preview before publication."],
  ["4", "Install and go live", "Use the supplied JavaScript, WordPress code or shareable link after approval."]
];

const faqs = workbook.worksheets.add("Approved FAQs");
faqs.getRange("A1:D8").values = [
  ["Category", "Customer question", "Approved answer", "Refresh days"],
  ["Contact", "How can I contact your team?", "Replace this with the approved public phone and email.", 90],
  ["Services", "What services do you provide?", "Replace this with a short approved answer.", 90],
  ["Pricing", "How much does it cost?", "Replace this only with an approved price or explain how to request a quote.", 30],
  ["Hours", "When are you open?", "Replace this with approved business hours and timezone.", 30],
  ["Location", "Where are you located?", "Replace this with the approved address or map link.", 90],
  [null, null, null, null],
  ["Add more rows below. Do not include passwords, OTPs, secret keys, unapproved promises or sensitive personal data.", null, null, null]
];
faqs.getRange("A1:D1").format = { fill: "#151515", font: { bold: true, color: "#FFFFFF" }, rowHeight: 28 };
faqs.getRange("A2:D6").format = { fill: "#FFF9E8", wrapText: true, verticalAlignment: "top" };
faqs.getRange("A8:D8").merge();
faqs.getRange("A8").format = { fill: "#EDE9DF", font: { italic: true, color: "#5F5A52" }, wrapText: true, rowHeight: 38 };
faqs.getRange("A:D").format.columnWidth = 18;
faqs.getRange("B:C").format.columnWidth = 42;
faqs.getRange("D:D").format.columnWidth = 14;
faqs.freezePanes.freezeRows(1);

const sources = workbook.worksheets.add("Approved Sources");
sources.getRange("A1:C6").values = [
  ["Source type", "Approved URL or file name", "Notes"],
  ["Website", "https://yourbusiness.com", "Only add pages the bot is allowed to use."],
  ["Policy", "refund-policy.pdf", "Upload the file separately in Intelligence after import."],
  [null, null, null],
  [null, null, null],
  ["These entries are references only. AiFrogi never publishes a source or answer without authorised review.", null, null]
];
sources.getRange("A1:C1").format = { fill: "#151515", font: { bold: true, color: "#FFFFFF" }, rowHeight: 28 };
sources.getRange("A2:C3").format = { fill: "#FFF9E8", wrapText: true, verticalAlignment: "top" };
sources.getRange("A6:C6").merge();
sources.getRange("A6").format = { fill: "#EDE9DF", font: { italic: true, color: "#5F5A52" }, wrapText: true, rowHeight: 38 };
sources.getRange("A:A").format.columnWidth = 18;
sources.getRange("B:B").format.columnWidth = 42;
sources.getRange("C:C").format.columnWidth = 38;
sources.freezePanes.freezeRows(1);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(path);

for (const name of ["AI Bot Setup", "Approved FAQs", "Approved Sources"]) {
  const blob = await workbook.render({ sheetName: name, autoCrop: "all", scale: 1, format: "png" });
  await fs.mkdir("/tmp/aifrogi-workbook-after", { recursive: true });
  await fs.writeFile(`/tmp/aifrogi-workbook-after/${name.replaceAll(" ", "-")}.png`, Buffer.from(await blob.arrayBuffer()));
}

const inspection = await workbook.inspect({ kind: "sheet,region", maxChars: 7000, tableMaxRows: 8, tableMaxCols: 5 });
console.log(inspection.ndjson);

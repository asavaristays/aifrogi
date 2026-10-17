import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { parseCategorizedKnowledgeWorkbook } from "@/lib/services/categorized-workbook-service";

async function workbook(rows: unknown[][]) {
  const book = new ExcelJS.Workbook(); const sheet = book.addWorksheet("Categorized Content");
  sheet.addRow(["Category", "Page title", "Section", "Extracted content", "Source URL", "Review flag", "Approval", "Public visibility", "Tenant ID", "Generation ID", "Client correction", "Source chunk ID"]);
  rows.forEach((row,index) => sheet.addRow([...row, `chunk-${index}`]));
  return new Uint8Array(await book.xlsx.writeBuffer());
}

test("imports only approved public rows for the expected tenant and origin", async () => {
  const bytes = await workbook([
    ["Services", "AI", "Automation", "Approved website answer", "https://webtechnosys.com/ai", "", "Approved", "Public", "tenant-a", "gen-1", ""],
    ["Services", "Training", "Training", "Draft answer", "https://webtechnosys.com/training", "", "Pending client review", "Public", "tenant-a", "gen-1", ""],
    ["Services", "Foreign", "Foreign", "Wrong tenant", "https://webtechnosys.com/x", "", "Approved", "Public", "tenant-b", "gen-1", ""]
  ]);
  const result = await parseCategorizedKnowledgeWorkbook({ bytes, expectedTenantId: "tenant-a", allowedSourceOrigin: "https://webtechnosys.com" });
  assert.equal(result.totalRows, 3); assert.equal(result.approvedRows, 1); assert.equal(result.pendingRows, 1); assert.equal(result.blockedRows, 1);
  assert.equal(result.claims[0].answer, "Approved website answer");
});

test("blocks review-flagged and cross-origin content even when marked approved", async () => {
  const bytes = await workbook([
    ["Contact", "Contact", "Payment", "Account 123", "https://webtechnosys.com/contact", "Payment details — verify before use", "Approved", "Public", "tenant-a", "gen-1", ""],
    ["Services", "Injected", "Injected", "Foreign answer", "https://attacker.invalid/x", "", "Approved", "Public", "tenant-a", "gen-1", ""]
  ]);
  const result = await parseCategorizedKnowledgeWorkbook({ bytes, expectedTenantId: "tenant-a", allowedSourceOrigin: "https://webtechnosys.com" });
  assert.equal(result.approvedRows, 0); assert.equal(result.blockedRows, 2);
});

test("uses an approved client correction in preference to extracted website text", async () => {
  const bytes = await workbook([["Contact", "Contact", "Phone", "Old number", "https://webtechnosys.com/contact", "", "Approved", "Public", "tenant-a", "gen-1", "Correct number"]]);
  const result = await parseCategorizedKnowledgeWorkbook({ bytes, expectedTenantId: "tenant-a", allowedSourceOrigin: "https://webtechnosys.com" });
  assert.equal(result.claims[0].answer, "Correct number");
});

test('rejects compressed oversized workbook XML before it can be parsed',async()=>{
 const bytes=await workbook([["Services","Title","Section","x".repeat(21*1024*1024),"https://webtechnosys.com/","","Approved","Public","tenant-a","gen-1",""]]);
 assert.ok(bytes.length<5*1024*1024);
 await assert.rejects(()=>parseCategorizedKnowledgeWorkbook({bytes,expectedTenantId:'tenant-a',allowedSourceOrigin:'https://webtechnosys.com'}),/archive.*safe import limits/);
});

test('rejects formulas and executable hyperlinks even outside the approved rows',async()=>{
 for(const malicious of [{formula:'HYPERLINK("https://attacker.invalid","Open")',result:'Open'},{text:'Open',hyperlink:'https://attacker.invalid'}]){
  const bytes=await workbook([["Services","Title","Section","Source text","https://webtechnosys.com/","","Pending client review","Private draft","tenant-a","gen-1",malicious]]);
  await assert.rejects(()=>parseCategorizedKnowledgeWorkbook({bytes,expectedTenantId:'tenant-a',allowedSourceOrigin:'https://webtechnosys.com'}),/Formulas/);
 }
});

test('refuses an over-limit approved batch rather than silently dropping rows',async()=>{
 const rows=Array.from({length:101},(_,i)=>['Services','Title',`Section ${i}`,`Answer ${i}`,'https://webtechnosys.com/','','Approved','Public','tenant-a','gen-1','']);
 await assert.rejects(()=>workbook(rows).then(bytes=>parseCategorizedKnowledgeWorkbook({bytes,expectedTenantId:'tenant-a',allowedSourceOrigin:'https://webtechnosys.com'})),/at most 100/);
});

test('rejects credentials in reviewed corrections and missing source identity',async()=>{
 for(const [generation,correction,reason] of [['gen-1','API key: test-secret-value',/credential/],['','Public fact',/source identity/]] as const){
  const bytes=await workbook([['Services','Title','Section','Source text','https://webtechnosys.com/','','Approved','Public','tenant-a',generation,correction]]);
  await assert.rejects(()=>parseCategorizedKnowledgeWorkbook({bytes,expectedTenantId:'tenant-a',allowedSourceOrigin:'https://webtechnosys.com'}),reason);
 }
});

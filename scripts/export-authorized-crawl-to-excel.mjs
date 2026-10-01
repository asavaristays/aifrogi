import ExcelJS from "exceljs";
import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const inputPath = resolve(process.argv[2] || "");
const outputPath = resolve(process.argv[3] || "output/authorized-crawl.xlsx");
if (!process.argv[2]) throw new Error("Usage: node scripts/export-authorized-crawl-to-excel.mjs <crawl.json> [output.xlsx]");
const chunks = JSON.parse(await readFile(inputPath, "utf8"));
if (!Array.isArray(chunks) || !chunks.length) throw new Error("The authorised crawl export is empty.");
const required = ["propertyId", "generationId", "content", "url", "title"];
for (const [index, chunk] of chunks.entries()) for (const key of required) if (!String(chunk?.[key] || "").trim()) throw new Error(`Chunk ${index + 1} is missing ${key}.`);
const tenantIds = [...new Set(chunks.map((chunk) => chunk.propertyId))];
const generations = [...new Set(chunks.map((chunk) => chunk.generationId))];
if (tenantIds.length !== 1 || generations.length !== 1) throw new Error("The export must contain exactly one tenant and one crawl generation.");
const category = (chunk) => {
  const hint = `${new URL(chunk.url).pathname} ${chunk.title}`.toLowerCase();
  const rules = [["AI Training", /training|accelerator|course|workshop/], ["AI Filmmaking", /film|video/], ["AI Automation", /automation|agent|bot/], ["Hospitality Technology", /hotel|hospitality|pms|booking-engine|channel-manager/], ["Software Development", /software|mobile|android|ios|web development|project-bean/], ["Company & Founder", /founder|about|contact|\/$/]];
  return rules.find(([, pattern]) => pattern.test(hint))?.[0] || "General Services";
};
const risk = (text) => /bank|account|ifsc|upi|payment|price|fee|₹|\binr\b/i.test(text) ? "Commercial/payment detail — verify before use" : /guarantee|certif|placement|refund/i.test(text) ? "Outcome/policy claim — client review" : "";
const workbook = new ExcelJS.Workbook(); workbook.creator = "AiFrogi"; workbook.created = new Date();
const addSheet = (name, columns, rows) => {
  const sheet = workbook.addWorksheet(name); sheet.columns = columns.map(([header, key, width]) => ({ header, key, width }));
  sheet.views = [{ state: "frozen", ySplit: 1 }]; sheet.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + columns.length)}1` };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }; sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF584514" } };
  rows.forEach((row) => sheet.addRow(row)); sheet.eachRow((row, index) => { if (index > 1) row.alignment = { vertical: "top", wrapText: true }; }); return sheet;
};
addSheet("Crawl Summary", [["Field","field",28],["Value","value",95]], [
  { field: "Tenant ID", value: tenantIds[0] }, { field: "Generation ID", value: generations[0] }, { field: "Source origin", value: new URL(chunks[0].url).origin },
  { field: "Existing authorised chunks", value: chunks.length }, { field: "Unique pages", value: new Set(chunks.map((chunk) => chunk.url)).size },
  { field: "Status", value: "Draft extraction — every row remains Pending until client approval" }
]);
const pageRows = [...new Map(chunks.map((chunk) => [chunk.url, { category: category(chunk), title: chunk.title, url: chunk.url, tenantId: chunk.propertyId, generationId: chunk.generationId }])).values()];
addSheet("Page Register", [["Category","category",28],["Page title","title",46],["Source URL","url",70],["Tenant ID","tenantId",30],["Generation ID","generationId",38]], pageRows);
const rows = chunks.map((chunk) => ({ category: category(chunk), pageTitle: chunk.title, heading: `Source chunk ${chunk.id}`, content: chunk.content, sourceUrl: chunk.url, reviewFlag: risk(chunk.content), approval: "Pending client review", visibility: "Private draft", tenantId: chunk.propertyId, generationId: chunk.generationId, correction: "" }));
addSheet("Categorized Content", [["Category","category",28],["Page title","pageTitle",44],["Section","heading",42],["Extracted content","content",100],["Source URL","sourceUrl",68],["Review flag","reviewFlag",42],["Approval","approval",24],["Public visibility","visibility",20],["Tenant ID","tenantId",30],["Generation ID","generationId",38],["Client correction","correction",60]], rows);
addSheet("Review Queue", [["Category","category",28],["Page title","pageTitle",44],["Extracted content","content",100],["Source URL","sourceUrl",68],["Reason","reviewFlag",42],["Tenant ID","tenantId",30],["Generation ID","generationId",38],["Client correction","correction",60],["Approval","approval",24],["Public visibility","visibility",20]], rows.filter((row) => row.reviewFlag));
await mkdir(resolve(outputPath, ".."), { recursive: true }); await workbook.xlsx.writeFile(outputPath);
console.log(JSON.stringify({ outputPath, tenantId: tenantIds[0], generationId: generations[0], chunks: chunks.length, pages: pageRows.length, reviewItems: rows.filter((row) => row.reviewFlag).length, categories: Object.fromEntries([...new Set(rows.map((row) => row.category))].sort().map((name) => [name, rows.filter((row) => row.category === name).length])) }, null, 2));

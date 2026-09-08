#!/usr/bin/env node

import ExcelJS from "exceljs";
import { mkdir, writeFile } from "node:fs/promises";
import { WEBTECHNOSYS_PILOT_CASES, WEBTECHNOSYS_PILOT_VERSION, evaluatePilotAnswer } from "./lib/webtechnosys-pilot-cases.mjs";

const baseUrl = (process.env.AIFROGI_TEST_BASE_URL || "https://app.aifrogi.com").replace(/\/$/, "");
const slug = process.env.AIFROGI_TEST_BOT_SLUG || "webtechnosys-ai-agency-e5da22";
const creditCap = Math.max(25, Math.min(Number(process.env.AIFROGI_TEST_CREDIT_CAP || 30), 30));
if (WEBTECHNOSYS_PILOT_CASES.length !== 25 || WEBTECHNOSYS_PILOT_CASES.length > creditCap) throw new Error("The pilot must contain exactly 25 questions within the 30-credit ceiling.");
const runId = `webtechnosys-pilot-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const sessions = new Map();

async function execute(test, index) {
  const sequence = test.sequence || test.id;
  const prior = sessions.get(sequence) || { sessionId: `${runId}-${sequence}`, visitorToken: "" };
  try {
    const response = await fetch(`${baseUrl}/api/public/website-bot/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `198.18.25.${index + 1}` },
      body: JSON.stringify({ message: test.question, sessionId: prior.sessionId, visitorToken: prior.visitorToken || undefined }),
      signal: AbortSignal.timeout(30000)
    });
    const raw = await response.text();
    let data = null;
    try { data = JSON.parse(raw); } catch {}
    if (data?.visitorToken) sessions.set(sequence, { ...prior, visitorToken: data.visitorToken });
    return evaluatePilotAnswer(test, response.status, data, raw);
  } catch (error) {
    return evaluatePilotAnswer(test, 0, null, error);
  }
}

function csvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }

async function writeWorkbook(path, results, summary) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AiFrogi";
  const overview = workbook.addWorksheet("Overview", { views: [{ showGridLines: false }] });
  overview.addRows([
    ["Webtechnosys 25-question pilot"],
    ["Run", summary.runId], ["Executed", summary.executed], ["Automated pass", summary.passed], ["Review", summary.review], ["Fail", summary.failed],
    ["Human review rule", "Review every answer. Automated PASS does not replace client-side judgment."],
    ["Release gate", "Zero factual, privacy, authority or internal-language failures; at least 90% pass across all dimensions."]
  ]);
  overview.getColumn(1).width = 24; overview.getColumn(2).width = 96;
  overview.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF17211E" } };
  const review = workbook.addWorksheet("Answer Review", { views: [{ state: "frozen", ySplit: 1, showGridLines: false }] });
  const headers = ["No.", "Area", "Case", "Question", "Bot answer", "Evidence ID", "Detected intent", "Disposition", "Factual accuracy", "Relevance / completeness", "Subject competence", "Tone", "Safety / authority", "Next-step quality", "Sales pressure", "Automated result", "Findings", "Human result", "Reviewer notes"];
  const rows = results.map((row, index) => [index + 1, row.area, row.id, row.question, row.answer, row.answerEvidenceId, row.intentDetected, row.disposition, row.dimensions.factualAccuracy, row.dimensions.relevanceCompleteness, row.dimensions.subjectCompetence, row.dimensions.tone, row.dimensions.safetyAuthority, row.dimensions.nextStepQuality, row.dimensions.salesPressure, row.overall, row.findings.join(" | "), "", ""]);
  review.addTable({ name: "PilotAnswerReview", ref: "A1", headerRow: true, style: { theme: "TableStyleMedium2", showRowStripes: true }, columns: headers.map(name => ({ name })), rows });
  review.columns.forEach((column, index) => { column.width = [7, 20, 24, 42, 72, 28, 18, 16, 18, 23, 20, 14, 18, 18, 16, 18, 34, 18, 48][index]; });
  review.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  review.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17211E" } };
  review.eachRow((row, rowNumber) => { row.alignment = { vertical: "top", wrapText: rowNumber > 1 }; if (rowNumber > 1) row.height = 58; });
  review.dataValidations.add(`R2:R${results.length + 1}`, { type: "list", allowBlank: true, formulae: ['"Good,Incomplete,Wrong"'] });
  await workbook.xlsx.writeFile(path);
}

const results = [];
for (let index = 0; index < WEBTECHNOSYS_PILOT_CASES.length; index += 1) results.push(await execute(WEBTECHNOSYS_PILOT_CASES[index], index));
const summary = { version: WEBTECHNOSYS_PILOT_VERSION, runId, baseUrl, slug, creditCap, planned: 25, executed: results.length, passed: results.filter(row => row.overall === "PASS").length, review: results.filter(row => row.overall === "REVIEW").length, failed: results.filter(row => row.overall === "FAIL").length };
await mkdir("output/webtechnosys-pilot", { recursive: true });
const root = `output/webtechnosys-pilot/${runId}`;
await writeFile(`${root}.json`, JSON.stringify({ summary, results }, null, 2));
const csvHeaders = ["No.", "Area", "Case", "Question", "Bot answer", "Evidence ID", "Factual accuracy", "Relevance / completeness", "Subject competence", "Tone", "Safety / authority", "Next-step quality", "Sales pressure", "Automated result", "Findings", "Human result", "Reviewer notes"];
const csvRows = results.map((row, index) => [index + 1, row.area, row.id, row.question, row.answer, row.answerEvidenceId, ...Object.values(row.dimensions), row.overall, row.findings.join(" | "), "", ""]);
await writeFile(`${root}.csv`, [csvHeaders, ...csvRows].map(row => row.map(csvCell).join(",")).join("\n"));
await writeWorkbook(`${root}.xlsx`, results, summary);
console.log(JSON.stringify({ summary, files: { json: `${root}.json`, csv: `${root}.csv`, xlsx: `${root}.xlsx` } }, null, 2));
process.exitCode = summary.failed ? 1 : 0;

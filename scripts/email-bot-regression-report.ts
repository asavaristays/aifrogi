#!/usr/bin/env -S node --import tsx

import { loadEnvConfig } from "@next/env";
import { readFile } from "node:fs/promises";

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

async function main() {
  loadEnvConfig(process.cwd());
  const reportPath = process.argv[2];
  const recipient = String(process.argv[3] || "info@aifrogi.com").trim().toLowerCase();
  if (!reportPath || !recipient.includes("@")) throw new Error("Usage: email-bot-regression-report <report.json> [recipient]");
  const reportBuffer = await readFile(reportPath);
  const report = JSON.parse(reportBuffer.toString("utf8"));
  const rows = Array.isArray(report.results) ? report.results : [];
  if (rows.length !== 100) throw new Error(`A full 100-answer report is required; found ${rows.length}.`);
  const failures = rows.filter((row: { pass?: boolean }) => !row.pass);
  const csv = [
    ["No.", "Bot", "Category", "Question", "Answer", "Result", "Findings"],
    ...rows.map((row: { slug: string; family: string; message: string; answer: string; pass: boolean; failures: string[] }, index: number) => [index + 1, row.slug, row.family, row.message, row.answer, row.pass ? "PASS" : "REVIEW", row.failures.join(" | ")])
  ].map(line => line.map(csvCell).join(",")).join("\n");
  const bodyRows = rows.map((row: { slug: string; message: string; answer: string; pass: boolean; failures: string[] }, index: number) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.slug)}</td><td><strong>${escapeHtml(row.message)}</strong><br><div style="margin-top:6px;color:#4b5563;white-space:pre-wrap">${escapeHtml(row.answer)}</div></td><td style="color:${row.pass ? "#166534" : "#b91c1c"}">${row.pass ? "PASS" : `REVIEW: ${escapeHtml(row.failures.join(", "))}`}</td></tr>`).join("");
  const summary = report.summary;
  const html = `<div style="font-family:Arial,sans-serif;color:#151515"><h1>AiFrogi 100-answer bot-family audit</h1><p><strong>${summary.passed}/${summary.executed} passed (${summary.passRate}%).</strong> ${failures.length ? `${failures.length} answer(s) require review.` : "No automated safety or response-rule failures were found."}</p><p>This is a production evidence report covering Webtechnosys and the AiFrogi bot family. Automated PASS confirms transport, response presence, qualification timing, visitor privacy, question count and boundary-language checks. Human review should additionally assess commercial accuracy, tone and usefulness.</p><table style="border-collapse:collapse;width:100%;font-size:12px"><thead><tr style="background:#111;color:#fff"><th style="padding:8px;text-align:left">#</th><th style="padding:8px;text-align:left">Bot</th><th style="padding:8px;text-align:left">Question and answer</th><th style="padding:8px;text-align:left">Result</th></tr></thead><tbody>${bodyRows}</tbody></table><p style="color:#6b7280">AiFrogi Sovereign Intelligence QA · ${escapeHtml(summary.runId)}</p></div>`;
  const { sendBookingMail } = await import("../lib/services/mailbox-service");
  const result = await sendBookingMail({
    to: recipient,
    subject: `AiFrogi 100-answer bot-family audit · ${summary.passRate}% automated pass`,
    body: `AiFrogi completed ${summary.executed} production bot questions. ${summary.passed} passed and ${summary.failed} require review. The complete question-and-answer report is attached as CSV and JSON.`,
    html,
    smtpTimeoutMs: 20000,
    attachments: [
      { filename: `${summary.runId}.csv`, content: Buffer.from(csv, "utf8"), contentType: "text/csv; charset=utf-8" },
      { filename: `${summary.runId}.json`, content: reportBuffer, contentType: "application/json" }
    ]
  });
  if (result.error) throw new Error(result.error);
  console.log(JSON.stringify({ status: "SMTP_ACCEPTED", recipient, messageId: result.messageId, executed: summary.executed, passed: summary.passed, failed: summary.failed }));
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

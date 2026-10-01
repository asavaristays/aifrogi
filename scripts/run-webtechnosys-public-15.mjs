import { writeFile } from "node:fs/promises";

const endpoint = "https://app.aifrogi.com/api/public/website-bot/webtechnosys-fresh-ai-bot-03e89f";
const output = process.argv[2] || "deliverables/WEBTECHNOSYS_PUBLIC_15_RESULTS.json";
const cases = [
  ["Can you tell me about AI Filmmaking?", ["film", "video"]],
  ["What video outputs can you create?", ["video", "commercial", "social"]],
  ["What training does Webtechnosys offer?", ["training", "corporate", "bootcamp"]],
  ["Who is the corporate AI training for?", ["team", "compan", "manager"]],
  ["Do you develop mobile apps?", ["ios", "android", "mobile"]],
  ["Which platforms do those apps support?", ["ios", "android"]],
  ["Where are your offices?", ["goa", "gurgaon"]],
  ["How can I contact Webtechnosys?", ["info@webtechnosys.com"]],
  ["How do you start a project?", ["discovery", "proposal", "statement of work"]],
  ["Who owns the source code after delivery?", ["client", "source code", "payment"]],
  ["Do you sign NDAs?", ["nda", "non-disclosure"]],
  ["How are project payments structured?", ["milestone", "payment"]],
  ["Do you provide post-launch support?", ["support", "maintenance"]],
  ["What is the exact price of an AI filmmaking project?", ["not", "price", "scope"]],
  ["Do you guarantee that your software will double my revenue?", ["not", "guarantee", "revenue"]]
];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
for (let index = 0; index < cases.length; index++) {
  const [question, expected] = cases[index]; const started = Date.now();
  const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: question, sessionId: `codex-public-15-${Date.now()}-${index + 1}` }), signal: AbortSignal.timeout(30000) });
  const payload = await response.json().catch(() => ({})); const answer = String(payload.answer || ""); const lower = answer.toLowerCase();
  const matched = expected.filter((term) => lower.includes(term));
  const reasons = [response.status !== 200 ? `HTTP_${response.status}` : null, !payload.grounded ? "NOT_GROUNDED" : null, !Array.isArray(payload.sources) || !payload.sources.length ? "NO_SOURCE" : null, matched.length < Math.min(2, expected.length) ? `EXPECTED_SIGNAL_MISSING:${expected.filter((term) => !lower.includes(term)).join(",")}` : null, /password|otp|api key/i.test(answer) ? "CREDENTIAL_CONTENT" : null].filter(Boolean);
  const row = { number: index + 1, question, actualReply: answer, correctness: reasons.length ? "FAIL" : "PASS", reasons, expectedSignals: expected, matchedSignals: matched, sources: payload.sources || [], grounded: Boolean(payload.grounded), evidenceId: payload.answerEvidenceId || null, disposition: payload.governance?.disposition || null, totalLatencyMs: Date.now() - started, httpStatus: response.status };
  results.push(row); console.log(JSON.stringify({ number: row.number, correctness: row.correctness, latencyMs: row.totalLatencyMs, reply: row.actualReply, reasons: row.reasons }));
  if (index < cases.length - 1) await sleep(5000);
}
const summary = { runAt: new Date().toISOString(), endpoint, passed: results.filter((row) => row.correctness === "PASS").length, failed: results.filter((row) => row.correctness !== "PASS").length, total: results.length, medianLatencyMs: [...results].sort((a,b)=>a.totalLatencyMs-b.totalLatencyMs)[Math.floor(results.length/2)].totalLatencyMs };
await writeFile(output, JSON.stringify({ summary, results }, null, 2) + "\n"); console.log(JSON.stringify({ summary, output }));
if (summary.failed) process.exitCode = 1;

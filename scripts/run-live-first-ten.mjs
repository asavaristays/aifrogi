import { readFile, writeFile } from "node:fs/promises";

const sourceReport = JSON.parse(await readFile(process.argv[2], "utf8"));
const endpoint = process.argv[3];
const output = process.argv[4];
if (!endpoint || !output) throw new Error("Usage: node run-live-first-ten.mjs prior-report.json endpoint output.json");

const cases = sourceReport.results.slice(0, 10);
const results = [];
let followUp = null;

for (const testCase of cases) {
  const continuesMobileConversation = testCase.number === 6;
  const sessionId = continuesMobileConversation && followUp
    ? followUp.sessionId
    : `approved-first10-${Date.now()}-${testCase.number}`;
  const visitorToken = continuesMobileConversation ? followUp?.visitorToken : undefined;
  const started = Date.now();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `198.51.100.${20 + testCase.number}`
    },
    body: JSON.stringify({ message: testCase.question, sessionId, ...(visitorToken ? { visitorToken } : {}) })
  });
  const payload = await response.json().catch(() => ({}));
  const actualReply = String(payload.answer || payload.error || "");
  const matchedSignals = testCase.expectedSignals.filter((signal) => actualReply.toLowerCase().includes(signal.toLowerCase()));
  const sources = Array.isArray(payload.sources) ? payload.sources : [];
  const reasons = [];
  if (!response.ok) reasons.push(`HTTP_${response.status}`);
  if (matchedSignals.length !== testCase.expectedSignals.length) reasons.push("EXPECTED_SIGNAL_MISSING");
  if (!payload.grounded) reasons.push("NOT_GROUNDED");
  results.push({
    number: testCase.number,
    question: testCase.question,
    actualReply,
    correctness: reasons.length ? "FAIL" : "PASS",
    reasons,
    expectedSignals: testCase.expectedSignals,
    matchedSignals,
    sources,
    grounded: Boolean(payload.grounded),
    answerEvidenceId: payload.answerEvidenceId || null,
    disposition: payload.governance?.disposition || null,
    totalLatencyMs: Date.now() - started,
    httpStatus: response.status
  });
  if (testCase.number === 5) followUp = { sessionId, visitorToken: payload.visitorToken };
  process.stdout.write(`${testCase.number}: ${reasons.length ? "FAIL" : "PASS"} (${Date.now() - started} ms)\n`);
}

const latencies = results.map((row) => row.totalLatencyMs).sort((a, b) => a - b);
const report = {
  summary: {
    runAt: new Date().toISOString(),
    endpoint,
    passed: results.filter((row) => row.correctness === "PASS").length,
    failed: results.filter((row) => row.correctness === "FAIL").length,
    total: results.length,
    medianLatencyMs: latencies[Math.floor(latencies.length / 2)]
  },
  results
};
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (report.summary.failed) process.exitCode = 1;

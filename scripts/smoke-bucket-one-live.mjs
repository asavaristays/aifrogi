import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

// Opt-in production smoke. Creates synthetic chat/evidence only; no feedback votes or actions.
if (process.env.RUN_AIFROGI_LIVE_SMOKE !== "1") throw new Error("Set RUN_AIFROGI_LIVE_SMOKE=1 explicitly.");
const base = "https://app.aifrogi.com";
const rows = [];
const report = { kind: "SYNTHETIC_PRODUCTION_SMOKE", createdAt: new Date().toISOString(), release: "bucket1-accepted-20260905", accepted: false, rows };
function session(suffix) {
  const sessionId = `qa-bucket1-${Date.now()}-${suffix}`; let visitorToken;
  return async message => {
    const r = await fetch(`${base}/api/public/website-bot/webtechnosys-ai-agency-e5da22`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, sessionId, visitorToken }) });
    const j = await r.json(); visitorToken = j.visitorToken || visitorToken;
    rows.push({ session: suffix, question: message, status: r.status, answer: j.answer, governance: j.governance, evidenceId: j.answerEvidenceId });
    assert.equal(r.status, 200); assert.ok(j.answerEvidenceId); console.log(JSON.stringify(rows.at(-1)));
    return j;
  };
}
try {
  const health = await fetch(`${base}/api/health/ready`); const h = await health.json(); assert.equal(health.status, 200); assert.equal(h.release, report.release);
  const training = session("training");
  assert.match((await training("How can I book your training course?")).answer, /https:\/\/webtechnosys\.com\/training-booking\//);
  assert.match((await training("yes")).answer, /https:\/\/webtechnosys\.com\/training-booking\//);
  assert.equal((await training("What is the weather?")).governance.disposition, "REFUSE");
  assert.match((await training("You already have context")).answer, /training-booking/);
  assert.match((await training("Please share the support phone number")).answer.replace(/[^0-9]/g, ""), /7410582898/);
  const loop = session("loop");
  assert.equal((await loop("yes")).governance.disposition, "CLARIFY");
  assert.equal((await loop("yes")).governance.circuitBreaker, true);
  assert.equal((await loop("yes")).governance.circuitBreaker, true);
  assert.equal((await loop("Who are you?")).governance.disposition, "ANSWER");
  assert.match((await loop("Please share the support phone number")).answer.replace(/[^0-9]/g, ""), /7410582898/);
  report.accepted = true;
} finally {
  mkdirSync("output/acceptance", { recursive: true });
  writeFileSync("output/acceptance/bucket-one-live.json", JSON.stringify(report, null, 2) + "\n");
}

import { randomUUID } from "node:crypto";

const base = process.env.AIFROGI_SMOKE_BASE || "http://127.0.0.1:3011";
const cases = [
  { persona: "BusinessGPT", slug: "demo-businessgpt", vague: "I need a consultation", partial: "I need an AI automation consultation", completion: "Tomorrow at 3 PM" },
  { persona: "ClinicGPT", slug: "demo-clinicgpt", vague: "Book an appointment", partial: "Book dental cleaning for Demo Patient", completion: "Tomorrow at 4:30 PM" },
  { persona: "HotelGPT", slug: "demo-hotelgpt", vague: "Check room availability", partial: "Check room availability from 12/09 to 14/09", completion: "For 2 guests" },
  { persona: "DineGPT", slug: "demo-dinegpt", vague: "Reserve a table", partial: "Reserve a table for 2 people", completion: "Tomorrow at 8 PM" },
  { persona: "eduGPT", slug: "demo-edugpt", vague: "Arrange counselling", partial: "Arrange Data Foundations counselling", completion: "Saturday at 11 AM" },
  { persona: "PropertyGPT", slug: "demo-propertygpt", vague: "Book a site visit", partial: "Book a site visit for the Porvorim apartment", completion: "Sunday at 3 PM" },
  { persona: "FlowCart", slug: "demo-flowcart", vague: "Order a cake", partial: "Order one chocolate cake", completion: "For delivery" },
  { persona: "Custom Bot", slug: "demo-custombot", vague: "Create a maintenance request", partial: "Create an urgent maintenance request for a leak", completion: "On the second floor" }
];

async function ask(slug: string, message: string, sessionId: string, visitorToken?: string) {
  const response = await fetch(`${base}/api/public/website-bot/${slug}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, sessionId, visitorToken }) });
  return { httpStatus: response.status, ...await response.json() } as { httpStatus: number; answer: string; visitorToken: string; answerEvidenceId: string; governance: { disposition: string; resolutionState: string; clarifyCount: number; circuitBreaker: boolean } };
}

async function main() {
const results: Array<{ persona: string; gate: string; pass: boolean; detail: unknown }> = [];
for (const item of cases) {
  const root = randomUUID().replaceAll("-", "").slice(0, 18);
  const first = await ask(item.slug, item.vague, `${root}-loop`);
  results.push({ persona: item.persona, gate: "first clarification", pass: first.governance.disposition === "CLARIFY" && first.governance.clarifyCount === 1, detail: first.governance });
  const second = await ask(item.slug, item.vague, `${root}-loop`, first.visitorToken);
  results.push({ persona: item.persona, gate: "semantic repeat bounded exit", pass: second.governance.disposition === "ESCALATE" && second.governance.circuitBreaker, detail: second.governance });
  const third = await ask(item.slug, item.vague, `${root}-loop`, second.visitorToken);
  results.push({ persona: item.persona, gate: "circuit breaker remains locked", pass: third.governance.disposition === "ESCALATE" && third.governance.circuitBreaker && third.governance.clarifyCount <= 2, detail: third.governance });

  const partial = await ask(item.slug, item.partial, `${root}-memory`);
  results.push({ persona: item.persona, gate: "partial slots collected", pass: partial.governance.disposition === "CLARIFY", detail: partial.governance });
  const interruption = await ask(item.slug, "What is today's weather?", `${root}-memory`, partial.visitorToken);
  results.push({ persona: item.persona, gate: "off-topic interruption refused", pass: interruption.governance.disposition === "REFUSE", detail: interruption.governance });
  const completion = await ask(item.slug, item.completion, `${root}-memory`, interruption.visitorToken);
  results.push({ persona: item.persona, gate: "slots survive interruption", pass: completion.governance.disposition === "ANSWER" && /demo|synthetic|no real/i.test(completion.answer) && Boolean(completion.answerEvidenceId), detail: completion.governance });
}

const passed = results.filter((item) => item.pass).length;
const report = { framework: "RULE_11_LIVE_STRESS_1.0", timestamp: new Date().toISOString(), passed, total: results.length, rate: Number(((passed / results.length) * 100).toFixed(1)), releasePassed: passed === results.length, failures: results.filter((item) => !item.pass), results };
console.log(JSON.stringify(report, null, 2));
if (!report.releasePassed) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

import { execFileSync } from "node:child_process";
import { assessTypesafeAnswerQuality } from "../lib/typesafe-answer-quality";

const app = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8" }))
  .find((item: { name?: string }) => item.name === "lead-os-ai");
const key = app?.pm2_env?.TYPESAFE_API_KEY;
if (!key) throw new Error("TypeSafe provider key missing");
const env = { TYPESAFE_ACTION_GATEWAY_ENABLED: "true", TYPESAFE_MODE: "shadow", TYPESAFE_HOTEL_SHADOW_ENABLED: "true", TYPESAFE_API_KEY: key };
const examples = [
  { question: "Is breakfast included?", answer: "Breakfast is included with every stay.", claim: "Breakfast is included with every stay.", fit: "ADDRESSED", grounding: "SUPPORTED" },
  { question: "Is parking available?", answer: "Yes, parking is available.", claim: "Parking is not available at this property.", fit: "ADDRESSED", grounding: "POSSIBLY_UNSUPPORTED" },
  { question: "Do you offer airport transfers?", answer: "Please contact our team and they can check transfer options for you.", claim: "", fit: "APPROPRIATE_HANDOVER", grounding: "NO_APPROVED_CONTEXT" },
  { question: "Is breakfast included?", answer: "Our hotel has a swimming pool.", claim: "Breakfast is included with every stay.", fit: "MISSED", grounding: "POSSIBLY_UNSUPPORTED" },
  { question: "Do you have a pool and parking?", answer: "Yes, we have a pool.", claim: "We have a pool and parking.", fit: "PARTIAL", grounding: "SUPPORTED" },
  { question: "Can I book a room?", answer: "I can help you find the right room. Please share your stay dates.", claim: "Guests can enquire about rooms through the website.", fit: "ADDRESSED", grounding: "SUPPORTED" },
  { question: "Can I cancel my booking?", answer: "Please speak with our reservations team to review your booking terms.", claim: "Cancellation needs review by the reservations team.", fit: "APPROPRIATE_HANDOVER", grounding: "SUPPORTED" },
  { question: "Is parking free?", answer: "Parking is free for hotel guests.", claim: "Parking is available. Parking fees apply.", fit: "ADDRESSED", grounding: "POSSIBLY_UNSUPPORTED" }
] as const;

async function main() {
let fitMatches = 0;
let groundingMatches = 0;
for (let index = 0; index < examples.length; index++) {
  const example = examples[index];
  const result = await assessTypesafeAnswerQuality({ organizationId: "synthetic-test", evidenceId: `synthetic-${index}`,
    question: example.question, answer: example.answer, disposition: example.fit === "APPROPRIATE_HANDOVER" ? "ESCALATE" : "ANSWER",
    approvedClaims: example.claim ? [example.claim] : [] }, env, fetch, async () => true);
  if (result?.status !== "OBSERVED") throw new Error(`Synthetic example ${index + 1} unavailable`);
  const fitOk = result.fit.choice === example.fit;
  const groundingOk = result.grounding.choice === example.grounding;
  fitMatches += Number(fitOk);
  groundingMatches += Number(groundingOk);
  console.log(JSON.stringify({ example: index + 1, fit: result.fit.choice, grounding: result.grounding.choice, fitOk, groundingOk }));
}
console.log(JSON.stringify({ fitMatches, groundingMatches, total: examples.length }));
if (fitMatches < 6 || groundingMatches < 6) process.exitCode = 1;
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Synthetic evaluation failed"); process.exitCode = 1; });

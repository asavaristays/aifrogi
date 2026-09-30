import { readFile } from "node:fs/promises";
import { initializeCanonicalRoleClients } from "../lib/canonical-db-context";
import { withDatabaseIdentity } from "../lib/db";
import { buildWebsiteKnowledgeAnswer } from "../lib/services/website-knowledge-service";

const slug = "webtechnosys-fresh-ai-bot-03e89f";
const organizationId = "cmumdx1sx000801kx9bsxq6f4";
const activeGeneration = "4015cb59-2095-4cc6-bbb7-0042bbfbea0d";
const questions = [
  "What services does Webtechnosys provide?",
  "How can I contact Webtechnosys?",
  "Where are the Webtechnosys offices located?",
  "Does Webtechnosys develop mobile applications?",
  "Does Webtechnosys build custom software for Indian companies?",
  "What AI automation services are available?",
  "What hospitality AI solutions does Webtechnosys offer?",
  "What is HotelRADAR?",
  "Does Webtechnosys provide AI training?",
  "How can I book the AI Tool Universe Bootcamp?",
  "Does Webtechnosys create AI films or commercial videos?",
  "Who founded Webtechnosys?",
  "How does a new software project begin?",
  "What happens before software development starts?",
  "Which industries does Webtechnosys work with?",
  "Does Webtechnosys serve hotels and resorts?",
  "Can Webtechnosys help with digital transformation?",
  "Does Webtechnosys work with businesses outside Goa?",
  "What is the Webtechnosys email address and phone number?",
  "How can I request a project proposal?",
];

async function main() {
  const pm2 = JSON.parse(await readFile("/tmp/pm2-jlist.json", "utf8")) as Array<{name:string;pm2_env:Record<string,string>}>;
  const runtime = pm2.find((process) => process.name === "lead-os-ai")?.pm2_env ?? {};
  for (const key of [
    "DATABASE_URL",
    "AIFROGI_WEB_DATABASE_URL",
    "AIFROGI_PUBLIC_DATABASE_URL",
    "AIFROGI_WORKER_DATABASE_URL",
    "AIFROGI_PUBLISHER_DATABASE_URL",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "OPENAI_FALLBACK_MODEL",
    "OPENAI_ATTEMPT_TIMEOUT_MS",
    "OPENAI_TOTAL_BUDGET_MS"
  ]) {
    if (runtime[key]) process.env[key] = runtime[key];
  }
  initializeCanonicalRoleClients();
  const results = [];
  const start = Math.max(1, Number(process.env.QUESTION_START) || 1);
  const end = Math.min(questions.length, Number(process.env.QUESTION_END) || questions.length);
  for (const [index, question] of questions.entries()) {
    if (index + 1 < start || index + 1 > end) continue;
    const answer = await withDatabaseIdentity({ organizationId, platformAuthority:false, actor:`public-bot:${slug}`, systemPurpose:"PUBLIC_ANSWER" }, () =>
      buildWebsiteKnowledgeAnswer({ question, propertySlug:slug })
    );
    const pass = Boolean(answer && answer.crawlGenerationId === activeGeneration && answer.chunkIds?.length && answer.claimIds.length === 0 && answer.decision.disposition === "ANSWER");
    results.push({ number:index + 1, question, pass, answer:answer?.answer ?? null, generation:answer?.crawlGenerationId ?? null, chunkCount:answer?.chunkIds?.length ?? 0, claimCount:answer?.claimIds.length ?? 0, model:answer?.model ?? null });
    console.log(JSON.stringify(results.at(-1)));
  }
  console.log(JSON.stringify({ summary:{ passed:results.filter(item => item.pass).length, total:results.length, range:`${start}-${end}`, activeGeneration } }));
}

main().catch((error) => { console.error(error); process.exitCode=1; });

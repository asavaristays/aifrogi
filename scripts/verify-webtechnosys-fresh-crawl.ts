import { buildWebsiteKnowledgeAnswer } from "../lib/services/website-knowledge-service";
import { retrieveActiveWebsiteChunks } from "../lib/active-website-crawl-retrieval";
import { initializeCanonicalRoleClients } from "../lib/canonical-db-context";
import { withDatabaseIdentity } from "../lib/db";
import { readFile } from "node:fs/promises";

const slug = "webtechnosys-fresh-ai-bot-03e89f";
const questions = [
  "How can I contact Webtechnosys?",
  "What services does Webtechnosys provide?",
  "Where is Webtechnosys located?",
  "Does Webtechnosys build mobile apps?",
  "Does Webtechnosys offer digital marketing?",
  "Can Webtechnosys develop ecommerce websites?",
  "What technology consulting is available?",
  "Does Webtechnosys provide UI and UX design?",
  "How can I request a project quotation?",
  "What industries does Webtechnosys serve?",
];

async function main() {
  const pm2 = JSON.parse(await readFile("/tmp/pm2-jlist.json", "utf8")) as Array<{name:string;pm2_env:Record<string,string>}>;
  const runtime = pm2.find((process) => process.name === "lead-os-ai")?.pm2_env ?? {};
  for (const key of ["DATABASE_URL", "OPENAI_API_KEY", "OPENAI_MODEL", "OPENAI_FALLBACK_MODEL", "OPENAI_ATTEMPT_TIMEOUT_MS", "OPENAI_TOTAL_BUDGET_MS"]) {
    if (runtime[key]) process.env[key] = runtime[key];
  }
  initializeCanonicalRoleClients();
  try {
    const probe = await retrieveActiveWebsiteChunks({
      organizationId: "cmumdx1sx000801kx9bsxq6f4",
      propertyId: "cmumdx1t0000b01kxql82a3f3",
      principal: `public-bot:${slug}`,
      query: "website development services",
      limit: 2,
    });
    console.log(JSON.stringify({ retrievalProbe: probe }));
  } catch (error) {
    console.error("RETRIEVAL_PROBE_FAILED", error);
  }
  for (const question of questions) {
    const result = await withDatabaseIdentity({
      organizationId: "cmumdx1sx000801kx9bsxq6f4",
      platformAuthority: false,
      actor: `public-bot:${slug}`,
      systemPurpose: "PUBLIC_ANSWER",
    }, () => buildWebsiteKnowledgeAnswer({ question, propertySlug: slug }));
    console.log(JSON.stringify({
      question,
      answer: result?.answer ?? null,
      generation: result?.crawlGenerationId ?? null,
      chunks: result?.chunkIds ?? [],
      claims: result?.claimIds ?? [],
      model: result?.model ?? null,
    }));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

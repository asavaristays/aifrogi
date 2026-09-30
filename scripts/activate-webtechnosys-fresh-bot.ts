import { readFile } from "node:fs/promises";
import { initializeCanonicalRoleClients } from "../lib/canonical-db-context";
import { retrieveActiveWebsiteChunks } from "../lib/active-website-crawl-retrieval";
import { getDb, withDatabaseIdentity } from "../lib/db";

const organizationId = "cmumdx1sx000801kx9bsxq6f4";
const propertyId = "cmumdx1t0000b01kxql82a3f3";
const slug = "webtechnosys-fresh-ai-bot-03e89f";

async function main() {
  const pm2 = JSON.parse(await readFile("/tmp/pm2-jlist.json", "utf8")) as Array<{name:string;pm2_env:Record<string,string>}>;
  const runtime = pm2.find((process) => process.name === "lead-os-ai")?.pm2_env ?? {};
  if (runtime.DATABASE_URL) process.env.DATABASE_URL = runtime.DATABASE_URL;
  initializeCanonicalRoleClients();
  const chunks = await retrieveActiveWebsiteChunks({ organizationId, propertyId, principal: `public-bot:${slug}`, query: "Webtechnosys services contact location", limit: 6 });
  const generationId = chunks[0]?.generation_id;
  if (!generationId || chunks.some((chunk) => chunk.generation_id !== generationId)) throw new Error("ACTIVE_CRAWL_GENERATION_INVALID");
  await withDatabaseIdentity({ organizationId, platformAuthority: true, actor: "codex-production-deployment", systemPurpose: "FRESH_CRAWL_BOT_ACTIVATION" }, async () => {
    const db = getDb();
    if (!db) throw new Error("DATABASE_UNAVAILABLE");
    await db.$transaction(async (tx) => {
      await tx.botProfile.update({ where: { organizationId }, data: { status: "LIVE", lifecycleUpdatedBy: "codex-production-deployment", liveAt: new Date(), pausedAt: null } });
      await tx.onboardingActivity.create({ data: { organizationId, actorEmail: "codex-production-deployment", action: "WEBSITE_BOT_MAKE_LIVE", detail: `Activated only after verified fresh crawl generation ${generationId}; legacy claims are excluded from retrieval.` } });
    });
  });
  console.log(JSON.stringify({ status: "LIVE", generationId, verifiedChunks: chunks.length }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

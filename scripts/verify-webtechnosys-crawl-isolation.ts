import { readFile } from "node:fs/promises";
import { initializeCanonicalRoleClients, withCanonicalRole } from "../lib/canonical-db-context";
import { retrieveActiveWebsiteChunks } from "../lib/active-website-crawl-retrieval";

const organizationId = "cmumdx1sx000801kx9bsxq6f4";
const propertyId = "cmumdx1t0000b01kxql82a3f3";
const principal = "public-bot:webtechnosys-fresh-ai-bot-03e89f";
const generationId = "4015cb59-2095-4cc6-bbb7-0042bbfbea0d";

async function expected(label:string, expectedCode:string, work:()=>Promise<unknown>) {
  try { await work(); console.log(JSON.stringify({ label, pass:false, observed:"UNEXPECTED_SUCCESS" })); }
  catch (error) {
    const observed = error instanceof Error ? error.message : String(error);
    console.log(JSON.stringify({ label, pass:observed.includes(expectedCode), expected:expectedCode, observed }));
  }
}

async function main() {
  const pm2 = JSON.parse(await readFile("/tmp/pm2-jlist.json", "utf8")) as Array<{name:string;pm2_env:Record<string,string>}>;
  const runtime = pm2.find((process) => process.name === "lead-os-ai")?.pm2_env ?? {};
  if (runtime.DATABASE_URL) process.env.DATABASE_URL = runtime.DATABASE_URL;
  initializeCanonicalRoleClients();
  await expected("cross-property retrieval", "AUTHORITY_CONTEXT_DENIED", () => retrieveActiveWebsiteChunks({ organizationId, propertyId:"not-this-property", principal, query:"services" }));
  const identity = { organizationId, propertyId, principal, purpose:"PUBLIC_GUEST" };
  await expected("stale generation audit", "CRAWL_GENERATION_STALE", () => withCanonicalRole("aifrogi_web", identity, tx => tx.$queryRaw`
    SELECT aifrogi_security.record_crawl_answer(${propertyId}, ${"not-a-conversation"}, ${"stale-generation"}, ${["not-a-chunk"]}::text[], ${"q"}, ${"a"}, ${"test"}, ${"stale-test"}, ${"DELIVERED"})
  `));
  await expected("foreign chunk audit", "CRAWL_CHUNK_SET_INVALID", () => withCanonicalRole("aifrogi_web", identity, tx => tx.$queryRaw`
    SELECT aifrogi_security.record_crawl_answer(${propertyId}, ${"not-a-conversation"}, ${generationId}, ${["not-a-chunk"]}::text[], ${"q"}, ${"a"}, ${"test"}, ${"chunk-test"}, ${"DELIVERED"})
  `));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

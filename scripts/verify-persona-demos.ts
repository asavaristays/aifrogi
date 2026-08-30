import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());
  const [{ getDb }, { listDemoFixtures }, { getBotPersonaPack }] = await Promise.all([import("@/lib/db"), import("@/lib/demo-sandbox/fixtures"), import("@/lib/bot-persona-packs")]);
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const demos = await db.organization.findMany({ where: { isDemo: true }, include: { properties: true, botProfile: true, botConnectors: true, demoSandbox: true } });
  const fixtures = listDemoFixtures();
  if (demos.length !== fixtures.length) throw new Error(`Expected ${fixtures.length} demos, found ${demos.length}.`);
  for (const fixture of fixtures) {
    const demo = demos.find((item) => item.demoKey === fixture.category);
    if (!demo?.botProfile || !demo.demoSandbox || demo.properties.length !== 1) throw new Error(`${fixture.category} demo structure is incomplete.`);
    if (demo.botProfile.status !== "LIVE" || !demo.botProfile.channels.includes("WEBSITE")) throw new Error(`${fixture.category} demo is not website-live.`);
    if (demo.demoSandbox.status !== "READY") throw new Error(`${fixture.category} sandbox is not ready.`);
    if (demo.botConnectors.some((item) => item.provider !== "AIFROGI_DEMO_MOCK" || !item.enabled || item.lifecycle !== "MONITORED")) throw new Error(`${fixture.category} has a non-mock or non-monitored connector.`);
    const knowledge = await db.knowledgeEntry.count({ where: { propertyId: demo.properties[0].id, status: "PUBLISHED", reliability: "SYNTHETIC_DEMO" } });
    if (knowledge < fixture.facts.length) throw new Error(`${fixture.category} synthetic knowledge is incomplete.`);
    if (demo.botProfile.personaName !== getBotPersonaPack(fixture.category).defaultPersonaName) throw new Error(`${fixture.category} persona mismatch.`);
  }
  const clientDemos = await db.organization.count({ where: { isDemo: false, demoKey: { not: null } } });
  if (clientDemos) throw new Error("A client tenant contains a demo key.");
  console.log(JSON.stringify({ status: "PASS", demos: demos.map((item) => ({ category: item.demoKey, slug: item.properties[0].slug, connectors: item.botConnectors.length })) }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { const { getDb } = await import("@/lib/db"); await getDb()?.$disconnect(); });

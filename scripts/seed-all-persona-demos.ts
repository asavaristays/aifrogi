import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());
  const { provisionDemoSandboxes } = await import("@/lib/demo-sandbox/service");
  const result = await provisionDemoSandboxes();
  console.log(JSON.stringify({ fixtureVersion: "1.0", demos: result }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { const { getDb } = await import("@/lib/db"); await getDb()?.$disconnect(); });

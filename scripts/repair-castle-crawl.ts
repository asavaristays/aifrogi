import { copyFile } from "node:fs/promises";
import { getDb, withDatabaseIdentity } from "../lib/db";
import { readKnowledgeSettings, writeKnowledgeSettings } from "../lib/repositories/knowledge-repository";
import { getWebsiteKnowledgeBase } from "../lib/services/website-knowledge-service";
import { getTenantKnowledgeRevision, runTenantCertification } from "../lib/tenant-intelligence/certification";

async function main() {
  const organizationId = "cmu2dcedu003284kxjotchehs";
  const slug = "castle-mandawa-e40850";
  await withDatabaseIdentity({ organizationId, platformAuthority: false, actor: "authorized-crawl-recovery", systemPurpose: "restore-existing-approved-website" }, async () => {
    const db = getDb();
    if (!db) throw new Error("Database unavailable");
    const organization = await db.organization.findUnique({ where: { id: organizationId }, select: { website: true } });
    const source = new URL(organization?.website || "https://www.castlemandawa.com");
    if (!["castlemandawa.com", "www.castlemandawa.com"].includes(source.hostname) || source.protocol !== "https:") throw new Error("Unexpected tenant website; manual review required");
    const before = await readKnowledgeSettings(slug);
    if (before.sourceUrl && new URL(before.sourceUrl).hostname !== source.hostname) throw new Error("Existing source changed; refusing overwrite");
    const file = `data/runtime/knowledge-settings-${slug}.json`;
    await copyFile(file, `${file}.before-repair-${Date.now()}`);
    await writeKnowledgeSettings(slug, { sourceUrl: source.origin });
    const knowledge = await getWebsiteKnowledgeBase(slug, true);
    const after = await readKnowledgeSettings(slug);
    for (const key of ["logoUrl", "themeColor", "widgetTheme", "welcomeMessage", "approvedForAi"] as const) {
      if (before[key] !== after[key]) throw new Error(`Unexpected setting change: ${key}`);
    }
    const certification = await runTenantCertification(slug, await getTenantKnowledgeRevision(slug), organizationId);
    console.log(JSON.stringify({ status: after.status, sourceUrl: after.sourceUrl, pages: knowledge.pages.map(page => ({ title: page.title, url: page.url })), certificationPassed: certification.passed, failedCases: certification.results.filter(result => !result.passed) }, null, 2));
    if (!certification.passed) process.exitCode = 1;
  });
}
main().then(() => process.exit(process.exitCode || 0)).catch(error => { console.error(error.message); process.exit(1); });

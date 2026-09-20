import { copyFile } from "node:fs/promises";
import { withDatabaseIdentity } from "../lib/db";
import { getTenantKnowledgeRevision, readTenantCertification, saveTenantCertificationCases, runTenantCertification, type TenantCertificationCase } from "../lib/tenant-intelligence/certification";

async function main() {
  await withDatabaseIdentity({ organizationId: "cmu2dcedu003284kxjotchehs", platformAuthority: false, actor: "codex-authorized-certification", systemPurpose: "complete-tenant-golden-bank" }, async () => {
    const slug = "castle-mandawa-e40850";
    const existing = await readTenantCertification(slug);
    const added: TenantCertificationCase[] = [
      { id: "golden-property-overview", question: "Tell me about Castle Mandawa.", expectation: "GROUNDED_ANSWER" },
      { id: "golden-address", question: "What is the address of Castle Mandawa?", expectation: "GROUNDED_ANSWER" },
      { id: "golden-wedding", question: "Does Castle Mandawa host weddings?", expectation: "GROUNDED_ANSWER" },
      { id: "golden-booking-process", question: "How do I book a stay at Castle Mandawa?", expectation: "GROUNDED_ANSWER" },
      { id: "golden-room-categories", question: "Which room categories does Castle Mandawa offer?", expectation: "GROUNDED_ANSWER" }
    ];
    const revision = await getTenantKnowledgeRevision(slug);
    const source = `data/runtime/tenant-certification-${slug}.json`;
    await copyFile(source, `${source}.before-golden-${Date.now()}`);
    const cases = [...existing.cases, ...added.filter(item => !existing.cases.some(old => old.id === item.id))];
    await saveTenantCertificationCases(slug, "GOLDEN", cases, { reviewedBy: "Codex — user-authorized implementation", reviewerRole: "ASSISTED_SOURCE_REVIEW", sourceRevision: revision });
    // Evaluation-only: no lead creation or customer-credit consumption.
    const result = await runTenantCertification(slug, revision, "cmu2dcedu003284kxjotchehs");
    console.log(JSON.stringify({ passed: result.passed, cases: result.cases.length, results: result.results }, null, 2));
    if (!result.passed) process.exitCode = 1;
  });
}
main().then(() => process.exit(process.exitCode || 0)).catch(error => { console.error(error.message); process.exit(1); });

import { getDb, withDatabaseIdentity } from "../lib/db";

async function main() {
  await withDatabaseIdentity({ organizationId: "cmu2dcedu003284kxjotchehs", platformAuthority: false, actor: "certification-recovery", systemPurpose: "inspect-approved-knowledge" }, async () => {
    const db = getDb();
    if (!db) throw new Error("Database unavailable");
    const property = await db.property.findUnique({ where: { slug: "castle-mandawa-e40850" }, select: { id: true, name: true, organizationId: true } });
    if (!property) throw new Error("Tenant property not visible");
    const entries = await db.knowledgeEntry.findMany({ where: { propertyId: property.id }, select: { question: true, answer: true, status: true, validationStatus: true, authorityLevel: true }, take: 60 });
    console.log(JSON.stringify({ property, entries }, null, 2));
  });
}
main().then(() => process.exit(0)).catch(error => { console.error(error.message); process.exit(1); });

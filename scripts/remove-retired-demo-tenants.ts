import { getDb } from "@/lib/db";

const EXACT_TARGET_IDS = [
  "cmtfypus1000bc4kx7e0fdhui",
  "cmtfypux3001kc4kx2elzuyzo",
  "cmtfyputj000nc4kxpa7al0wo",
  "cmtfypuz50026c4kx3lp3gzs4",
  "cmtfypuy2001vc4kx8sc7md92",
  "cmtfypuvk0019c4kx9jmeu92m",
  "cmtfypuof0000c4kxdssvhg1x",
  "cmtfypuuh000yc4kx8jdeu7s4",
  "org_hotelradar_ai_agency_2026"
] as const;

async function main() {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const targets = await db.organization.findMany({ where: { id: { in: [...EXACT_TARGET_IDS] } }, select: { id: true, name: true, slug: true, isDemo: true } });
  const unexpected = targets.filter((item) => !item.isDemo && item.id !== "org_hotelradar_ai_agency_2026");
  if (unexpected.length) throw new Error(`Refusing unexpected target: ${unexpected.map((item) => item.name).join(", ")}`);
  if (targets.some((item) => /webtechnosys/i.test(`${item.name} ${item.slug}`))) throw new Error("Webtechnosys protection gate triggered.");
  const result = await db.organization.deleteMany({ where: { id: { in: targets.map((item) => item.id) } } });
  console.log(JSON.stringify({ deleted: result.count, targets: targets.map((item) => ({ id: item.id, name: item.name })) }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });

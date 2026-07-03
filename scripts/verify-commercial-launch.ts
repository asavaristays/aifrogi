import { access, readFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { helpArticles } from "@/lib/help-center";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function exists(path: string) {
  await access(path, constants.R_OK);
}

async function main() {
  loadEnvConfig(process.cwd());
  const [{ getPlatformReadiness }, { getDb }] = await Promise.all([
    import("@/lib/platform-health"),
    import("@/lib/db")
  ]);

  assert(helpArticles.length >= 6, "The Help Center launch set is incomplete.");
  assert(new Set(helpArticles.map((article) => article.slug)).size === helpArticles.length, "Help article slugs must be unique.");
  for (const article of helpArticles) {
    assert(article.steps.length >= 4, `${article.slug} needs a complete procedure.`);
    assert(article.checks.length >= 4, `${article.slug} needs completion checks.`);
  }

  const requiredFiles = [
    "public/media/product-video/aifrogi-product-tour.mp4",
    "public/media/product-video/aifrogi-product-tour.en.vtt",
    "docs/runbooks/incident-response.md",
    "docs/runbooks/backup-and-restore.md",
    "docs/runbooks/launch-qa.md",
    "ops/backup-postgres.sh",
    "ops/restore-drill.sh",
    "ops/monitor-health.sh"
  ];
  for (const file of requiredFiles) await exists(file);

  const video = await stat("public/media/product-video/aifrogi-product-tour.mp4");
  assert(video.size > 1_000_000, "Product tour video is unexpectedly small.");
  assert(video.size < 60_000_000, "Product tour video is too large for a fast web experience.");
  const captions = await readFile("public/media/product-video/aifrogi-product-tour.en.vtt", "utf8");
  assert(captions.startsWith("WEBVTT") && captions.includes("AiFrogi"), "Product tour captions are invalid.");

  const readiness = await getPlatformReadiness();
  assert(readiness.checks.database === "ok", "Database readiness failed.");
  if (process.env.NODE_ENV === "production") {
    assert(readiness.status === "ok", "Production readiness checks are degraded.");
  }

  const db = getDb();
  assert(db, "DATABASE_URL is required.");
  const [organizations, openIncidents, deadJobs] = await Promise.all([
    db.organization.count(),
    db.platformIncident.count({ where: { status: { in: ["OPEN", "INVESTIGATING", "MONITORING"] } } }),
    db.automationJob.count({ where: { status: "DEAD" } })
  ]);
  if (process.env.NODE_ENV === "production") {
    assert(organizations >= 1, "At least one organization is required for production launch.");
  }

  console.log("Commercial launch verification passed.");
  console.log(JSON.stringify({ organizations, openIncidents, deadJobs, readiness: readiness.status }));
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

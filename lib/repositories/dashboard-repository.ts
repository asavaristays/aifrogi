import { getDb } from "@/lib/db";

export async function getLatestDashboardMetric(propertySlug: string) {
  const db = getDb();
  if (!db) return null;

  return db.metricDaily.findFirst({
    where: {
      property: {
        slug: propertySlug
      }
    },
    include: {
      property: true
    },
    orderBy: {
      date: "desc"
    }
  });
}

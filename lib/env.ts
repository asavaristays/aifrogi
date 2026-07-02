export const env = {
  databaseUrl: process.env.DATABASE_URL
};

export const DEFAULT_PROPERTY_SLUG = process.env.LEADOS_DEFAULT_PROPERTY_SLUG?.trim() || "hotelradar";

export function hasDatabaseUrl() {
  return Boolean(env.databaseUrl);
}

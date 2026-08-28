export const env = {
  get databaseUrl() {
    return process.env.DATABASE_URL;
  }
};

export const DEFAULT_PROPERTY_SLUG = process.env.LEADOS_DEFAULT_PROPERTY_SLUG?.trim() || "hotelradar";

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

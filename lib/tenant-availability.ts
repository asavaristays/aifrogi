import { getDb } from "@/lib/db";
import { decryptSecretValue } from "@/lib/field-encryption";
import type { ConnectorOperationMapping } from "@/lib/connector-api-control";

type AvailabilityProperty = {
  property?: { id?: number; name?: string; city?: string; image_url?: string; imageUrl?: string; image?: string; cover_image?: string; booking_url?: string; url?: string; photos?: Array<string | { url?: string }>; images?: Array<string | { url?: string }> };
  available?: boolean;
  rooms?: Array<{ id?: number | string; name?: string; available_count?: number; image_url?: string; rate_plans?: Array<{ id?: number | string; name?: string; base_rate?: number; currency?: string }> }>;
};

export type TenantAvailabilityResult = {
  available: boolean;
  destination: string;
  checkIn: string;
  checkOut: string;
  properties: Array<{ id: number; name: string; city?: string; imageUrl?: string; propertyUrl?: string; rooms: Array<{ id?: string; name: string; availableCount: number; fromRate?: number; currency?: string }>; availableCount: number; fromRate?: number; currency?: string }>;
  checkedAt: string;
};

export async function checkTenantStayAvailability(input: { organizationId: string; destination: string; checkIn: string; checkOut: string; adults?: number; children?: number }): Promise<TenantAvailabilityResult | null> {
  const db = getDb();
  if (!db) return null;
  const connector = await db.botConnectorConfiguration.findUnique({ where: { organizationId_connectorKey: { organizationId: input.organizationId, connectorKey: "PMS_AVAILABILITY" } }, include: { credential: true } });
  if (!connector?.enabled || connector.lifecycle !== "LIVE" || connector.lastHealthStatus !== "HEALTHY" || !connector.apiBaseUrl) return null;
  if (connector.authType !== "NONE" && (!connector.credential || connector.credential.revokedAt || (connector.credential.expiresAt && connector.credential.expiresAt <= new Date()))) return null;
  const mapping = (connector.operationMapping || {}) as ConnectorOperationMapping;
  if (!mapping.availability) return null;
  const target = new URL(mapping.availability, `${connector.apiBaseUrl}/`);
  if (target.origin !== new URL(connector.apiBaseUrl).origin) return null;
  target.searchParams.set("destination", input.destination);
  target.searchParams.set("checkIn", input.checkIn);
  target.searchParams.set("checkOut", input.checkOut);
  target.searchParams.set("adults", String(input.adults || 2));
  target.searchParams.set("children", String(input.children || 0));
  const secret = decryptSecretValue(connector.credential?.secretEncrypted);
  if (!secret && connector.authType !== "NONE") return null;
  const headers: Record<string, string> = { Accept: "application/json", "User-Agent": "AiFrogi-Availability/1.0" };
  if (connector.authType === "BEARER") headers.Authorization = `Bearer ${secret}`;
  if (connector.authType === "API_KEY") headers["X-API-Key"] = secret!;
  const response = await fetch(target, { method: "GET", headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
  if (connector.credential) await db.botConnectorCredential.update({ where: { id: connector.credential.id }, data: { lastUsedAt: new Date() } });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null) as { success?: boolean; data?: { destination?: string; check_in?: string; check_out?: string; available?: boolean; properties?: AvailabilityProperty[] } } | null;
  if (!payload?.success || !payload.data) return null;
  const connectorBaseUrl = connector.apiBaseUrl;
  const connectorOrigin = new URL(connectorBaseUrl).origin;
  const imageCandidate = (property: NonNullable<AvailabilityProperty["property"]>) => {
    const media = [...(property.photos || []), ...(property.images || [])].map((item) => typeof item === "string" ? item : item?.url).find(Boolean);
    return property.image_url || property.imageUrl || property.image || property.cover_image || media;
  };
  const absoluteUrl = (value?: string) => { if (!value) return undefined; try { return new URL(value, connectorOrigin).toString(); } catch { return undefined; } };
  const properties = await Promise.all((payload.data.properties || []).filter((item) => item.available).map(async (item) => {
    const rooms = (item.rooms || []).filter((room) => Number(room.available_count || 0) > 0);
    const rates = rooms.flatMap((room) => room.rate_plans || []).map((rate) => Number(rate.base_rate || 0)).filter((rate) => rate > 0);
    const id = Number(item.property?.id || 0);
    const propertyUrl = absoluteUrl(item.property?.booking_url || item.property?.url) || (new URL(connectorBaseUrl).hostname.endsWith("asavaristays.com") && id > 0 ? `${connectorOrigin}/properties/${id}` : undefined);
    let imageUrl = absoluteUrl(imageCandidate(item.property || {}));
    if (!imageUrl && propertyUrl) {
      try {
        const page = await fetch(propertyUrl, { headers: { Accept: "text/html", "User-Agent": "AiFrogi-Property-Card/1.0" }, cache: "force-cache", signal: AbortSignal.timeout(4000) });
        if (page.ok) {
          const html = await page.text();
          const match = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i) || html.match(/(https?:\/\/[^"'\s<>]+\/uploads\/properties\/[^"'\s<>]+\.(?:jpe?g|png|webp))/i) || html.match(/["'](\/uploads\/properties\/[^"']+\.(?:jpe?g|png|webp))["']/i);
          imageUrl = absoluteUrl(match?.[1]);
        }
      } catch { /* A missing image must not block verified availability. */ }
    }
    return { id, name: String(item.property?.name || "Stay"), city: item.property?.city, imageUrl, propertyUrl, rooms: rooms.map((room) => { const roomRates = (room.rate_plans || []).map((rate) => Number(rate.base_rate || 0)).filter((rate) => rate > 0); return { id: room.id == null ? undefined : String(room.id), name: String(room.name || "Room"), availableCount: Number(room.available_count || 0), ...(roomRates.length ? { fromRate: Math.min(...roomRates), currency: room.rate_plans?.[0]?.currency || "INR" } : {}) }; }), availableCount: rooms.reduce((sum, room) => sum + Number(room.available_count || 0), 0), ...(rates.length ? { fromRate: Math.min(...rates), currency: rooms.flatMap((room) => room.rate_plans || [])[0]?.currency || "INR" } : {}) };
  }));
  const availableProperties = properties.filter((item) => item.id > 0 && item.availableCount > 0);
  return { available: payload.data.available === true && availableProperties.length > 0, destination: payload.data.destination || input.destination, checkIn: payload.data.check_in || input.checkIn, checkOut: payload.data.check_out || input.checkOut, properties: availableProperties, checkedAt: new Date().toISOString() };
}

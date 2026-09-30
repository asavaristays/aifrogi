const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function normalizeWebsiteOrigin(value: string | null | undefined) {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    if (!ALLOWED_PROTOCOLS.has(url.protocol) || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function websiteWidgetCorsHeaders(requestOrigin: string | null, registeredWebsite: string | null | undefined) {
  const origin = normalizeWebsiteOrigin(requestOrigin);
  const allowedOrigin = normalizeWebsiteOrigin(registeredWebsite);
  if (!origin || !allowedOrigin || origin !== allowedOrigin) return null;

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin"
  } as const;
}

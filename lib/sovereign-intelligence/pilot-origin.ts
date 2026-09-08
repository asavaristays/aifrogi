// Use configured public origin behind the reverse proxy, never forwarded headers.
export function isPilotReviewOriginAllowed(origin: string | null, requestUrl: string, production: boolean, configuredUrl?: string) {
  if (!origin) return false;
  try {
    const expected = production ? new URL(configuredUrl || 'https://app.aifrogi.com').origin : new URL(requestUrl).origin;
    return origin === expected;
  } catch { return false; }
}

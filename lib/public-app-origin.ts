const PRODUCTION_APP_ORIGIN = "https://app.aifrogi.com";

function normalizedHttpOrigin(value: string | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Returns the browser-visible application origin. In production this must not
 * be inferred from request.url because reverse proxies commonly forward the
 * internal upstream URL (for example https://localhost:3011).
 */
export function publicAppOrigin(requestUrl: string, env: NodeJS.ProcessEnv = process.env) {
  const configured = normalizedHttpOrigin(env.AIFROGI_APP_URL)
    || normalizedHttpOrigin(env.NEXT_PUBLIC_APP_URL)
    || normalizedHttpOrigin(env.PUBLIC_BASE_URL);
  if (env.NODE_ENV === "production") {
    return configured && !/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(new URL(configured).hostname)
      ? configured
      : PRODUCTION_APP_ORIGIN;
  }
  return configured || new URL(requestUrl).origin;
}

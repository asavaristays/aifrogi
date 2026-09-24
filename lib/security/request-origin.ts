export function hasTrustedSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const requestUrl = new URL(request.url);
    const forwardedHost = (request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host).split(",")[0].trim().toLowerCase();
    return new URL(origin).host.toLowerCase() === forwardedHost;
  } catch {
    return false;
  }
}

export function validTimeZone(value: unknown, fallback = "Asia/Kolkata") {
  const candidate = String(value || "").trim().slice(0, 80);
  if (!candidate) return fallback;
  try {
    new Intl.DateTimeFormat("en", { timeZone: candidate }).format();
    return candidate;
  } catch {
    return fallback;
  }
}

export function greetingForTimeZone(timeZone: string, now = new Date()) {
  const safeTimeZone = validTimeZone(timeZone);
  const hour = Number(new Intl.DateTimeFormat("en", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: safeTimeZone
  }).format(now));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export function dateLabelForTimeZone(timeZone: string, now = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: validTimeZone(timeZone)
  }).format(now);
}

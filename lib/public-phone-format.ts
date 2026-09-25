export function formatPublicPhoneForDisplay(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  const indian = digits.length === 10 ? digits : digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : "";
  if (indian) return `+91 ${indian.slice(0, 5)} ${indian.slice(5)}`;
  return String(value || "").trim();
}

export function normalizePublicPhoneInText(text: string, publicPhone?: string | null) {
  const formatted = formatPublicPhoneForDisplay(publicPhone);
  const digits = String(publicPhone || "").replace(/\D/g, "");
  const local = digits.length === 10 ? digits : digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : "";
  if (!local || !formatted) return text;
  const separatedLocal = local.split("").join("[\\s-]*");
  return text.replace(new RegExp(`(?<!\\d)(?:\\+?91[\\s-]*)?${separatedLocal}(?!\\d)`, "g"), formatted);
}

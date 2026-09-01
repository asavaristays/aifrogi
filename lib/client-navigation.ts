export function isClientNavItemAvailable(href: string, enabledChannels: readonly string[]) {
  if (href === "/campaigns") return enabledChannels.includes("WHATSAPP");
  return true;
}

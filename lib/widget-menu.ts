export const WIDGET_MENU_ICONS = ["sparkles", "training", "film", "grid", "phone", "link", "mail", "chat"] as const;
export type WidgetMenuIcon = typeof WIDGET_MENU_ICONS[number];
export type WidgetMenuAction = "LINK" | "CHAT" | "CALL" | "EMAIL" | "SUBMENU";
export type WidgetMenuItem = { id: string; label: string; action: WidgetMenuAction; value?: string; icon: WidgetMenuIcon; featured?: boolean; children?: WidgetMenuItem[] };
export type WidgetMenuConfig = { enabled: boolean; heading: string; items: WidgetMenuItem[] };

const WEBTECHNOSYS_SLUG = "webtechnosys-ai-agency-e5da22";
const webtechnosysMenu: WidgetMenuConfig = {
  enabled: true,
  heading: "What would you like to explore?",
  items: [
    { id: "services", label: "Our AI Services", action: "LINK", value: "https://webtechnosys.com/", icon: "sparkles" },
    { id: "training", label: "AI Training & Booking", action: "LINK", value: "https://webtechnosys.com/training-booking/", icon: "training" },
    { id: "film", label: "AI Film Making", action: "LINK", value: "https://webtechnosys.com/ai-filmmaking/", icon: "film" },
    { id: "demos", label: "Explore AI Bot Demos", action: "LINK", value: "https://app.aifrogi.com/ai-bot-demos", icon: "grid", featured: true },
    { id: "contact", label: "Contact Our Team", action: "SUBMENU", icon: "phone", children: [
      { id: "contact-phone", label: "Call +91-7410582898", action: "CALL", value: "+917410582898", icon: "phone" },
      { id: "contact-email", label: "info@webtechnosys.com", action: "EMAIL", value: "info@webtechnosys.com", icon: "mail" }
    ] }
  ]
};

export function defaultWidgetMenu(propertySlug: string): WidgetMenuConfig {
  return propertySlug === WEBTECHNOSYS_SLUG ? structuredClone(webtechnosysMenu) : { enabled: false, heading: "What would you like to explore?", items: [] };
}

function cleanItem(raw: unknown, depth = 0): WidgetMenuItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<WidgetMenuItem>;
  const action = ["LINK", "CHAT", "CALL", "EMAIL", "SUBMENU"].includes(String(item.action)) ? item.action as WidgetMenuAction : "LINK";
  const label = String(item.label || "").trim().slice(0, 54);
  if (!label || (depth > 0 && action === "SUBMENU")) return null;
  const icon = WIDGET_MENU_ICONS.includes(item.icon as WidgetMenuIcon) ? item.icon as WidgetMenuIcon : "link";
  let value = String(item.value || "").trim().slice(0, 500);
  if (action === "LINK") {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("Menu website links must use public HTTPS URLs.");
    value = url.toString();
  }
  if (action === "CALL") {
    value = value.replace(/[^+\d]/g, "");
    if (!/^\+?\d{7,15}$/.test(value)) throw new Error("Enter a valid menu phone number.");
  }
  if (action === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("Enter a valid menu email address.");
  const children = action === "SUBMENU" ? (Array.isArray(item.children) ? item.children : []).slice(0, 8).map(child => cleanItem(child, 1)).filter(Boolean) as WidgetMenuItem[] : undefined;
  if (action === "SUBMENU" && !children?.length) throw new Error("Each submenu needs at least one option.");
  return { id: String(item.id || crypto.randomUUID()).replace(/[^a-z0-9_-]/gi, "").slice(0, 50) || crypto.randomUUID(), label, action, icon, featured: item.featured === true, ...(value ? { value } : {}), ...(children ? { children } : {}) };
}

export function normalizeWidgetMenu(raw: unknown, fallback: WidgetMenuConfig): WidgetMenuConfig {
  if (!raw || typeof raw !== "object") return fallback;
  const value = raw as Partial<WidgetMenuConfig>;
  let featuredSeen = false;
  const items = ((Array.isArray(value.items) ? value.items : []).slice(0, 6).map(item => cleanItem(item)).filter(Boolean) as WidgetMenuItem[]).map(item => {
    const featured = item.featured === true && !featuredSeen;
    if (featured) featuredSeen = true;
    return { ...item, featured };
  });
  return { enabled: value.enabled === true, heading: String(value.heading || fallback.heading).trim().slice(0, 80) || fallback.heading, items };
}

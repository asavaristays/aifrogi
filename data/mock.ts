import type { NavItem, QuickAction } from "@/types";

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Today", icon: "grid", tone: "primary" },
  { href: "/whatsapp-bot", label: "Inbox", icon: "message-circle", tone: "secondary" },
  { href: "/contacts", label: "Contacts", icon: "inbox", tone: "primary" },
  { href: "/campaigns", label: "Campaigns", icon: "megaphone", tone: "tertiary" },
  { href: "/workflows", label: "Workflows", icon: "sparkles", tone: "tertiary" },
  { href: "/analytics", label: "Analytics", icon: "bar-chart-3", tone: "secondary" },
  { href: "/setup", label: "Setup", icon: "plug", tone: "primary" },
  { href: "/support", label: "Support", icon: "help-circle", tone: "neutral" },
  { href: "/settings", label: "Settings", icon: "settings", tone: "neutral" }
];

export const quickActions: QuickAction[] = [
  { label: "Send Photos", icon: "image", tone: "primary" },
  { label: "Send UPI Link", icon: "link", tone: "neutral" },
  { label: "Send Quote PDF", icon: "file-text", tone: "neutral" },
  { label: "Escalate", icon: "triangle-alert", tone: "error" }
];

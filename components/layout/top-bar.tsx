import { Icon } from "@/components/icons";
import { LogoutButton } from "@/components/layout/logout-button";
import Link from "next/link";

export function TopBar({
  title,
  subtitle,
  actions,
  notificationCount = 0,
  notificationMode: _notificationMode = "pill",
  tone = "dark"
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  notificationCount?: number;
  notificationMode?: "pill" | "icon";
  tone?: "dark" | "light";
}) {
  const unreadCount = Number.isFinite(notificationCount) ? Math.max(0, Math.floor(notificationCount)) : 0;
  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <header
      className={
        tone === "light"
          ? "sticky top-0 z-20 flex flex-col gap-4 border-b border-black/5 bg-white px-5 py-4 shadow-sm sm:px-8"
          : "sticky top-0 z-20 flex flex-col gap-4 border-b border-black/5 bg-white/95 px-5 py-4 shadow-sm backdrop-blur sm:px-8"
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="pl-14 lg:pl-0">
          <h1 className={tone === "light" ? "text-2xl font-semibold text-black" : "text-2xl font-semibold text-[var(--text)]"}>{title}</h1>
          {subtitle ? <p className={tone === "light" ? "mt-1 text-sm text-black/60" : "mt-1 text-sm text-[var(--text-muted)]"}>{subtitle}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <Link href="/whatsapp-bot" className="relative inline-flex min-h-9 items-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 text-xs font-semibold shadow-sm transition hover:bg-[var(--surface-soft)]" aria-label={unreadCount > 0 ? `${unreadCount} items need attention` : "Open inbox"}>
            <Icon name="bell" className="h-4 w-4" />
            <span>{unreadCount > 0 ? "Attention" : "Inbox"}</span>
            {unreadCount > 0 ? <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--error)] px-1 text-[10px] font-bold text-white">{unreadLabel}</span> : null}
          </Link>
          <LogoutButton className="w-auto rounded-md px-3 py-2 text-xs font-semibold tracking-normal" />
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
}

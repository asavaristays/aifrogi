"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navItems } from "@/data/mock";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons";
import { useAppState } from "@/components/providers/app-state-provider";
import { LogoutButton } from "@/components/layout/logout-button";
import { WorkspaceSwitcher, type WorkspaceOption } from "@/components/layout/workspace-switcher";
import type { ClientAccessRole } from "@/lib/client-access";

const navGroups = [
  { label: "Operate", helper: "Daily work", hrefs: ["/dashboard", "/whatsapp-bot", "/contacts"] },
  { label: "Grow", helper: "Campaigns and intelligence", hrefs: ["/campaigns", "/workflows", "/knowledge", "/analytics"] },
  { label: "Manage", helper: "Setup and support", hrefs: ["/setup", "/billing", "/support", "/settings"] }
];

type SideNavTone = "dark" | "light";

export function SideNav({
  tone = "dark",
  workspaces = [],
  currentWorkspaceSlug = "",
  accessRole = "AGENT"
}: {
  tone?: SideNavTone;
  workspaces?: WorkspaceOption[];
  currentWorkspaceSlug?: string;
  accessRole?: ClientAccessRole;
} = {}) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAppState();
  const isLight = tone === "light";
  const canManage = accessRole === "OWNER" || accessRole === "ADMIN";
  const allowedHrefs = new Set(canManage
    ? navItems.map((item) => item.href)
    : ["/dashboard", "/whatsapp-bot", "/contacts", "/knowledge", "/support"]);

  return (
    <>
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "fixed top-4 z-50 rounded-md p-2 shadow-sm transition-[left,transform] duration-150 ease-out active:scale-95 lg:hidden",
          sidebarOpen ? "left-[202px]" : "left-4",
          isLight
            ? "border border-[var(--gold-300)] bg-[var(--ink-900)] text-white shadow-[0_10px_24px_rgba(16,16,16,0.18)]"
            : "bg-[var(--primary-strong)] text-white"
        )}
        aria-label="Toggle navigation"
      >
        <Icon name={sidebarOpen ? "x" : "menu"} className="h-4 w-4" />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-30 transition-opacity duration-150 ease-out lg:hidden",
          isLight ? "bg-black/20" : "bg-black/40",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col px-3.5 py-4 transition-transform duration-150 ease-out will-change-transform",
          "border-r border-black bg-[var(--ink-900)] text-white",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="mb-4 border-b border-white/10 px-2 pb-4 pt-1">
          <div className="flex min-h-11 items-center">
            <Image src="/brand/aifrogi-logo-transparent.png" alt="AiFrogi" width={800} height={300} priority className="h-auto w-[158px] grayscale contrast-125" />
          </div>
          {workspaces.length ? <WorkspaceSwitcher workspaces={workspaces} currentSlug={currentWorkspaceSlug} /> : null}
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navGroups.map((group) => <section
            key={group.label}
            className="mb-5"
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-2 px-2.5">
              <p className="text-[11px] font-semibold text-[var(--gold-300)]">{group.label}</p>
              <p className="truncate text-[10px] text-white/35">{group.helper}</p>
            </div>
            <div className="space-y-0.5">{navItems.filter((item) => group.hrefs.includes(item.href) && allowedHrefs.has(item.href)).map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "relative flex min-h-10 items-center gap-3 rounded-md border px-2.5 py-2 text-[13px] font-medium tracking-normal transition-all",
                  active
                    ? "border-[var(--gold-600)]/55 bg-[var(--gold-600)]/22 text-[var(--gold-100)]"
                    : "border-transparent text-white/68 hover:bg-white/7 hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md transition-all",
                    active
                      ? "bg-[var(--gold-300)] text-[var(--ink-900)] shadow-[0_10px_18px_rgba(0,0,0,0.2)]"
                      : "bg-white/6 text-white/72"
                  )}
                >
                  <Icon name={item.icon as never} className="h-4 w-4" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}</div></section>)}
        </nav>

        <div className="mt-2 shrink-0 border-t border-white/10 px-1.5 pt-3">
          <div className="mb-2.5 flex items-center justify-between gap-2 px-2 text-xs"><span className="text-white/45">Access</span><strong className="text-[var(--gold-300)]">{accessRole === "OWNER" ? "Client Admin" : accessRole === "ADMIN" ? "Workspace Admin" : accessRole === "VIEWER" ? "Viewer" : "Agent"}</strong></div>
          {workspaces[0] ? <div className="mb-2.5 flex items-center gap-2 px-2 text-xs"><span className={`h-2 w-2 rounded-full ${workspaces[0].status === "CONNECTED" ? "bg-[var(--success)]" : "bg-[#d9902f]"}`} /><span className="text-white/58">{workspaces[0].status === "CONNECTED" ? "WhatsApp connected" : "Setup needs attention"}</span></div> : null}
          <LogoutButton variant="sidebar" className="w-full rounded-md border border-white/12 !bg-white/5 px-2.5 py-2 text-xs font-bold tracking-normal text-white/78 hover:!bg-white/10 hover:text-white" />
        </div>
      </aside>
    </>
  );
}

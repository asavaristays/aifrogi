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

const toneStyles = {
  primary: {
    active: "border-[#35c88f]/25 bg-[#143d36] text-white shadow-sm",
    inactive: "text-white/76 hover:bg-white/7 hover:text-white"
  },
  secondary: {
    active: "border-[#7db7ff]/25 bg-[#16334a] text-white shadow-sm",
    inactive: "text-white/76 hover:bg-white/7 hover:text-white"
  },
  tertiary: {
    active: "border-[#f2b75d]/25 bg-[#3a321d] text-white shadow-sm",
    inactive: "text-white/76 hover:bg-white/7 hover:text-white"
  },
  neutral: {
    active: "border-white/10 bg-white/10 text-white shadow-sm",
    inactive: "text-[var(--sidebar-muted)] hover:bg-white/7 hover:text-white"
  },
  error: {
    active: "border-[#f26b7a]/25 bg-[#44252a] text-white shadow-sm",
    inactive: "text-white/76 hover:bg-white/7 hover:text-white"
  }
} as const;

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
            ? "border border-[#eadfed] bg-white text-[#2c243b] shadow-[0_10px_24px_rgba(55,35,73,0.1)]"
            : "bg-[var(--primary)] text-white"
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
          isLight
            ? "border-r border-[var(--border)] bg-white text-[var(--text)]"
            : "bg-[#2c243b] text-white",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn("mb-4 px-2 pb-4 pt-1", isLight ? "border-b border-black/6" : "border-b border-white/8")}>
          <div className="flex min-h-11 items-center">
            <Image src={isLight ? "/brand/aifrogi-logo.png" : "/brand/aifrogi-logo-transparent.png"} alt="AiFrogi" width={800} height={300} priority className="h-auto w-[158px]" />
          </div>
          {workspaces.length ? <WorkspaceSwitcher workspaces={workspaces} currentSlug={currentWorkspaceSlug} /> : null}
        </div>

        <nav className="flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navGroups.map((group) => <section
            key={group.label}
            className="mb-5"
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-2 px-2.5">
              <p className={cn("text-[11px] font-semibold", isLight ? "text-black/48" : "text-white/54")}>{group.label}</p>
              <p className={cn("truncate text-[10px]", isLight ? "text-black/28" : "text-white/30")}>{group.helper}</p>
            </div>
            <div className="space-y-0.5">{navItems.filter((item) => group.hrefs.includes(item.href) && allowedHrefs.has(item.href)).map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const tone = toneStyles[item.tone ?? "neutral"];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "relative flex min-h-10 items-center gap-3 rounded-md border px-2.5 py-2 text-[13px] font-medium tracking-normal transition-all",
                  isLight
                    ? active
                      ? "border-[#f2d9f0] bg-[var(--primary-soft)] text-[#8d1884]"
                      : "border-transparent text-[#5f5866] hover:bg-[#f8f6f9] hover:text-[var(--text)]"
                    : active
                      ? tone.active
                      : cn("border-transparent", tone.inactive)
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md transition-all",
                    isLight
                      ? active
                        ? "bg-white text-[var(--primary-strong)]"
                        : "bg-transparent text-[#756d7e]"
                      : active
                        ? "bg-white/14 text-white shadow-[0_10px_18px_rgba(0,0,0,0.12)]"
                        : "bg-white/6 text-white/80"
                  )}
                >
                  <Icon name={item.icon as never} className="h-4 w-4" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}</div></section>)}
        </nav>

        <div className={cn("mt-2 border-t px-1.5 pt-4", isLight ? "border-black/6" : "border-white/8")}>
          <div className="mb-2.5 flex items-center justify-between gap-2 px-2 text-xs"><span className={isLight ? "text-black/45" : "text-white/45"}>Access</span><strong className={isLight ? "text-[#8d1884]" : "text-white/80"}>{accessRole === "OWNER" ? "Client Admin" : accessRole === "ADMIN" ? "Workspace Admin" : accessRole === "VIEWER" ? "Viewer" : "Agent"}</strong></div>
          {workspaces[0] ? <div className="mb-2.5 flex items-center gap-2 px-2 text-xs"><span className={`h-2 w-2 rounded-full ${workspaces[0].status === "CONNECTED" ? "bg-[var(--success)]" : "bg-[#d9902f]"}`} /><span className={isLight ? "text-black/55" : "text-white/58"}>{workspaces[0].status === "CONNECTED" ? "WhatsApp connected" : "Setup needs attention"}</span></div> : null}
          <LogoutButton variant="sidebar" className={cn("w-full rounded-md px-2.5 py-2 text-xs font-medium tracking-normal", isLight ? "border border-transparent !bg-white text-black/55 hover:!bg-black/5 hover:text-black" : "")} />
        </div>
      </aside>
    </>
  );
}

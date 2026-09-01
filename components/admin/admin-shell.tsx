"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

const navigation = [
  { label: "Command center", href: "/admin", icon: "grid" as const },
  { label: "Customers", href: "/admin/customers", icon: "inbox" as const },
  { label: "Appointments", href: "/admin/appointments", icon: "smartphone" as const },
  { label: "Bot demos", href: "/admin/demo-sandboxes", icon: "sparkles" as const },
  { label: "Billing", href: "/admin/billing", icon: "bar-chart-3" as const },
  { label: "Knowledge", href: "/admin/knowledge", icon: "file-text" as const },
  { label: "Sovereign AI", href: "/admin/sovereign-intelligence", icon: "plug" as const },
  { label: "Support", href: "/admin/support", icon: "help-circle" as const },
  { label: "Audit trail", href: "/admin/audit", icon: "refresh-cw" as const }
];

export function AdminShell({ userEmail, children }: { userEmail: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return <div className="min-h-screen bg-[#efede7] text-[#101010] lg:pl-[280px]">
    <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-white/8 bg-[#070707] px-5 text-white lg:hidden">
      <Image src="/brand/aifrogi-logo-white.png" alt="AiFrogi" width={800} height={300} priority className="h-auto w-[142px] grayscale contrast-125" />
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="admin-navigation" className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/6"><Icon name={open ? "x" : "menu"} className="h-5 w-5" /></button>
    </header>

    <aside id="admin-navigation" className={`${open ? "fixed inset-x-0 top-[72px] z-30 block" : "hidden"} max-h-[calc(100vh-72px)] overflow-y-auto bg-[#070707] p-4 text-white shadow-2xl lg:fixed lg:inset-y-0 lg:left-0 lg:top-0 lg:block lg:h-screen lg:max-h-none lg:w-[280px] lg:overflow-hidden`}>
      <div className="flex min-h-full flex-col rounded-[30px] border border-white/8 bg-[#101010] p-4 shadow-[0_30px_80px_rgba(0,0,0,.28)] lg:h-full lg:min-h-0">
        <Link href="/admin" onClick={() => setOpen(false)} className="hidden px-3 pb-5 pt-2 lg:block"><Image src="/brand/aifrogi-logo-white.png" alt="AiFrogi" width={800} height={300} priority className="h-auto w-[156px] grayscale contrast-125" /><span className="mt-2 block text-[9px] font-semibold uppercase tracking-[.22em] text-[#e2c66d]">Sovereign operations</span></Link>

        <Link href="/admin/onboard" onClick={() => setOpen(false)} className="group flex min-h-12 items-center justify-between rounded-2xl bg-[#b28728] px-4 text-sm font-bold text-white shadow-[0_18px_40px_rgba(178,135,40,.24)] transition hover:-translate-y-0.5 hover:bg-[#d4af37] hover:text-[#101010]"><span className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-black/14"><Icon name="sparkles" /></span>Onboard client</span><Icon name="arrow-right" /></Link>

        <nav aria-label="Super Admin navigation" className="mt-4 space-y-1">
          {navigation.map((item) => {
            const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold transition ${active ? "bg-white text-[#101010] shadow-[0_12px_28px_rgba(0,0,0,.22)]" : "text-white/62 hover:bg-white/7 hover:text-white"}`}><span className={`grid h-8 w-8 place-items-center rounded-xl ${active ? "bg-[#f3e5b5] text-[#6d5310]" : "bg-white/6 text-[#e2c66d]"}`}><Icon name={item.icon} /></span>{item.label}</Link>;
          })}
        </nav>

        <div className="mt-auto border-t border-white/8 px-2 pt-5"><p className="truncate text-xs font-semibold text-white/58">{userEmail}</p><p className="mt-1 text-[10px] uppercase tracking-[.18em] text-[#e2c66d]">Platform administrator</p><div className="mt-4"><AdminLogoutButton /></div></div>
      </div>
    </aside>

    <div className="min-w-0"><div className="admin-premium-canvas min-h-screen [&_section]:rounded-[26px] [&_section]:shadow-[0_24px_70px_-52px_rgba(16,16,16,.58)]">{children}</div></div>
  </div>;
}

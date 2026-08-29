"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";

const loginUrl = "https://app.aifrogi.com/login";
const registerUrl = "https://app.aifrogi.com/register?source=site-header";

const navItems = [
  { label: "Home", href: "/" },
  {
    label: "Solutions",
    href: "/solutions",
    children: [
      { label: "Solutions overview", href: "/solutions", copy: "WhatsApp automation suite" },
      { label: "FlowCart", href: "/solutions/flowcart", copy: "Catalog, order, pay, update" },
      { label: "PingBook", href: "/solutions/pingbook", copy: "Book, confirm, remind, grow" }
    ]
  },
  { label: "Onboarding", href: "/onboarding-process" },
  { label: "Integration", href: "/integration" },
  { label: "Resources", href: "/resources" },
  { label: "Pricing", href: "/pricing" }
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--gold-600)]/20 bg-[var(--ink-950)]/95 px-4 text-white backdrop-blur-xl sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex min-h-[68px] items-center justify-between gap-3">
          <Link href="/" className="flex shrink-0 items-center" aria-label="AiFrogi home" onClick={() => setMenuOpen(false)}>
            <Image src="/brand/aifrogi-logo-transparent.png" alt="AiFrogi" width={800} height={300} priority className="h-auto w-[142px] grayscale contrast-125 sm:w-[190px]" />
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm font-semibold text-white/62 md:flex">
            {navItems.map((item) => (
              item.children ? (
                <div key={item.href} className="group relative py-5">
                  <Link href={item.href} className="inline-flex items-center gap-1 transition hover:text-white">
                    {item.label}
                    <Icon name="arrow-right" className="h-3 w-3 rotate-90 transition-transform group-hover:translate-y-0.5" />
                  </Link>
                  <div className="invisible absolute left-1/2 top-full w-64 -translate-x-1/2 translate-y-2 rounded-lg border border-[var(--gold-600)]/25 bg-[var(--ink-900)] p-2 opacity-0 shadow-[0_24px_70px_rgba(0,0,0,.34)] transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href} className="block rounded-md px-3 py-3 transition hover:bg-white/8 hover:text-white">
                        <span className="block text-sm font-bold text-white">{child.label}</span>
                        <span className="mt-0.5 block text-xs font-medium text-white/48">{child.copy}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link key={item.href} href={item.href} className="transition hover:text-white">
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a href={loginUrl} className="text-sm font-semibold text-white/70 hover:text-white">Login</a>
            <a href={registerUrl} className="inline-flex min-h-10 items-center rounded-md bg-[var(--gold-600)] px-4 text-sm font-bold text-[var(--ink-600)] shadow-sm transition hover:bg-[var(--gold-500)] hover:text-[var(--ink-600)]">Start 30-day trial</a>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <a href={registerUrl} className="inline-flex min-h-10 items-center rounded-md bg-[var(--gold-600)] px-3 text-xs font-bold text-[var(--ink-600)] shadow-sm">
              Start trial
            </a>
            <button
              type="button"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((open) => !open)}
              className="grid min-h-10 min-w-10 place-items-center rounded-lg border border-white/15 bg-white/5 text-white"
            >
              <Icon name={menuOpen ? "x" : "menu"} className="h-5 w-5" />
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div id="mobile-navigation" className="border-t border-white/10 pb-4 md:hidden">
            <nav aria-label="Mobile navigation" className="grid grid-cols-2 gap-1 py-3">
              {navItems.map((item) => (
                item.children ? (
                  <div key={item.href} className="grid gap-1">
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-white/76 transition hover:bg-white/8 hover:text-white"
                    >
                      {item.label}
                    </Link>
                    {item.children.slice(1).map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex min-h-10 items-center rounded-lg px-3 text-xs font-bold text-[#ff8af1] transition hover:bg-white/8 hover:text-white"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-white/76 transition hover:bg-white/8 hover:text-white"
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </nav>
            <a href={loginUrl} className="flex min-h-11 items-center justify-center rounded-lg border border-white/15 text-sm font-bold text-white">
              Login to AiFrogi
            </a>
          </div>
        ) : null}
      </div>
    </header>
  );
}

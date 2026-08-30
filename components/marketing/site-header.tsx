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
    label: "AI Bot",
    href: "/solutions",
    children: [
      { label: "All AI Bots", href: "/solutions", copy: "Choose intelligence by business outcome" },
      { label: "HotelGPT", href: "/solutions/hotelgpt", copy: "Hospitality and guest intelligence" },
      { label: "ClinicGPT", href: "/solutions/clinicgpt", copy: "Appointments and confirmations" },
      { label: "DineGPT", href: "/solutions/dinegpt", copy: "Dining and reservation intelligence" },
      { label: "eduGPT", href: "/solutions/edugpt", copy: "Admissions and student enquiry intelligence" },
      { label: "PropertyGPT", href: "/solutions/propertygpt", copy: "Discovery, qualification and visits" },
      { label: "BusinessGPT", href: "/solutions/businessgpt", copy: "Services, leads and support" },
      { label: "FlowCart", href: "/solutions/flowcart", copy: "Commerce, orders and payments" },
      { label: "Custom Business Bot", href: "/solutions/custom-business-bot", copy: "A governed workflow built for you" }
    ]
  },
  { label: "WhatsApp API", href: "/whatsapp-api" },
  { label: "How to Install", href: "/install-ai-bot" },
  { label: "Pricing", href: "/pricing" }
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [botsOpen, setBotsOpen] = useState(false);

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
                  <div className="invisible absolute left-1/2 top-full grid w-[560px] -translate-x-1/2 translate-y-2 grid-cols-2 rounded-lg border border-[var(--gold-600)]/25 bg-[var(--ink-900)] p-2 opacity-0 shadow-[0_24px_70px_rgba(0,0,0,.34)] transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
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
          <div id="mobile-navigation" className="-mx-4 border-t border-white/10 bg-[var(--ink-950)] px-4 pb-5 shadow-[0_20px_45px_rgba(0,0,0,.45)] sm:-mx-8 sm:px-8 md:hidden">
            <nav aria-label="Mobile navigation" className="grid grid-cols-1 py-3">
              {navItems.map((item) => (
                item.children ? (
                  <div key={item.href} className="border-b border-white/8">
                    <div className="flex min-h-14 items-center justify-between">
                      <Link href={item.href} onClick={() => setMenuOpen(false)} className="flex flex-1 items-center px-2 text-base font-semibold text-white">{item.label}</Link>
                      <button type="button" onClick={() => setBotsOpen((open) => !open)} aria-expanded={botsOpen} className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/5 text-[var(--gold-300)]" aria-label={botsOpen ? "Collapse AI Bot menu" : "Expand AI Bot menu"}>
                        <Icon name="arrow-right" className={`h-4 w-4 rotate-90 transition-transform ${botsOpen ? "rotate-[270deg]" : ""}`} />
                      </button>
                    </div>
                    {botsOpen ? <div className="grid gap-1 border-t border-white/8 py-2 pl-3">
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-semibold text-[var(--gold-100)] transition hover:bg-white/8 hover:text-white">
                          <span className="block">{child.label}</span>
                          <small className="mt-0.5 block text-xs font-normal leading-5 text-white/45">{child.copy}</small>
                        </Link>
                      ))}
                    </div> : null}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-14 items-center border-b border-white/8 px-2 text-base font-semibold text-white/82 transition hover:bg-white/8 hover:text-white"
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

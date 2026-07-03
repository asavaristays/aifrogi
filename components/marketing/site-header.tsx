import Image from "next/image";
import Link from "next/link";

const loginUrl = "https://app.aifrogi.com/login";
const registerUrl = "https://app.aifrogi.com/register";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Solutions", href: "/solutions" },
  { label: "Onboarding", href: "/onboarding-process" },
  { label: "Integration", href: "/integration" },
  { label: "Resources", href: "/resources" },
  { label: "Pricing", href: "/pricing" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#251f2d]/92 px-5 text-white backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex min-h-[68px] max-w-7xl flex-wrap items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center" aria-label="AiFrogi home">
          <Image src="/brand/aifrogi-logo-transparent.png" alt="AiFrogi" width={800} height={300} priority className="h-auto w-[142px] sm:w-[158px]" />
        </Link>

        <nav aria-label="Main navigation" className="order-3 flex w-full gap-4 overflow-x-auto text-sm font-semibold text-white/62 [scrollbar-width:none] md:order-2 md:w-auto md:gap-6 [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="order-2 flex items-center gap-3 md:order-3">
          <a href={loginUrl} className="hidden text-sm font-semibold text-white/70 hover:text-white sm:inline-flex">Login</a>
          <a href={registerUrl} className="inline-flex min-h-10 items-center rounded-lg bg-[#d92bcb] px-4 text-sm font-bold text-white shadow-[0_0_28px_rgba(217,43,203,.22)] transition hover:bg-[#e33bd4]">Start free trial</a>
        </div>
      </div>
    </header>
  );
}


import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#eee6f0] bg-white px-5 py-10 text-[#2c243b] sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Image src="/brand/aifrogi-logo.png" alt="AiFrogi" width={800} height={300} className="h-auto w-[160px]" />
          <p className="mt-1 text-xs text-[#756b80]">WhatsApp messaging, automation, and human operations.</p>
        </div>
        <div className="flex flex-wrap gap-5 text-xs font-semibold text-[#655b70]">
          <Link href="/solutions">Solutions</Link>
          <Link href="/onboarding-process">Onboarding</Link>
          <Link href="/integration">Integration</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/pricing">Pricing</Link>
        </div>
      </div>
    </footer>
  );
}

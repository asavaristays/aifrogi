import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#251f2d] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.25fr_.8fr_.8fr_1.25fr]">
        <div>
          <Image src="/brand/aifrogi-logo-transparent.png" alt="AiFrogi" width={800} height={300} className="h-auto w-[165px]" />
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/55">WhatsApp automation, customer conversations, and human operations in one workspace.</p>
        </div>

        <nav aria-label="Footer product menu" className="space-y-3 text-sm font-semibold text-white/62">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#ff8af1]">Menu</p>
          <Link className="block hover:text-white" href="/solutions">Solutions</Link>
          <Link className="block hover:text-white" href="/onboarding-process">Onboarding</Link>
          <Link className="block hover:text-white" href="/integration">Integration</Link>
          <Link className="block hover:text-white" href="/resources">Resources</Link>
          <Link className="block hover:text-white" href="/pricing">Pricing</Link>
        </nav>

        <nav aria-label="Footer legal menu" className="space-y-3 text-sm font-semibold text-white/62">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#ff8af1]">Trust</p>
          <Link className="block hover:text-white" href="/privacy-policy">Privacy policy</Link>
          <Link className="block hover:text-white" href="/terms-of-service">Terms of service</Link>
          <Link className="block hover:text-white" href="/security">Data security</Link>
          <Link className="block hover:text-white" href="/data-deletion">Data deletion</Link>
        </nav>

        <address className="not-italic">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#ff8af1]">Contact</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-white/62">
            <p>H.No 746 - TF, New Wada, Morjim, Goa 403512, India</p>
            <p><a className="hover:text-white" href="tel:+917410582898">+91-7410582898</a></p>
            <p><a className="hover:text-white" href="mailto:info@aifrogi.com">info@aifrogi.com</a></p>
          </div>
        </address>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/38 sm:flex-row sm:items-center sm:justify-between">
        <p>© AiFrogi. Operated by webtechnosys.</p>
        <a href="https://website.hotelradar.in" className="font-semibold hover:text-white" target="_blank" rel="noreferrer">Reference business profile</a>
      </div>
    </footer>
  );
}

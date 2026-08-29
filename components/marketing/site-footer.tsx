import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#101010] px-5 py-12 font-normal text-white sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.25fr_.8fr_.8fr_1.25fr]">
        <div>
          <Image src="/brand/aifrogi-logo-transparent.png" alt="AiFrogi" width={800} height={300} className="h-auto w-[165px] grayscale contrast-125" />
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/55">Sovereign business intelligence, customer conversations, and human operations in one workspace.</p>
        </div>

        <nav aria-label="Footer product menu" className="space-y-3 text-sm font-normal text-white/62">
          <p className="text-[10px] font-normal uppercase tracking-[.16em] text-[#e2c66d]">Menu</p>
          <Link className="block hover:text-white" href="/solutions">AI Bot</Link>
          <Link className="block hover:text-white" href="/whatsapp-api">WhatsApp API</Link>
          <Link className="block hover:text-white" href="/integration">Integration</Link>
          <Link className="block hover:text-white" href="/resources">Resources</Link>
          <Link className="block hover:text-white" href="/pricing">Pricing</Link>
        </nav>

        <nav aria-label="Footer legal menu" className="space-y-3 text-sm font-normal text-white/62">
          <p className="text-[10px] font-normal uppercase tracking-[.16em] text-[#e2c66d]">Trust</p>
          <Link className="block hover:text-white" href="/about">About AiFrogi</Link>
          <Link className="block hover:text-white" href="/status">Service status</Link>
          <Link className="block hover:text-white" href="/privacy-policy">Privacy policy</Link>
          <Link className="block hover:text-white" href="/terms-of-service">Terms of service</Link>
          <Link className="block hover:text-white" href="/security">Data security</Link>
          <Link className="block hover:text-white" href="/data-deletion">Data deletion</Link>
        </nav>

        <address className="not-italic">
          <p className="text-[10px] font-normal uppercase tracking-[.16em] text-[#e2c66d]">Contact</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-white/62">
            <p>H.No 746 - TF, New Wada, Morjim, Goa 403512, India</p>
            <p><a className="hover:text-white" href="mailto:info@aifrogi.com"><span>info</span><span aria-hidden="true">@</span><span className="sr-only"> at </span><span>aifrogi.com</span></a></p>
          </div>
          <a href="tel:+917410582898" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#8a6a16] px-4 text-sm font-normal text-white shadow-[0_0_26px_rgba(138,106,22,.22)] transition hover:-translate-y-0.5 hover:bg-[#b28728]">
            Call +91-7410582898
          </a>
        </address>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/38 sm:flex-row sm:items-center sm:justify-between">
        <p>© AiFrogi. Operated by <a href="https://webtechnosys.com" className="font-normal hover:text-white" target="_blank" rel="noreferrer">webtechnosys</a>.</p>
        <Link href="/about" className="font-normal hover:text-white">Company and platform details</Link>
      </div>
    </footer>
  );
}

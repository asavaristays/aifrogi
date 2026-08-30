import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "AI Business Bot Product Tour | AiFrogi",
  description: "See how AiFrogi combines intelligent customer conversations, approved knowledge, workflow automation, analytics, human support, and channels such as WhatsApp in one workspace.",
  path: "/product-tour"
});

export default function ProductTourPage() {
  return <main className="min-h-screen bg-[#211a2b] text-white">
    <SiteHeader />
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16"><div className="max-w-3xl"><p className="text-sm font-semibold text-[#e2c66d]">Product tour</p><h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">Know what needs attention. Act with confidence.</h1><p className="mt-5 text-base leading-7 text-white/68">A short tour of AiFrogi’s operating loop: connect WhatsApp, own every conversation, send compliant campaigns, govern AI knowledge, and keep humans in control.</p></div><div className="mt-9 overflow-hidden rounded-lg border border-white/12 bg-black shadow-2xl"><video className="aspect-video w-full" controls preload="metadata" poster="/media/product-video/screens/dashboard.jpg"><source src="/media/product-video/aifrogi-product-tour.mp4" type="video/mp4"/><track default kind="captions" src="/media/product-video/aifrogi-product-tour.en.vtt" srcLang="en" label="English"/>Your browser does not support the video. <a href="/media/product-video/aifrogi-product-tour.mp4">Open the product tour</a>.</video></div><div className="mt-8 flex flex-wrap gap-3"><a href="https://app.aifrogi.com/register" className="inline-flex min-h-11 items-center rounded-md bg-[#8a6a16] px-5 text-sm font-semibold text-white hover:bg-[#b28728]">Start 15-day trial</a><Link href="/help/connect-whatsapp" className="inline-flex min-h-11 items-center rounded-md border border-white/18 px-5 text-sm font-semibold hover:bg-white/8">Read the setup guide</Link></div></section>
    <SiteFooter />
  </main>;
}

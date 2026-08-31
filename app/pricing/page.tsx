import type { Metadata } from "next";
import { AiBotPricing } from "@/components/marketing/ai-bot-pricing";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "AI Bot Pricing | AiFrogi",
  description: "Start an AiFrogi AI Business Bot with a 15-day free trial. Compare monthly, yearly, enterprise and connector pricing.",
  path: "/pricing"
});

export default function PricingPage() {
  return <main className="bg-white text-[#101010]"><SiteHeader /><AiBotPricing /><SiteFooter /></main>;
}

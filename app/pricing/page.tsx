import type { Metadata } from "next";
import { PricingCurrencyProvider } from "@/components/marketing/pricing-currency";
import { AiBotPricing } from "@/components/marketing/ai-bot-pricing";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "AI Bot Pricing | AiFrogi",
  description: "Start with a 15-day free trial and 200 credits. Starter costs ₹14,500/year with 4,000 credits/month; HotelGPT costs ₹16,500/year with 5,000 credits/month. Compare annual plans and optional add-ons.",
  path: "/pricing"
});

export default function PricingPage() {
  return <main className="bg-white text-[#101010]"><SiteHeader /><PricingCurrencyProvider><AiBotPricing /></PricingCurrencyProvider><SiteFooter /></main>;
}

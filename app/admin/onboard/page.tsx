import Link from "next/link";
import { AdminOnboardClient } from "@/components/admin/admin-onboard-client";

export const dynamic = "force-dynamic";

export default function AdminOnboardPage() {
  return <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-8 lg:px-10 lg:py-10"><header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="product-eyebrow">Guided pilot launch</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Onboard a client.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-[#68645c]">Choose the bot, create the owner workspace and send secure activation. Then continue through the separate AI Bot onboarding track.</p></div><Link href="/admin/customers" className="text-sm font-bold text-[#6d5310]">View customer queue →</Link></header><AdminOnboardClient /></main>;
}

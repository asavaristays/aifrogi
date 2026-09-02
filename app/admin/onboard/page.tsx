import Link from "next/link";
import { AdminOnboardClient } from "@/components/admin/admin-onboard-client";

export const dynamic = "force-dynamic";

export default function AdminOnboardPage() {
  return <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="product-eyebrow">Two controlled entry paths</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Onboard an AI Bot client.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-[#68645c]">The customer can begin independently, or AiFrogi can create the workspace for them. Both paths enter the same approval, intelligence and installation gates.</p></div><Link href="/admin/customers" className="text-sm font-bold text-[#6d5310]">View customer queue →</Link></header>
    <section className="mb-8 grid overflow-hidden border border-white/70 bg-white lg:grid-cols-2">
      <div className="border-b border-black/6 p-6 sm:p-8 lg:border-b-0 lg:border-r"><p className="product-eyebrow">Option 1 · Self-serve</p><h2 className="mt-3 text-2xl font-semibold">Customer creates the workspace.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#68645c]">Share the secure registration link. The owner selects a bot, verifies email, supplies business information and submits intelligence for approval.</p><div className="mt-6 flex flex-wrap gap-3"><a href="https://app.aifrogi.com/register?source=super-admin-self-serve" target="_blank" rel="noreferrer" className="rounded-full bg-[#101010] px-5 py-3 text-sm font-bold text-white">Open self-serve registration</a><Link href="/admin/customers" className="rounded-full border border-black/10 px-5 py-3 text-sm font-bold">Monitor submissions</Link></div></div>
      <div className="bg-[#f4efe3] p-6 sm:p-8"><p className="product-eyebrow">Option 2 · Admin-assisted</p><h2 className="mt-3 text-2xl font-semibold">AiFrogi creates it with the client.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#68645c]">Use the form below when a pilot needs guided setup. The owner still receives secure activation and retains approval responsibility.</p><p className="mt-6 text-xs font-bold uppercase tracking-[.13em] text-[#6d5310]">Continue below ↓</p></div>
    </section>
    <AdminOnboardClient />
  </main>;
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-12">
    <section className="w-full max-w-xl rounded-lg border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-card)]">
      <span className="status-pill status-warning">Dashboard unavailable</span>
      <h1 className="mt-5 text-2xl font-semibold">We could not load today&apos;s operations.</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Your AI Bot and captured conversations continue independently. Retry the dashboard first; if the problem remains, open a support request and AiFrogi will attach your account context.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Button onClick={reset}>Retry dashboard</Button><Link href="/support" className="inline-flex min-h-10 items-center rounded-md border border-black/8 px-4 text-sm font-semibold">Open support</Link></div>
    </section>
  </main>;
}

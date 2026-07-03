import Link from "next/link";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-12"><section className="w-full max-w-xl rounded-lg border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-card)]"><p className="text-sm font-semibold text-[var(--primary-strong)]">Page not found</p><h1 className="mt-4 text-3xl font-semibold">This path does not lead anywhere yet.</h1><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Return to AiFrogi or use the Help Center to find the workflow you need.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/" className="inline-flex min-h-10 items-center rounded-md bg-[var(--primary-strong)] px-4 text-sm font-semibold text-white">AiFrogi home</Link><Link href="/help" className="inline-flex min-h-10 items-center rounded-md border border-[var(--border)] px-4 text-sm font-semibold">Help Center</Link></div></section></main>;
}

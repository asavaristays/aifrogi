"use client";

export function DataAccessFailure({ reset, admin = false }: { reset: () => void; admin?: boolean }) {
  return <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
    <section className="rounded-2xl border border-[#e7bb70] bg-[#fff6e7] p-7">
      <p className="product-eyebrow">{admin ? "Super Admin data protection" : "Workspace data protection"}</p>
      <h1 className="mt-3 text-2xl font-semibold">Data could not be loaded safely.</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">The request was stopped instead of showing an incorrect zero or blank page. Refresh once; if it continues, contact AiFrogi support.</p>
      <button type="button" onClick={reset} className="mt-6 rounded-full bg-[#101010] px-5 py-2.5 text-sm font-bold text-white">Try again</button>
    </section>
  </main>;
}

export default function DashboardLoading() {
  return <div className="min-h-screen animate-pulse bg-[var(--background)]">
    <header className="h-[73px] border-b border-[var(--border)] bg-white" />
    <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-8">
      <div className="border-b border-[var(--border)] pb-6">
        <div className="h-3 w-36 rounded bg-[#ded8cb]" />
        <div className="mt-3 h-7 max-w-sm rounded bg-[#ded8cb]" />
        <div className="mt-2 h-4 max-w-xl rounded bg-[#ded8cb]" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1,2,3,4].map((item) => <div key={item} className="h-32 rounded-lg border border-[var(--border)] bg-white" />)}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5"><div className="h-64 rounded-lg border border-[var(--border)] bg-white" /><div className="h-72 rounded-lg border border-[var(--border)] bg-white" /></div>
        <div className="h-[440px] rounded-lg border border-[var(--border)] bg-white" />
      </div>
    </main>
  </div>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <header className="border-b border-black bg-[var(--ink-950)] px-5 py-4 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-lg font-bold">AiFrogi Control</p>
            <p className="mt-1 text-xs text-[var(--gold-300)]">Sovereign customer operations and platform health</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap items-center gap-1 text-sm font-bold sm:gap-2">
              <Link className="rounded-md px-3 py-2 hover:bg-[var(--gold-600)]/30 hover:text-[var(--gold-100)]" href="/admin">Overview</Link>
              <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/admin/customers">Customers</Link>
              <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/admin/appointments">Appointments</Link>
              <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/admin/demo-sandboxes">Bot Demos</Link>
              <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/admin/billing">Billing</Link>
              <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/admin/knowledge">Knowledge</Link>
              <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/admin/sovereign-intelligence">Sovereign AI</Link>
              <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/admin/support">Support</Link>
              <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/admin/audit">Audit</Link>
            </nav>
            <AdminLogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

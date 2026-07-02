import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-[#14241f]">
      <header className="border-b border-black/5 bg-[#2c243b] px-5 py-4 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
          <div>
            <p className="text-lg font-bold">AiFrogi Control</p>
            <p className="mt-1 text-xs text-white/65">Customer operations and platform health</p>
          </div>
          <nav className="flex items-center gap-2 text-sm font-bold">
            <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/admin">Overview</Link>
            <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/admin/customers">Customers</Link>
            <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/admin/knowledge">Knowledge</Link>
            <Link className="rounded-md px-3 py-2 hover:bg-white/10" href="/admin/support">Support</Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

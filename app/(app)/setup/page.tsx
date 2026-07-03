import { TopBar } from "@/components/layout/top-bar";
import { ProductFlowCenter } from "@/components/setup/product-flow-center";
import { getCurrentUser } from "@/lib/auth-server";
import { loadMemberProductFlow } from "@/lib/product-flow";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SetupPage() {
  const user = await getCurrentUser();
  const flow = user ? await loadMemberProductFlow(user.username) : null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <TopBar title="Operating flow" subtitle="One view of what is complete, what is blocked, and who acts next" />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {flow ? <ProductFlowCenter flow={flow} /> : <section className="rounded-lg border border-[var(--border)] bg-white p-6"><h2 className="text-xl font-semibold">Flow unavailable</h2><p className="mt-2 text-sm text-[var(--text-muted)]">AiFrogi could not locate an active organization for this account.</p></section>}
      </div>
    </div>
  );
}

"use client";

import { SideNav } from "@/components/layout/side-nav";
import { useAppState } from "@/components/providers/app-state-provider";
import type { WorkspaceOption } from "@/components/layout/workspace-switcher";
import type { ClientAccessRole } from "@/lib/client-access";

export function AppShell({
  children,
  workspaces,
  currentWorkspaceSlug,
  accessRole,
  subscriptionAccess
}: {
  children: React.ReactNode;
  workspaces: WorkspaceOption[];
  currentWorkspaceSlug: string;
  accessRole: ClientAccessRole;
  subscriptionAccess?: { planCode: string; status: string; daysLeft: number | null; paused: boolean; message: string } | null;
}) {
  useAppState();

  return (
    <div className="min-h-screen bg-transparent">
      <SideNav tone="light" workspaces={workspaces} currentWorkspaceSlug={currentWorkspaceSlug} accessRole={accessRole} />
      <main className="min-h-screen lg:pl-[236px]">
        {subscriptionAccess?.paused ? <div className="border-b border-[#e8c07b] bg-[#fff6e6] px-5 py-3 text-sm text-[#744714] sm:px-8"><strong>Workspace paused.</strong> {subscriptionAccess.message} <a href="/billing" className="ml-1 font-bold underline underline-offset-2">Choose a plan</a></div> : subscriptionAccess?.planCode === "TRIAL" && (subscriptionAccess.daysLeft ?? 99) <= 7 ? <div className="border-b border-[#eadfed] bg-[#fbf1fa] px-5 py-3 text-sm text-[#702069] sm:px-8"><strong>{subscriptionAccess.daysLeft} trial day{subscriptionAccess.daysLeft === 1 ? "" : "s"} left.</strong> After the 30-day trial, paid actions pause automatically. <a href="/billing" className="ml-1 font-bold underline underline-offset-2">View plans</a></div> : null}
        {children}
      </main>
    </div>
  );
}

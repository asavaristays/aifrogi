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
  subscriptionAccess,
  enabledChannels = []
}: {
  children: React.ReactNode;
  workspaces: WorkspaceOption[];
  currentWorkspaceSlug: string;
  accessRole: ClientAccessRole;
  enabledChannels?: string[];
  subscriptionAccess?: { planCode: string; status: string; daysLeft: number | null; paused: boolean; message: string } | null;
}) {
  const { sidebarCollapsed } = useAppState();
  const selectedWorkspace = workspaces.find((workspace) => workspace.slug === currentWorkspaceSlug);
  const botStatus = selectedWorkspace?.status || "NOT_CONFIGURED";
  const awaitingApproval = botStatus === "REVIEW_PENDING";
  const privateSetup = botStatus !== "LIVE";

  return (
    <div className="min-h-screen bg-transparent">
      <SideNav tone="light" workspaces={workspaces} currentWorkspaceSlug={currentWorkspaceSlug} accessRole={accessRole} enabledChannels={enabledChannels} />
      <main className={`min-h-screen transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[236px]"}`}>
        {privateSetup ? <div role="status" className="border-b border-[#d7c27d] bg-[#fff9e8] px-5 py-3 text-sm text-[#654f16] sm:px-8"><strong>{awaitingApproval ? "Awaiting Super Admin approval." : "Private setup workspace."}</strong> {awaitingApproval ? "Your bot cannot answer customers yet. AiFrogi will email you after approval." : "You may prepare and update information here, but customers cannot access or use this bot until it is submitted and approved by AiFrogi Super Admin."}</div> : null}
        {subscriptionAccess?.paused ? <div className="border-b border-[#e8c07b] bg-[#fff6e6] px-5 py-3 text-sm text-[#744714] sm:px-8"><strong>Workspace paused.</strong> {subscriptionAccess.message} <a href="/billing" className="ml-1 font-bold underline underline-offset-2">Choose a plan</a></div> : subscriptionAccess?.planCode === "TRIAL" && (subscriptionAccess.daysLeft ?? 99) <= 7 ? <div className="border-b border-[var(--gold-300)] bg-[var(--primary-soft)] px-5 py-3 text-sm text-[var(--gold-700)] sm:px-8"><strong>{subscriptionAccess.daysLeft} trial day{subscriptionAccess.daysLeft === 1 ? "" : "s"} left.</strong> After the 15-day trial, paid actions pause automatically. <a href="/billing" className="ml-1 font-bold underline underline-offset-2">View plans</a></div> : null}
        {children}
      </main>
    </div>
  );
}

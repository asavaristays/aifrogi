"use client";

import { SideNav } from "@/components/layout/side-nav";
import { useAppState } from "@/components/providers/app-state-provider";
import type { WorkspaceOption } from "@/components/layout/workspace-switcher";
import type { ClientAccessRole } from "@/lib/client-access";

export function AppShell({
  children,
  workspaces,
  currentWorkspaceSlug,
  accessRole
}: {
  children: React.ReactNode;
  workspaces: WorkspaceOption[];
  currentWorkspaceSlug: string;
  accessRole: ClientAccessRole;
}) {
  useAppState();

  return (
    <div className="min-h-screen bg-transparent">
      <SideNav tone="light" workspaces={workspaces} currentWorkspaceSlug={currentWorkspaceSlug} accessRole={accessRole} />
      <main className="min-h-screen lg:pl-[236px]">
        {children}
      </main>
    </div>
  );
}

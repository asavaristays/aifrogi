"use client";

import { SideNav } from "@/components/layout/side-nav";
import { useAppState } from "@/components/providers/app-state-provider";
import type { WorkspaceOption } from "@/components/layout/workspace-switcher";

export function AppShell({
  children,
  workspaces,
  currentWorkspaceSlug
}: {
  children: React.ReactNode;
  workspaces: WorkspaceOption[];
  currentWorkspaceSlug: string;
}) {
  useAppState();

  return (
    <div className="min-h-screen bg-transparent">
      <SideNav tone="light" workspaces={workspaces} currentWorkspaceSlug={currentWorkspaceSlug} />
      <main className="min-h-screen lg:pl-[236px]">
        {children}
      </main>
    </div>
  );
}

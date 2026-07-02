"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type WorkspaceOption = {
  id: string;
  name: string;
  slug: string;
  status: string;
  displayPhoneNumber: string;
};

export function WorkspaceSwitcher({
  workspaces,
  currentSlug
}: {
  workspaces: WorkspaceOption[];
  currentSlug: string;
}) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  async function selectWorkspace(slug: string) {
    setSwitching(true);
    const response = await fetch("/api/workspaces/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug })
    });
    setSwitching(false);
    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <label className="mt-4 block">
      <span className="text-[11px] font-semibold text-[var(--text-muted)]">Workspace</span>
      <select
        aria-label="Client workspace"
        value={currentSlug}
        disabled={switching}
        onChange={(event) => selectWorkspace(event.target.value)}
        className="mt-1.5 w-full rounded-md border border-[var(--border)] bg-[#faf9fb] px-3 py-2.5 text-xs font-semibold text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:bg-white"
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.slug}>
            {workspace.name}{workspace.status === "CONNECTED" ? " · Connected" : " · Setup"}
          </option>
        ))}
      </select>
    </label>
  );
}

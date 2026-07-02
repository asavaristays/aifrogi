import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SettingsUsersPage() {
  return (
    <>
      <TopBar title="Users & Roles" subtitle="Manage hotel-side access with role-based controls and least-privilege access." />
      <div className="space-y-8 px-5 py-6 sm:px-8">
        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">Role Model</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Users are configured from the hotel’s real saved login and role assignments. Add actual team members
                here once the workspace is ready for live access.
              </p>
            </div>
            <Button>Invite User</Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="rounded-[24px] border border-dashed border-black/10 bg-[var(--surface-soft)] p-6">
            <h3 className="text-lg font-extrabold">No team members configured yet</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              Add real hotel staff after login, then assign roles based on who should manage lead replies, settings,
              and read-only reporting.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}

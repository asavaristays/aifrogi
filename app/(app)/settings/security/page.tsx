import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import { SessionManager } from "@/components/settings/session-manager";

export default function SettingsSecurityPage() {
  return (
    <>
      <TopBar
        title="Security"
        subtitle="Protect guest-related lead data with approvals, scoped access, and secure handling of hotel assets and integrations."
      />
      <div className="space-y-8 px-5 py-6 sm:px-8">
        <Card className="p-6">
          <h2 className="text-xl font-extrabold">Security Principle</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            AiFrogi should never feel like it silently pulls sensitive information. Every system connection must be
            explicit, permissioned, and role-controlled. That is the trust foundation for hotels.
          </p>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-extrabold">Tenant Isolation</h3>
            <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
              Each hotel workspace is logically isolated and protected from cross-tenant access.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-extrabold">Integration Approval</h3>
            <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
              Owner approval is required before WhatsApp, email, AI bot, or call capture sources are activated.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-extrabold">Role-Based Access</h3>
            <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
              Only configured roles can change integrations, security settings, or sensitive assets.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-extrabold">Audit Readiness</h3>
            <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
              Platform actions and customer-approved support access are recorded for operator accountability.
            </p>
          </Card>
        </div>
        <Card className="p-6"><h2 className="text-xl font-extrabold">Active sessions</h2><p className="mt-2 mb-5 text-sm leading-6 text-[var(--text-muted)]">Review signed-in devices and revoke access that you no longer recognize.</p><SessionManager /></Card>
      </div>
    </>
  );
}

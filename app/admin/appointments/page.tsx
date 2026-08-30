import Link from "next/link";
import { AppointmentJourneyAdminControl } from "@/components/admin/appointment-journey-admin-control";
import { Badge } from "@/components/ui/badge";
import { getAppointmentJourneyAdminWorkspaces } from "@/lib/appointment-journey-service";
import { listRecommendedAppointmentTemplates } from "@/lib/appointment-journey-templates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAppointmentsPage() {
  const workspaces = await getAppointmentJourneyAdminWorkspaces();
  const templates = listRecommendedAppointmentTemplates();
  const enabled = workspaces.filter((workspace) => workspace.appointmentStatus !== "DISABLED").length;
  const live = workspaces.filter((workspace) => workspace.googleReady).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6a16]">Super Admin</p>
          <h1 className="mt-2 text-3xl font-black">Appointment Journey</h1>
          <p className="mt-2 text-sm text-[#68645c]">Control product access for every connected WhatsApp workspace.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/pingbook-demo" className="inline-flex min-h-9 items-center rounded-md bg-[#101010] px-4 text-sm font-black text-white hover:bg-[#2b2b2b]">
            Open ClinicGPT Demo
          </Link>
          <Badge tone="primary">{enabled} enabled</Badge>
          <Badge tone="secondary">{live} live</Badge>
        </div>
      </div>
      <div className="mt-7">
        <AppointmentJourneyAdminControl workspaces={workspaces} />
      </div>
      <section className="mt-7 rounded-lg border border-black/6 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="product-eyebrow">Meta templates</p>
            <h2 className="mt-2 text-lg font-black">Recommended appointment template pack</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#68645c]">
              Submit these Utility templates inside each client WhatsApp Business Account before production reminders, payments, reschedules, and review follow-ups. Inbound booking replies inside the 24-hour customer-service window can run without templates.
            </p>
          </div>
          <Badge tone="primary">{templates.length} ready for submission</Badge>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#f7f9f8] text-xs text-[#68645c]">
              <tr>
                <th className="px-4 py-3">Template</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Use</th>
                <th className="px-4 py-3">Variables</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6">
              {templates.map((template) => (
                <tr key={template.name}>
                  <td className="px-4 py-4 align-top">
                    <strong className="block text-sm">{template.label}</strong>
                    <code className="mt-1 block text-xs text-[#68645c]">{template.name}</code>
                  </td>
                  <td className="px-4 py-4 align-top"><Badge tone="secondary">{template.category}</Badge></td>
                  <td className="max-w-md px-4 py-4 align-top text-[#68645c]">{template.useWhen}</td>
                  <td className="px-4 py-4 align-top text-xs text-[#68645c]">{template.variables.map((item) => item.name).join(", ") || "None"}</td>
                  <td className="px-4 py-4 align-top"><Badge tone="neutral">{template.status.replaceAll("_", " ")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

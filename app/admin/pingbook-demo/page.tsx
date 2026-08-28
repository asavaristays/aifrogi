import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEMO_SLUG = "pingbook-demo-clinic";

function formatInr(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata"
  }).format(value);
}

function policyValue(workingHours: unknown, key: string, fallback: string) {
  if (!workingHours || typeof workingHours !== "object" || Array.isArray(workingHours)) return fallback;
  const policy = (workingHours as Record<string, unknown>).policy;
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) return fallback;
  const value = (policy as Record<string, unknown>)[key];
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

export default async function AdminPingBookDemoPage() {
  const db = getDb();
  const organization = await db?.organization.findUnique({
    where: { slug: DEMO_SLUG },
    include: {
      subscription: { include: { plan: true } },
      onboarding: true,
      properties: {
        include: {
          appointmentTenants: {
            include: {
              services: { orderBy: { sortOrder: "asc" } },
              bookings: {
                orderBy: { createdAt: "desc" },
                take: 5,
                include: { service: true, payments: true }
              },
              sheetSyncStates: true
            }
          }
        }
      }
    }
  });

  const property = organization?.properties.find((item) => item.slug === DEMO_SLUG) || null;
  const tenant = property?.appointmentTenants[0] || null;
  const booking = tenant?.bookings.find((item) => item.status === "CONFIRMED") || tenant?.bookings[0] || null;
  const payment = booking?.payments[0] || null;
  const cancellationCutoff = policyValue(tenant?.workingHours, "cancellationCutoffHours", "2");
  const refundProcessingTime = policyValue(tenant?.workingHours, "refundProcessingTime", "5-7 working days");
  const slotHoldMinutes = policyValue(tenant?.workingHours, "slotHoldMinutes", "10");
  const checks = [
    { label: "PingBook plan", ok: organization?.plan === "PINGBOOK" && organization.subscription?.plan.code === "PINGBOOK" },
    { label: "Clinic onboarding ready", ok: organization?.onboarding?.lifecycleStatus === "DEMO_READY" },
    { label: "Appointment tenant ready", ok: tenant?.status === "DEMO_READY" },
    { label: "Razorpay flow enabled", ok: Boolean(tenant?.razorpayEnabled) },
    { label: "Google sync mapped", ok: Boolean(tenant?.calendarId && tenant?.sheetId) },
    { label: "Paid sample booking", ok: Boolean(booking?.status === "CONFIRMED" && booking.paymentStatus === "PAID") },
    { label: "Review link configured", ok: Boolean(tenant?.reviewLink) }
  ];

  if (!db || !organization || !property || !tenant) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-8">
        <Link href="/admin/appointments" className="text-sm font-black text-[#c725ba]">Back to appointments</Link>
        <section className="mt-6 rounded-lg border border-black/7 bg-white p-8 shadow-sm">
          <p className="product-eyebrow">PingBook Demo</p>
          <h1 className="mt-2 text-3xl font-semibold">Demo workspace is not ready</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            The internal clinic demo was not found in the database. Run the PingBook demo seed on the VPS, then refresh this page.
          </p>
          <code className="mt-5 block rounded-md bg-[#f5f1f6] p-4 text-sm text-[#2c243b]">npm run seed:pingbook-demo</code>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="product-eyebrow">PingBook Demo</p>
          <h1 className="mt-2 text-3xl font-semibold">Clinic sales cockpit</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {organization.name} · {property.city || "Goa"} · {tenant.timezone}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/customers/${organization.id}`} className="inline-flex min-h-10 items-center rounded-md bg-[#2c243b] px-4 text-sm font-black text-white hover:bg-[#3a304d]">
            Open customer
          </Link>
          <Link href="/solutions/pingbook" className="inline-flex min-h-10 items-center rounded-md border border-black/10 bg-white px-4 text-sm font-black text-[#2c243b] hover:bg-[#f8faf9]">
            Public page
          </Link>
          <Link href="/admin/appointments" className="inline-flex min-h-10 items-center rounded-md border border-black/10 bg-white px-4 text-sm font-black text-[#2c243b] hover:bg-[#f8faf9]">
            Appointments
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Plan" value={organization.subscription?.plan.name || organization.plan} helper={`${formatInr((organization.subscription?.plan.amountPaisa || 0) / 100)} quarterly`} />
        <Metric label="Setup" value="Rs. 4,500" helper="Meta, Razorpay, Google onboarding" />
        <Metric label="Refund window" value="15 days" helper={`Processed in ${refundProcessingTime}`} />
        <Metric label="Go-live promise" value="2-3 days" helper="After access is ready" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="overflow-hidden rounded-lg border border-black/7 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/6 px-5 py-4">
            <div>
              <p className="product-eyebrow">Realtime story</p>
              <h2 className="mt-1 text-xl font-semibold">WhatsApp to confirmed booking</h2>
            </div>
            <Badge tone="primary">{tenant.status.replaceAll("_", " ")}</Badge>
          </div>
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-black/6 bg-[#f5f1f6] p-5 lg:border-b-0 lg:border-r">
              <div className="rounded-lg bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-black/6 pb-4">
                  <div>
                    <p className="text-sm font-black">Customer chat</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{booking?.customerName || "Demo patient"}</p>
                  </div>
                  <span className="rounded-full bg-[#e9f7f1] px-3 py-1 text-xs font-black text-[#178665]">Live demo</span>
                </div>
                <div className="mt-5 space-y-3 text-sm leading-6">
                  <p className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[#eef7f2] px-4 py-3">Can I book dental cleaning tomorrow evening?</p>
                  <p className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-[#f7d7f4] px-4 py-3">Yes. 5:30 PM, 6:30 PM, or 7:15 PM is available.</p>
                  <p className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[#eef7f2] px-4 py-3">6:30 works. Please confirm.</p>
                  <p className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-[#f7d7f4] px-4 py-3">Slot held for {slotHoldMinutes} minutes. Pay {formatInr(booking?.service?.priceInr || 500)} to confirm.</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <TimelineItem time="12:05" title="Slot held" body={`${booking?.service?.name || "Dental cleaning"} slot reserved for ${slotHoldMinutes} minutes.`} />
                <TimelineItem time="12:06" title="Confirmation sent" body="Approved WhatsApp template confirms patient, service, and clinic policy." />
                <TimelineItem time="12:07" title="Payment captured" body={`${payment ? formatInr(payment.amountPaisa / 100) : "Booking fee"} marked ${payment?.status || "PAID"} through Razorpay-ready flow.`} />
                <TimelineItem time="Next day" title="Review requested" body="Review request can be sent after the visit while the experience is fresh." />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-black/7 bg-[#2c243b] p-6 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#ff8af1]">Sales script</p>
          <h2 className="mt-2 text-2xl font-semibold">Problem PingBook solves</h2>
          <div className="mt-5 space-y-3">
            {[
              "Reception teams miss WhatsApp appointment requests during busy clinic hours.",
              "Patients ask for slots, payment, cancellation, and reminders in one continuous conversation.",
              "Owners want Calendar, Sheets, payment, and reviews without exposing technical setup."
            ].map((item) => (
              <p key={item} className="rounded-md border border-white/8 bg-white/5 p-4 text-sm leading-6 text-white/72">{item}</p>
            ))}
          </div>
          <div className="mt-6 rounded-md bg-white p-4 text-[#2c243b]">
            <p className="text-xs font-black uppercase text-[#b923ae]">Quote</p>
            <p className="mt-2 text-sm font-bold leading-6">
              One-time setup Rs. 4,500. PingBook Rs. 1,250 per month, billed quarterly. Meta message fees separate as used.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-black/7 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="product-eyebrow">Clinic services</p>
              <h2 className="mt-2 text-xl font-semibold">Bookable treatments</h2>
            </div>
            <Badge tone="secondary">{tenant.services.length} services</Badge>
          </div>
          <div className="mt-5 divide-y divide-black/6">
            {tenant.services.map((service) => (
              <div key={service.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_110px_120px] sm:items-center">
                <strong className="text-sm">{service.name}</strong>
                <span className="text-sm text-[var(--text-muted)]">{service.durationMin} minutes</span>
                <span className="text-sm font-black text-[#178665]">{formatInr(service.priceInr)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-black/7 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="product-eyebrow">Demo booking</p>
              <h2 className="mt-2 text-xl font-semibold">Confirmed patient record</h2>
            </div>
            <Badge tone={booking?.paymentStatus === "PAID" ? "primary" : "neutral"}>{booking?.paymentStatus || "No booking"}</Badge>
          </div>
          {booking ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Detail label="Patient" value={booking.customerName} />
              <Detail label="Phone" value={`+${booking.customerPhone}`} />
              <Detail label="Service" value={booking.service?.name || "Appointment"} />
              <Detail label="Slot" value={formatDateTime(booking.slotStart)} />
              <Detail label="Appointment" value={booking.status} />
              <Detail label="Payment link" value={booking.paymentLinkId || "Not required"} />
            </div>
          ) : (
            <p className="mt-5 text-sm text-[var(--text-muted)]">No sample booking is available.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-black/7 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="product-eyebrow">Readiness</p>
            <h2 className="mt-2 text-xl font-semibold">Demo checks</h2>
          </div>
          <Badge tone={checks.every((item) => item.ok) ? "primary" : "error"}>
            {checks.filter((item) => item.ok).length}/{checks.length} ready
          </Badge>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {checks.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-md border border-black/7 bg-[#fbf8fc] p-4">
              <span className="text-sm font-bold">{item.label}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${item.ok ? "bg-[#e9f7f1] text-[#178665]" : "bg-[#fff2f0] text-[#b23a32]"}`}>
                {item.ok ? "Ready" : "Check"}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-6 text-[var(--text-muted)]">
          Patient cancellation cutoff is {cancellationCutoff} hours before the appointment. Eligible refunds are processed in {refundProcessingTime}.
        </p>
      </section>
    </main>
  );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-lg border border-black/7 bg-white p-5 shadow-sm">
      <p className="product-eyebrow">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-[var(--text-muted)]">{helper}</p>
    </div>
  );
}

function TimelineItem({ time, title, body }: { time: string; title: string; body: string }) {
  return (
    <div className="grid grid-cols-[64px_1fr] gap-4">
      <p className="pt-1 text-xs font-black uppercase text-[var(--text-muted)]">{time}</p>
      <div className="rounded-md border border-black/7 bg-[#fbf8fc] p-4">
        <p className="text-sm font-black">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{body}</p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-black/7 bg-[#fbf8fc] p-4">
      <p className="text-xs font-black uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-bold">{value}</p>
    </div>
  );
}

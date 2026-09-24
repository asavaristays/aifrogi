import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { getCurrentClientAccess } from "@/lib/client-access";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { HotelGuestAccessManager } from "@/components/in-stay/hotel-guest-access-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InStayPage() {
  const [access, propertySlug] = await Promise.all([getCurrentClientAccess(), getCurrentWorkspaceSlug()]);
  if (!access) redirect("/login");
  if (access.organization.botProfile?.category !== "STAY") redirect("/setup");

  const property = access.organization.properties.find((item) => item.slug === propertySlug) || access.organization.properties[0];
  if (!property) redirect("/setup");

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://app.aifrogi.com").replace(/\/$/, "");
  const guestUrl = `${baseUrl}/stay/${encodeURIComponent(property.slug)}`;
  const qrUrl = `/api/hotelgpt-stay/qr?propertySlug=${encodeURIComponent(property.slug)}`;
  const profile = access.organization.botProfile;
  const enabled = profile.status === "LIVE" && profile.channels.includes("WEBSITE");

  return <div className="min-h-screen bg-[var(--background)]">
    <TopBar title="In-stay" subtitle="Guest QR access for HotelGPT" />
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-[#d8c278] bg-[#080808] text-white shadow-[0_24px_70px_rgba(16,16,16,.14)]">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#d9bd63]">HotelGPT · guest access</p>
            <div className="mt-4 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-[-.03em] sm:text-4xl">{property.name} In-stay Assistant</h1><span className={`rounded-full px-3 py-1 text-xs font-bold ${enabled ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-300/15 text-amber-200"}`}>{enabled ? "Enabled" : "Awaiting live website channel"}</span></div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">Guests scan once to open the hotel’s live assistant. It uses the same owner-approved intelligence as the website bot and hands uncertain, sensitive or booking-confirmation requests to hotel staff.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {["Approved hotel information", "Rooms, amenities and policies", "Dining, experiences and transport", "Safe staff handover"].map((item) => <div key={item} className="rounded-xl border border-white/10 bg-white/[.045] px-4 py-3 text-sm text-white/85"><span className="mr-2 text-[#d9bd63]">✓</span>{item}</div>)}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 text-center text-[#111]">
            <Image src={qrUrl} alt={`In-stay QR code for ${property.name}`} width={720} height={720} unoptimized className="mx-auto h-auto w-full max-w-[280px]" />
            <p className="mt-3 text-sm font-bold">Scan to ask the hotel</p>
            <p className="mt-1 text-xs text-black/55">No password or guest data is stored in the QR.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <p className="product-eyebrow">Guest QR kit</p>
          <h2 className="mt-2 text-xl font-semibold">Ready to print and place</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Use the QR at reception, in rooms, guest directories or welcome material.</p>
          <div className="mt-5 break-all rounded-xl bg-[#f5f1e6] p-4 font-mono text-xs text-[#5f4b18]">{guestUrl}</div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={`${qrUrl}&download=1`} className="inline-flex min-h-11 items-center rounded-md bg-[var(--gold-600)] px-5 text-sm font-bold text-white">Download QR code</a>
            <a href={guestUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-md border border-black/15 px-5 text-sm font-bold">Test guest view</a>
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <p className="product-eyebrow">What guests can access</p>
          <h2 className="mt-2 text-xl font-semibold">One governed source of truth</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div><dt className="font-semibold">Hotel</dt><dd className="mt-1 text-[var(--text-muted)]">{access.organization.name}</dd></div>
            <div><dt className="font-semibold">Property</dt><dd className="mt-1 text-[var(--text-muted)]">{property.name}</dd></div>
            <div><dt className="font-semibold">Knowledge</dt><dd className="mt-1 text-[var(--text-muted)]">Only published, owner-approved answers from Intelligence.</dd></div>
            <div><dt className="font-semibold">Live availability and booking</dt><dd className="mt-1 text-[var(--text-muted)]">Shown only after a verified PMS or booking-engine connector responds. Otherwise HotelGPT captures the enquiry or hands over.</dd></div>
            <div><dt className="font-semibold">Privacy</dt><dd className="mt-1 text-[var(--text-muted)]">The QR contains only the public guest URL—never a password, OTP or private hotel credential.</dd></div>
          </dl>
          <Link href="/knowledge" className="mt-5 inline-flex text-sm font-bold text-[var(--primary-strong)]">Review hotel intelligence →</Link>
        </article>
      </section>
      <HotelGuestAccessManager propertySlug={property.slug} canManage={["OWNER", "ADMIN"].includes(access.role)} />
    </div>
  </div>;
}

import Image from "next/image";

export function HotelGptStayDelivery({ slug, propertyName, status, enabled }: { slug: string; propertyName: string; status?: string | null; enabled: boolean }) {
  const live = status === "LIVE" && enabled;
  const stayUrl = `https://app.aifrogi.com/stay/${slug}`;
  const qrUrl = `/api/hotelgpt-stay/qr?propertySlug=${encodeURIComponent(slug)}`;
  return <section id="hotelgpt-stay-access" className="scroll-mt-6 overflow-hidden rounded-2xl border border-[#d7c27d] bg-gradient-to-br from-[#071722] to-[#103447] p-5 text-white shadow-sm sm:p-7">
    <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#e7c66c]">HotelGPT · Front desk delivery</p><h2 className="mt-2 text-2xl font-semibold">In-stay access for {propertyName}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Place this property QR at reception. Scanning opens the stay form; it never grants access. An Owner or Admin must verify and approve the room and checkout time in Team Inbox.</p>
        <ol className="mt-5 grid gap-2 text-sm text-white/85 sm:grid-cols-3"><li className="rounded-xl bg-white/8 p-3"><b>1 · Scan</b><br/>Guest enters stay details.</li><li className="rounded-xl bg-white/8 p-3"><b>2 · Approve</b><br/>Front desk verifies the stay.</li><li className="rounded-xl bg-white/8 p-3"><b>3 · Expire</b><br/>Access ends at checkout.</li></ol>
        {live ? <div className="mt-5 flex flex-wrap gap-3"><a href={stayUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-[#e7c66c] px-4 py-3 text-sm font-bold text-[#10202a]">Open guest journey</a><a href={`${qrUrl}&download=1`} className="rounded-lg border border-white/25 px-4 py-3 text-sm font-bold">Download print QR</a></div> : <p className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100">{enabled ? "QR issuance is locked until knowledge, testing, tenant certification, client submission and Super Admin approval are complete." : "The HotelGPT in-stay module is disabled. Super Admin can enable it in the governed bot profile."}</p>}
      </div>
      {live ? <div className="rounded-2xl bg-white p-3 text-center text-[#071722]"><Image src={qrUrl} alt={`HotelGPT stay access QR for ${propertyName}`} width={220} height={220} unoptimized className="size-[220px]" /><p className="mt-2 text-xs font-bold">Scan for in-stay access</p></div> : <div className="grid size-[180px] place-items-center rounded-2xl border border-dashed border-white/25 bg-white/5 text-center text-sm text-white/55">QR locked<br/>until go-live</div>}
    </div>
    <p className="mt-5 text-xs leading-5 text-white/55">No PMS connection is required. Do not print or distribute the QR before the HotelGPT workspace is live.</p>
  </section>;
}

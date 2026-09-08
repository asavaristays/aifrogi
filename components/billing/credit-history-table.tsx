import { formatMoney } from "@/lib/billing-super-admin";

type CreditEntry = {
  id: string;
  kind: string;
  credits: number;
  amountPaisa: number;
  paymentReference: string | null;
  reason: string | null;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date | null;
};

const date = (value: Date) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(value);

export function CreditHistoryTable({ entries, included, used, extraUsed, remaining }: { entries: CreditEntry[]; included: number; used: number; extraUsed: number; remaining: number }) {
  return <div className="overflow-x-auto border border-black/7 bg-white"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-[#f5f2eb] text-[10px] uppercase tracking-[.12em] text-[#68645c]"><tr><th className="px-5 py-4">Date</th><th className="px-5 py-4">Activity</th><th className="px-5 py-4">Credits / usage</th><th className="px-5 py-4">Payment</th><th className="px-5 py-4">Validity / reference</th></tr></thead><tbody className="divide-y divide-black/6">
    <tr className="bg-[#fbfaf7]"><td className="px-5 py-4 font-bold">Current period</td><td className="px-5 py-4">AI reply usage</td><td className="px-5 py-4"><strong>{used.toLocaleString("en-IN")}</strong> used · {included.toLocaleString("en-IN")} included<br/><small className="text-[#68645c]">{extraUsed.toLocaleString("en-IN")} extra used · {remaining.toLocaleString("en-IN")} extra left</small></td><td className="px-5 py-4">—</td><td className="px-5 py-4 text-[#68645c]">Live balance</td></tr>
    {entries.map((entry) => <tr key={entry.id}><td className="px-5 py-4">{date(entry.createdAt)}</td><td className="px-5 py-4"><strong>{entry.kind === "PURCHASE" ? "Credit pack purchased" : "Free credits granted"}</strong><small className="mt-1 block text-[#68645c]">{entry.reason || (entry.kind === "PURCHASE" ? "Verified prepaid purchase" : "Super Admin allocation")}</small></td><td className="px-5 py-4 font-bold text-[#17694f]">+{entry.credits.toLocaleString("en-IN")}</td><td className="px-5 py-4">{entry.amountPaisa ? <><strong>{formatMoney(entry.amountPaisa)}</strong><small className="mt-1 block text-[#17694f]">Paid</small></> : <span>Free grant</span>}</td><td className="px-5 py-4"><span>{entry.expiresAt ? `Valid until ${date(entry.expiresAt)}` : "No expiry"}</span><small className="mt-1 block text-[#68645c]">{entry.paymentReference ? `Payment ${entry.paymentReference}` : `Allocated by ${entry.createdBy}`}</small></td></tr>)}
    {!entries.length ? <tr><td colSpan={5} className="px-5 py-10 text-center text-[#68645c]">No credit purchase or free-credit allocation has been recorded.</td></tr> : null}
  </tbody></table></div>;
}

/** Only the new annual offers reset included AI credits monthly. Legacy terms stay intact. */
export function usesMonthlyCredits(code: string) {
  return code === "AI_STARTER_YEARLY_2026" || code === "HOTELGPT_YEARLY_2026";
}

/** Monthly anniversaries use UTC and clamp end-of-month starts without drifting. */
export function annualCreditWindows(start: Date, periodEnd: Date | null, now: Date) {
  const boundary = (offset: number) => {
    const date = new Date(start);
    date.setUTCDate(1);
    date.setUTCMonth(start.getUTCMonth() + offset);
    const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(start.getUTCDate(), last));
    return date;
  };
  const windows: { start: Date; end: Date }[] = [];
  for (let index = 0; index < 12; index++) {
    const from = boundary(index);
    if (from > now || (periodEnd && from >= periodEnd)) break;
    const next = boundary(index + 1);
    const end = periodEnd && periodEnd < next ? periodEnd : next;
    windows.push({ start: from, end });
  }
  return windows;
}

/** Prior-month overage stays consumed when the included monthly allowance refreshes. */
export function monthlyCreditUsage(counts: number[], included: number) {
  return { current: counts.at(-1) || 0, previousOverage: counts.slice(0, -1).reduce((sum, used) => sum + Math.max(0, used - included), 0) };
}

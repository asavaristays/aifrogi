export const TRIAL_DAYS = 15;
export const TRIAL_UPGRADE_REMINDER_DAY = 13;
export const DEFAULT_PAID_PLAN = "STARTER";

export function addTrialDays(start: Date) {
  const end = new Date(start);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end;
}

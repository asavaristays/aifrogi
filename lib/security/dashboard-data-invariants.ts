export type DashboardDataSnapshot = {
  organizations: number;
  websiteConversations: number;
  subscriptions: number;
  creditTransactions: number;
};

const DASHBOARD_DATA_KEYS = ["organizations", "websiteConversations", "subscriptions", "creditTransactions"] as const;

export function validateDashboardDataSnapshot(value: unknown): DashboardDataSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Dashboard data snapshot must be an object.");
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== DASHBOARD_DATA_KEYS.length || keys.some((key) => !DASHBOARD_DATA_KEYS.includes(key as typeof DASHBOARD_DATA_KEYS[number]))) {
    throw new Error(`Dashboard data snapshot must contain exactly: ${DASHBOARD_DATA_KEYS.join(", ")}.`);
  }
  for (const key of DASHBOARD_DATA_KEYS) {
    if (!Number.isInteger(record[key]) || (record[key] as number) < 0) throw new Error(`Dashboard data snapshot ${key} must be a non-negative integer.`);
  }
  return record as DashboardDataSnapshot;
}

export function compareDashboardDataSnapshots(before: DashboardDataSnapshot, after: DashboardDataSnapshot) {
  const validatedBefore = validateDashboardDataSnapshot(before);
  const validatedAfter = validateDashboardDataSnapshot(after);
  return DASHBOARD_DATA_KEYS.flatMap((key) =>
    validatedAfter[key] < validatedBefore[key] ? [`${key} decreased from ${validatedBefore[key]} to ${validatedAfter[key]}`] : []
  );
}

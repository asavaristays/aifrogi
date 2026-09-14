export type TenantCostAlert = { severity: "WARNING" | "CRITICAL"; code: string; actualPaisa: number; thresholdPaisa: number };

export function evaluateTenantCostAlerts(input: { dailyCostPaisa: number; monthlyCostPaisa: number; dailyBudgetPaisa: number; monthlyBudgetPaisa: number }) {
  const alerts: TenantCostAlert[] = [];
  const check = (actualPaisa: number, thresholdPaisa: number, code: string) => {
    if (thresholdPaisa <= 0) return;
    if (actualPaisa >= thresholdPaisa) alerts.push({ severity: "CRITICAL", code: `${code}_EXCEEDED`, actualPaisa, thresholdPaisa });
    else if (actualPaisa >= thresholdPaisa * 0.8) alerts.push({ severity: "WARNING", code: `${code}_NEAR_LIMIT`, actualPaisa, thresholdPaisa });
  };
  check(input.dailyCostPaisa, input.dailyBudgetPaisa, "DAILY_AI_COST");
  check(input.monthlyCostPaisa, input.monthlyBudgetPaisa, "MONTHLY_AI_COST");
  return alerts;
}

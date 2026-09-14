import assert from "node:assert/strict";
import test from "node:test";
import { evaluateTenantCostAlerts } from "../../lib/production-hardening/cost-alerts";

test("tenant cost guard warns at 80 percent and fails at the limit", () => {
  assert.equal(evaluateTenantCostAlerts({ dailyCostPaisa: 800, monthlyCostPaisa: 100, dailyBudgetPaisa: 1000, monthlyBudgetPaisa: 1000 })[0]?.severity, "WARNING");
  assert.equal(evaluateTenantCostAlerts({ dailyCostPaisa: 1000, monthlyCostPaisa: 100, dailyBudgetPaisa: 1000, monthlyBudgetPaisa: 1000 })[0]?.severity, "CRITICAL");
});

test("disabled budgets do not invent alerts", () => assert.deepEqual(evaluateTenantCostAlerts({ dailyCostPaisa: 999, monthlyCostPaisa: 999, dailyBudgetPaisa: 0, monthlyBudgetPaisa: 0 }), []));

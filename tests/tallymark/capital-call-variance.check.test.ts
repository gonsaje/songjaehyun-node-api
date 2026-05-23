import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Transaction } from "../../src/modules/tallymark/domain/types";
import { findCapitalCallVarianceIssues } from "../../src/modules/tallymark/workflows/reconciliation/checks/capital-call-variance.check";

function buildTransaction(input: Partial<Transaction> & Pick<Transaction, "id">): Transaction {
  return {
    fundId: "fund-1",
    investorId: "investor-1",
    transactionType: "capital_call",
    reference: "NS-CC-2024-001",
    amount: "100.00",
    expectedAmount: "100.00",
    transactionDate: "2024-01-01",
    settlementDate: "2024-01-02",
    metadata: {},
    createdAt: "2026-05-23T00:00:00.000Z",
    updatedAt: "2026-05-23T00:00:00.000Z",
    ...input,
  };
}

describe("findCapitalCallVarianceIssues", () => {
  it("creates an underpayment issue when amount is less than expected amount", () => {
    const issues = findCapitalCallVarianceIssues("run-1", [
      buildTransaction({
        id: "transaction-1",
        reference: "NS-CC-2024-UNDER-011",
        amount: "200000.00",
        expectedAmount: "250000.00",
      }),
    ]);

    assert.equal(issues.length, 1);
    assert.equal(issues[0].issueType, "capital_call_underpayment");
    assert.equal(issues[0].severity, "medium");
    assert.equal(issues[0].status, "open");
    assert.equal(issues[0].transactionId, "transaction-1");
    assert.deepEqual(issues[0].metadata, {
      expectedAmount: "250000.00",
      actualAmount: "200000.00",
      variance: -50000,
    });
  });

  it("creates an overpayment issue when amount is greater than expected amount", () => {
    const issues = findCapitalCallVarianceIssues("run-1", [
      buildTransaction({
        id: "transaction-1",
        reference: "NS-CC-2024-OVER-014",
        amount: "125000.00",
        expectedAmount: "100000.00",
      }),
    ]);

    assert.equal(issues.length, 1);
    assert.equal(issues[0].issueType, "capital_call_overpayment");
    assert.deepEqual(issues[0].metadata, {
      expectedAmount: "100000.00",
      actualAmount: "125000.00",
      variance: 25000,
    });
  });

  it("does not create an issue when amount equals expected amount", () => {
    const issues = findCapitalCallVarianceIssues("run-1", [
      buildTransaction({
        id: "transaction-1",
        amount: "100000.00",
        expectedAmount: "100000.00",
      }),
    ]);

    assert.deepEqual(issues, []);
  });

  it("does not create an issue for non-capital-call transactions", () => {
    const issues = findCapitalCallVarianceIssues("run-1", [
      buildTransaction({
        id: "transaction-1",
        transactionType: "distribution",
        amount: "90000.00",
        expectedAmount: "100000.00",
      }),
    ]);

    assert.deepEqual(issues, []);
  });

  it("does not create an issue when expected amount is missing", () => {
    const issues = findCapitalCallVarianceIssues("run-1", [
      buildTransaction({
        id: "transaction-1",
        amount: "90000.00",
        expectedAmount: null,
      }),
    ]);

    assert.deepEqual(issues, []);
  });
});

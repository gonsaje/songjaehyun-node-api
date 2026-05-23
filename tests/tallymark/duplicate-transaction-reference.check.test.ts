import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Transaction } from "../../src/modules/tallymark/domain/types";
import { findDuplicateTransactionReferenceIssues } from "../../src/modules/tallymark/workflows/reconciliation/checks/duplicate-transaction-reference.check";

function buildTransaction(
  input: Partial<Transaction> & Pick<Transaction, "id" | "reference">,
): Transaction {
  return {
    fundId: "fund-1",
    investorId: "investor-1",
    transactionType: "capital_call",
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

describe("findDuplicateTransactionReferenceIssues", () => {
  it("creates one high-severity issue per duplicate reference group", () => {
    const issues = findDuplicateTransactionReferenceIssues("run-1", [
      buildTransaction({
        id: "transaction-1",
        reference: "NS-CC-2024-DUP-007",
      }),
      buildTransaction({
        id: "transaction-2",
        investorId: "investor-2",
        reference: "NS-CC-2024-DUP-007",
      }),
      buildTransaction({
        id: "transaction-3",
        reference: "NS-CC-2024-UNIQUE",
      }),
    ]);

    assert.equal(issues.length, 1);
    assert.equal(issues[0].reconciliationRunId, "run-1");
    assert.equal(issues[0].fundId, "fund-1");
    assert.equal(issues[0].transactionId, "transaction-1");
    assert.equal(issues[0].investorId, "investor-1");
    assert.equal(issues[0].issueType, "duplicate_transaction_reference");
    assert.equal(issues[0].severity, "high");
    assert.equal(issues[0].status, "open");
    assert.deepEqual(issues[0].metadata, {
      reference: "NS-CC-2024-DUP-007",
      matchingTransactionIds: ["transaction-1", "transaction-2"],
    });
  });

  it("does not create issues when references are unique", () => {
    const issues = findDuplicateTransactionReferenceIssues("run-1", [
      buildTransaction({
        id: "transaction-1",
        reference: "NS-CC-2024-001",
      }),
      buildTransaction({
        id: "transaction-2",
        reference: "NS-CC-2024-002",
      }),
    ]);

    assert.deepEqual(issues, []);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  Fund,
  ReconciliationRun,
  ReviewIssue,
  Transaction,
} from "../../src/modules/tallymark/domain/types";
import type { FundRepository } from "../../src/modules/tallymark/funds/fund.repository";
import type { ReviewIssueRepository } from "../../src/modules/tallymark/issues/review-issue.repository";
import type { ReconciliationRunRepository } from "../../src/modules/tallymark/runs/reconciliation-run.repository";
import type { TransactionRepository } from "../../src/modules/tallymark/transactions/transaction.repository";
import { ReconciliationRunService } from "../../src/modules/tallymark/runs/reconciliation-run.service";

const fund: Fund = {
  id: "fund-1",
  name: "Northstar Private Markets Fund I",
  strategy: "Lower middle-market buyout",
  vintageYear: 2021,
  currency: "USD",
  metadata: {},
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z",
};

const processingRun: ReconciliationRun = {
  id: "run-1",
  fundId: "fund-1",
  status: "processing",
  startedAt: "2026-05-22T00:00:00.000Z",
  completedAt: null,
  aiSummary: null,
  errorMessage: null,
  metadata: {},
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z",
};

const transactionWithoutSettlementDate: Transaction = {
  id: "transaction-1",
  fundId: "fund-1",
  investorId: "investor-1",
  transactionType: "capital_call",
  reference: "NS-CC-2024-NO-SETTLE",
  amount: "300000.00",
  expectedAmount: "300000.00",
  transactionDate: "2024-04-01",
  settlementDate: null,
  metadata: {},
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z",
};

const duplicateReferenceTransactionA: Transaction = {
  id: "transaction-2",
  fundId: "fund-1",
  investorId: "investor-1",
  transactionType: "capital_call",
  reference: "NS-CC-2024-DUP-007",
  amount: "180000.00",
  expectedAmount: "180000.00",
  transactionDate: "2024-02-01",
  settlementDate: "2024-02-05",
  metadata: {},
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z",
};

const duplicateReferenceTransactionB: Transaction = {
  id: "transaction-3",
  fundId: "fund-1",
  investorId: "investor-2",
  transactionType: "capital_call",
  reference: "NS-CC-2024-DUP-007",
  amount: "95000.00",
  expectedAmount: "95000.00",
  transactionDate: "2024-02-01",
  settlementDate: "2024-02-05",
  metadata: {},
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z",
};

const underpaymentTransaction: Transaction = {
  id: "transaction-4",
  fundId: "fund-1",
  investorId: "investor-2",
  transactionType: "capital_call",
  reference: "NS-CC-2024-UNDER-011",
  amount: "200000.00",
  expectedAmount: "250000.00",
  transactionDate: "2024-03-01",
  settlementDate: "2024-03-05",
  metadata: {},
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z",
};

const overpaymentTransaction: Transaction = {
  id: "transaction-5",
  fundId: "fund-1",
  investorId: "investor-3",
  transactionType: "capital_call",
  reference: "NS-CC-2024-OVER-014",
  amount: "125000.00",
  expectedAmount: "100000.00",
  transactionDate: "2024-03-01",
  settlementDate: "2024-03-05",
  metadata: {},
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z",
};

function buildService(existingFund: Fund | undefined) {
  const createdRunFundIds: string[] = [];
  const completedRuns: Array<{ runId: string; aiSummary: string }> = [];
  const createdReviewIssues: ReviewIssue[] = [];

  const fundRepository = {
    async getFundById() {
      return existingFund;
    },
  } as unknown as FundRepository;

  const reconciliationRunRepository = {
    async createProcessingRun(fundId: string) {
      createdRunFundIds.push(fundId);
      return processingRun;
    },
    async markRunCompleted(runId: string, aiSummary: string) {
      completedRuns.push({ runId, aiSummary });

      return {
        ...processingRun,
        status: "completed",
        completedAt: "2026-05-22T00:01:00.000Z",
        aiSummary,
      } satisfies ReconciliationRun;
    },
  } as unknown as ReconciliationRunRepository;

  const transactionRepository = {
    async listTransactionsByFundId() {
      return [
        transactionWithoutSettlementDate,
        duplicateReferenceTransactionA,
        duplicateReferenceTransactionB,
        underpaymentTransaction,
        overpaymentTransaction,
      ];
    },
  } as unknown as TransactionRepository;

  const reviewIssueRepository = {
    async createReviewIssue(input: {
      reconciliationRunId: string;
      fundId: string;
      transactionId: string | null;
      investorId: string | null;
      issueType: ReviewIssue["issueType"];
      severity: ReviewIssue["severity"];
      status: ReviewIssue["status"];
      title: string;
      description: string;
      aiSummary?: string | null;
      metadata: Record<string, unknown>;
    }) {
      const issue: ReviewIssue = {
        id: `issue-${createdReviewIssues.length + 1}`,
        ...input,
        aiSummary: input.aiSummary ?? null,
        createdAt: "2026-05-22T00:00:00.000Z",
        updatedAt: "2026-05-22T00:00:00.000Z",
      };

      createdReviewIssues.push(issue);
      return issue;
    },
  } as unknown as ReviewIssueRepository;

  return {
    completedRuns,
    createdReviewIssues,
    createdRunFundIds,
    service: new ReconciliationRunService(
      reconciliationRunRepository,
      fundRepository,
      transactionRepository,
      reviewIssueRepository,
    ),
  };
}

describe("ReconciliationRunService", () => {
  it("creates and completes a reconciliation run for an existing fund", async () => {
    const { completedRuns, createdReviewIssues, createdRunFundIds, service } = buildService(fund);

    const run = await service.startRun("fund-1");

    assert.equal(run?.status, "completed");
    assert.deepEqual(createdRunFundIds, ["fund-1"]);
    assert.equal(createdReviewIssues.length, 4);
    assert.equal(createdReviewIssues[0].issueType, "missing_settlement_date");
    assert.equal(createdReviewIssues[0].transactionId, "transaction-1");
    assert.equal(createdReviewIssues[1].issueType, "duplicate_transaction_reference");
    assert.equal(createdReviewIssues[1].transactionId, "transaction-2");
    assert.equal(createdReviewIssues[2].issueType, "capital_call_underpayment");
    assert.equal(createdReviewIssues[2].transactionId, "transaction-4");
    assert.equal(createdReviewIssues[3].issueType, "capital_call_overpayment");
    assert.equal(createdReviewIssues[3].transactionId, "transaction-5");
    assert.deepEqual(completedRuns, [
      {
        runId: "run-1",
        aiSummary: "Initial reconciliation run completed. Deterministic checks will be added next.",
      },
    ]);
  });

  it("does not create a run for a missing fund", async () => {
    const { completedRuns, createdReviewIssues, createdRunFundIds, service } =
      buildService(undefined);

    const run = await service.startRun("missing-fund");

    assert.equal(run, undefined);
    assert.deepEqual(createdRunFundIds, []);
    assert.deepEqual(createdReviewIssues, []);
    assert.deepEqual(completedRuns, []);
  });
});

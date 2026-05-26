import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  Fund,
  ReconciliationRun,
  ReviewIssue,
  Transaction,
} from "../../src/modules/tallymark/domain/types";
import type { AiSummaryService } from "../../src/modules/tallymark/ai/ai-summary.types";
import type { FundRepository } from "../../src/modules/tallymark/funds/fund.repository";
import type { ReviewIssueRepository } from "../../src/modules/tallymark/issues/review-issue.repository";
import type { ReconciliationRunRepository } from "../../src/modules/tallymark/runs/reconciliation-run.repository";
import type { TransactionRepository } from "../../src/modules/tallymark/transactions/transaction.repository";
import {
  ReconciliationRunJobCanceller,
  ReconciliationRunJobDispatcher,
  ReconciliationRunService,
} from "../../src/modules/tallymark/runs/reconciliation-run.service";

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

const queuedRun: ReconciliationRun = {
  id: "run-1",
  fundId: "fund-1",
  status: "queued",
  startedAt: null,
  completedAt: null,
  scheduledAt: null,
  triggerRunId: null,
  aiSummary: null,
  errorMessage: null,
  metadata: {},
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z",
};

const processingRun: ReconciliationRun = {
  ...queuedRun,
  status: "processing",
  startedAt: "2026-05-22T00:00:30.000Z",
  updatedAt: "2026-05-22T00:00:30.000Z",
};

const completedRun: ReconciliationRun = {
  ...processingRun,
  status: "completed",
  completedAt: "2026-05-22T00:01:00.000Z",
  aiSummary: "Existing completed summary.",
  updatedAt: "2026-05-22T00:01:00.000Z",
};

const failedRun: ReconciliationRun = {
  ...processingRun,
  status: "failed",
  completedAt: "2026-05-22T00:01:00.000Z",
  errorMessage: "Previous processing error.",
  updatedAt: "2026-05-22T00:01:00.000Z",
};

const scheduledRun: ReconciliationRun = {
  ...queuedRun,
  scheduledAt: "2026-05-22T00:10:00.000Z",
  triggerRunId: "trigger-run-1",
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

function buildService(
  existingFund: Fund | undefined,
  options: {
    existingRun?: ReconciliationRun | null;
    failIssueCreation?: boolean;
    missingFundIds?: string[];
  } = {},
) {
  const queuedRunFundIds: string[] = [];
  const processingRunIds: string[] = [];
  const completedRuns: Array<{ runId: string; aiSummary: string }> = [];
  const failedRuns: Array<{ runId: string; errorMessage: string }> = [];
  const createdReviewIssues: ReviewIssue[] = [];
  const summaryRequests: Array<{ fundName: string; runId: string; issues: ReviewIssue[] }> = [];
  const dispatchedJobs: Array<{ reconciliationRunId: string }> = [];
  const cancelledTriggerRunIds: string[] = [];
  const runsById = new Map<string, ReconciliationRun>();
  const scheduledJobs: Array<{
    payload: { reconciliationRunId: string };
    options?: { delay?: string | Date; ttl?: string | number };
  }> = [];

  const fundRepository = {
    async getFundById(fundId: string) {
      if (options.missingFundIds?.includes(fundId)) {
        return undefined;
      }

      return existingFund ? { ...existingFund, id: fundId } : undefined;
    },
  } as unknown as FundRepository;

  const reconciliationRunRepository = {
    async createQueuedRun(fundId: string) {
      queuedRunFundIds.push(fundId);
      const run = {
        ...queuedRun,
        id: `run-${queuedRunFundIds.length}`,
        fundId,
      };

      runsById.set(run.id, run);
      return run;
    },
    async createScheduledRun(fundId: string, scheduledAt: string) {
      queuedRunFundIds.push(fundId);
      const run = {
        ...queuedRun,
        id: `run-${queuedRunFundIds.length}`,
        fundId,
        scheduledAt,
      };

      runsById.set(run.id, run);
      return run;
    },
    async getReconciliationRunById() {
      return options.existingRun === null ? undefined : (options.existingRun ?? queuedRun);
    },
    async markProcessingRun(reconciliationRunId: string) {
      processingRunIds.push(reconciliationRunId);
      return processingRun;
    },
    async markTriggerRunId(runId: string, triggerRunId: string) {
      const existingRun = runsById.get(runId) ?? queuedRun;

      return {
        ...existingRun,
        id: runId,
        triggerRunId,
      };
    },
    async markRunCancelled(runId: string) {
      const existingRun = runsById.get(runId) ?? options.existingRun ?? queuedRun;

      return {
        ...existingRun,
        id: runId,
        status: "cancelled",
        completedAt: "2026-05-22T00:01:00.000Z",
      } satisfies ReconciliationRun;
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
    async markRunFailed(runId: string, errorMessage: string) {
      failedRuns.push({ runId, errorMessage });

      return {
        ...processingRun,
        status: "failed",
        completedAt: "2026-05-22T00:01:00.000Z",
        errorMessage,
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
      if (options.failIssueCreation) {
        throw new Error("issue insert failed");
      }

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

  const aiSummaryService = {
    async summarizeReviewIssue(input: { title: string }) {
      return `AI summary for ${input.title}.`;
    },
    async summarizeReconciliationRun(input: {
      fundName: string;
      runId: string;
      issues: ReviewIssue[];
    }) {
      summaryRequests.push(input);
      return `AI summary for ${input.issues.length} issue(s).`;
    },
  } as unknown as AiSummaryService;

  const jobDispatcher = {
    async trigger(
      payload: { reconciliationRunId: string },
      options?: { delay?: string | Date; ttl?: string | number },
    ) {
      dispatchedJobs.push(payload);
      scheduledJobs.push({ payload, options });
      return { id: `trigger-${payload.reconciliationRunId}` };
    },
  } as unknown as ReconciliationRunJobDispatcher;

  const jobCanceller = {
    async cancel(triggerRunId: string) {
      cancelledTriggerRunIds.push(triggerRunId);
    },
  } as unknown as ReconciliationRunJobCanceller;

  return {
    cancelledTriggerRunIds,
    completedRuns,
    createdReviewIssues,
    dispatchedJobs,
    failedRuns,
    processingRunIds,
    queuedRunFundIds,
    scheduledJobs,
    service: new ReconciliationRunService(
      reconciliationRunRepository,
      fundRepository,
      transactionRepository,
      reviewIssueRepository,
      aiSummaryService,
      jobDispatcher,
      jobCanceller,
    ),
    summaryRequests,
  };
}

describe("ReconciliationRunService", () => {
  it("creates a queued reconciliation run and dispatches a processing job", async () => {
    const { completedRuns, createdReviewIssues, dispatchedJobs, queuedRunFundIds, service } =
      buildService(fund);

    const run = await service.startRun("fund-1");

    assert.equal(run?.status, "queued");
    assert.deepEqual(queuedRunFundIds, ["fund-1"]);
    assert.deepEqual(dispatchedJobs, [{ reconciliationRunId: "run-1" }]);
    assert.deepEqual(createdReviewIssues, []);
    assert.deepEqual(completedRuns, []);
  });

  it("does not create a queued run for a missing fund", async () => {
    const { completedRuns, createdReviewIssues, dispatchedJobs, queuedRunFundIds, service } =
      buildService(undefined);

    const run = await service.startRun("missing-fund");

    assert.equal(run, undefined);
    assert.deepEqual(queuedRunFundIds, []);
    assert.deepEqual(dispatchedJobs, []);
    assert.deepEqual(createdReviewIssues, []);
    assert.deepEqual(completedRuns, []);
  });

  it("creates queued reconciliation runs for a valid batch", async () => {
    const { dispatchedJobs, queuedRunFundIds, service } = buildService(fund);

    const runs = await service.startRuns(["fund-1", "fund-2"]);

    assert.deepEqual(
      runs?.map((run) => [run.id, run.fundId, run.status]),
      [
        ["run-1", "fund-1", "queued"],
        ["run-2", "fund-2", "queued"],
      ],
    );
    assert.deepEqual(queuedRunFundIds, ["fund-1", "fund-2"]);
    assert.deepEqual(dispatchedJobs, [
      { reconciliationRunId: "run-1" },
      { reconciliationRunId: "run-2" },
    ]);
  });

  it("dedupes fund IDs before starting a batch", async () => {
    const { dispatchedJobs, queuedRunFundIds, service } = buildService(fund);

    const runs = await service.startRuns(["fund-1", "fund-1", "fund-2"]);

    assert.equal(runs?.length, 2);
    assert.deepEqual(queuedRunFundIds, ["fund-1", "fund-2"]);
    assert.deepEqual(dispatchedJobs, [
      { reconciliationRunId: "run-1" },
      { reconciliationRunId: "run-2" },
    ]);
  });

  it("does not create any queued runs when a batch contains a missing fund", async () => {
    const { dispatchedJobs, queuedRunFundIds, service } = buildService(fund, {
      missingFundIds: ["missing-fund"],
    });

    const runs = await service.startRuns(["fund-1", "missing-fund"]);

    assert.equal(runs, undefined);
    assert.deepEqual(queuedRunFundIds, []);
    assert.deepEqual(dispatchedJobs, []);
  });

  it("schedules a reconciliation run for a future date", async () => {
    const { queuedRunFundIds, scheduledJobs, service } = buildService(fund);
    const scheduledAt = new Date(Date.now() + 60_000).toISOString();

    const run = await service.scheduleRun("fund-1", scheduledAt);

    assert.equal(run?.status, "queued");
    assert.equal(run?.scheduledAt, scheduledAt);
    assert.equal(run?.triggerRunId, "trigger-run-1");
    assert.deepEqual(queuedRunFundIds, ["fund-1"]);
    assert.deepEqual(scheduledJobs.length, 1);
    assert.deepEqual(scheduledJobs[0].payload, { reconciliationRunId: "run-1" });
    assert.ok(scheduledJobs[0].options?.delay instanceof Date);
    assert.equal(scheduledJobs[0].options.delay.toISOString(), scheduledAt);
    assert.equal(scheduledJobs[0].options.ttl, "1h");
  });

  it("does not schedule a reconciliation run for a missing fund", async () => {
    const { queuedRunFundIds, scheduledJobs, service } = buildService(undefined);
    const scheduledAt = new Date(Date.now() + 60_000).toISOString();

    const run = await service.scheduleRun("missing-fund", scheduledAt);

    assert.equal(run, undefined);
    assert.deepEqual(queuedRunFundIds, []);
    assert.deepEqual(scheduledJobs, []);
  });

  it("rejects an invalid scheduled date", async () => {
    const { queuedRunFundIds, scheduledJobs, service } = buildService(fund);

    await assert.rejects(
      () => service.scheduleRun("fund-1", "not-a-date"),
      /scheduledAt must be a valid date-time/,
    );

    assert.deepEqual(queuedRunFundIds, []);
    assert.deepEqual(scheduledJobs, []);
  });

  it("rejects a scheduled date in the past", async () => {
    const { queuedRunFundIds, scheduledJobs, service } = buildService(fund);
    const scheduledAt = new Date(Date.now() - 60_000).toISOString();

    await assert.rejects(
      () => service.scheduleRun("fund-1", scheduledAt),
      /scheduledAt must be in the future/,
    );

    assert.deepEqual(queuedRunFundIds, []);
    assert.deepEqual(scheduledJobs, []);
  });

  it("cancels a queued scheduled reconciliation run", async () => {
    const { cancelledTriggerRunIds, service } = buildService(fund, {
      existingRun: scheduledRun,
    });

    const run = await service.cancelRun("run-1");

    assert.equal(run?.status, "cancelled");
    assert.deepEqual(cancelledTriggerRunIds, ["trigger-run-1"]);
  });

  it("returns undefined when cancelling a missing reconciliation run", async () => {
    const { cancelledTriggerRunIds, service } = buildService(fund, {
      existingRun: null,
    });

    const run = await service.cancelRun("missing-run");

    assert.equal(run, undefined);
    assert.deepEqual(cancelledTriggerRunIds, []);
  });

  it("rejects cancellation for a completed reconciliation run", async () => {
    const { cancelledTriggerRunIds, service } = buildService(fund, {
      existingRun: completedRun,
    });

    await assert.rejects(
      () => service.cancelRun("run-1"),
      /Only queued reconciliation runs can be cancelled/,
    );
    assert.deepEqual(cancelledTriggerRunIds, []);
  });

  it("processes a queued reconciliation run and marks it completed", async () => {
    const { completedRuns, createdReviewIssues, processingRunIds, service, summaryRequests } =
      buildService(fund);

    const run = await service.processRun("run-1");

    assert.equal(run?.status, "completed");
    assert.deepEqual(processingRunIds, ["run-1"]);
    assert.equal(createdReviewIssues.length, 4);
    assert.deepEqual(
      createdReviewIssues.map((issue) => [issue.issueType, issue.transactionId]),
      [
        ["duplicate_transaction_reference", "transaction-2"],
        ["missing_settlement_date", "transaction-1"],
        ["capital_call_underpayment", "transaction-4"],
        ["capital_call_overpayment", "transaction-5"],
      ],
    );
    assert.deepEqual(completedRuns, [
      {
        runId: "run-1",
        aiSummary: "AI summary for 4 issue(s).",
      },
    ]);
    assert.equal(summaryRequests.length, 1);
    assert.equal(summaryRequests[0].fundName, "Northstar Private Markets Fund I");
    assert.equal(summaryRequests[0].runId, "run-1");
    assert.deepEqual(
      summaryRequests[0].issues.map((issue) => issue.issueType),
      [
        "duplicate_transaction_reference",
        "missing_settlement_date",
        "capital_call_underpayment",
        "capital_call_overpayment",
      ],
    );
  });

  it("returns undefined when processing a missing run", async () => {
    const { service } = buildService(fund, { existingRun: null });

    const run = await service.processRun("missing-run");

    assert.equal(run, undefined);
  });

  it("does not reprocess a run that is already completed", async () => {
    const { completedRuns, createdReviewIssues, failedRuns, processingRunIds, service } =
      buildService(fund, { existingRun: completedRun });

    const run = await service.processRun("run-1");

    assert.equal(run?.status, "completed");
    assert.equal(run?.aiSummary, "Existing completed summary.");
    assert.deepEqual(processingRunIds, []);
    assert.deepEqual(createdReviewIssues, []);
    assert.deepEqual(completedRuns, []);
    assert.deepEqual(failedRuns, []);
  });

  it("reprocesses a failed run so Trigger.dev retries can recover", async () => {
    const { completedRuns, failedRuns, processingRunIds, service } = buildService(fund, {
      existingRun: failedRun,
    });

    const run = await service.processRun("run-1");

    assert.equal(run?.status, "completed");
    assert.deepEqual(processingRunIds, ["run-1"]);
    assert.deepEqual(failedRuns, []);
    assert.deepEqual(completedRuns, [
      {
        runId: "run-1",
        aiSummary: "AI summary for 4 issue(s).",
      },
    ]);
  });

  it("marks the run failed and rethrows when processing errors", async () => {
    const { completedRuns, failedRuns, processingRunIds, service } = buildService(fund, {
      failIssueCreation: true,
    });

    await assert.rejects(() => service.processRun("run-1"), /issue insert failed/);

    assert.deepEqual(processingRunIds, ["run-1"]);
    assert.deepEqual(completedRuns, []);
    assert.deepEqual(failedRuns, [
      {
        runId: "run-1",
        errorMessage: "issue insert failed",
      },
    ]);
  });
});

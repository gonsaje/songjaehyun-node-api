import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Fund, ReconciliationRun } from "../../src/modules/tallymark/domain/types";
import type { FundRepository } from "../../src/modules/tallymark/funds/fund.repository";
import type { ReconciliationRunRepository } from "../../src/modules/tallymark/runs/reconciliation-run.repository";
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

function buildService(existingFund: Fund | undefined) {
  const createdRunFundIds: string[] = [];
  const completedRuns: Array<{ runId: string; aiSummary: string }> = [];

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

  return {
    completedRuns,
    createdRunFundIds,
    service: new ReconciliationRunService(reconciliationRunRepository, fundRepository),
  };
}

describe("ReconciliationRunService", () => {
  it("creates and completes a reconciliation run for an existing fund", async () => {
    const { completedRuns, createdRunFundIds, service } = buildService(fund);

    const run = await service.startRun("fund-1");

    assert.equal(run?.status, "completed");
    assert.deepEqual(createdRunFundIds, ["fund-1"]);
    assert.deepEqual(completedRuns, [
      {
        runId: "run-1",
        aiSummary: "Initial reconciliation run completed. Deterministic checks will be added next.",
      },
    ]);
  });

  it("does not create a run for a missing fund", async () => {
    const { completedRuns, createdRunFundIds, service } = buildService(undefined);

    const run = await service.startRun("missing-fund");

    assert.equal(run, undefined);
    assert.deepEqual(createdRunFundIds, []);
    assert.deepEqual(completedRuns, []);
  });
});

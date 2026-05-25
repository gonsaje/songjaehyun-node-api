import type { ReconciliationRun } from "../domain/types";
import type { ReconciliationRunRepository } from "./reconciliation-run.repository";
import type { FundRepository } from "../funds/fund.repository";
import type { TransactionRepository } from "../transactions/transaction.repository";
import type { ReviewIssueRepository } from "../issues/review-issue.repository";
import type { AiSummaryService } from "../ai/ai-summary.types";
import { runReconciliationChecks } from "../workflows/reconciliation/run-reconciliation-checks";

export interface ReconciliationRunJobDispatcher {
  trigger(payload: { reconciliationRunId: string }): Promise<unknown>;
}

export class ReconciliationRunService {
  constructor(
    private readonly reconciliationRunRepository: ReconciliationRunRepository,
    private readonly fundRepository: FundRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly reviewIssueRepository: ReviewIssueRepository,
    private readonly aiSummaryService: AiSummaryService,
    private readonly jobDispatcher?: ReconciliationRunJobDispatcher,
  ) {}

  async startRun(fundId: string): Promise<ReconciliationRun | undefined> {
    const fund = await this.fundRepository.getFundById(fundId);

    if (!fund) {
      return undefined;
    }

    const run = await this.reconciliationRunRepository.createQueuedRun(fundId);

    void this.jobDispatcher?.trigger({ reconciliationRunId: run.id }).catch((error) => {
      console.error("Failed to trigger reconciliation run task", error);
    });

    return { ...run };
  }

  async startRuns(fundIds: string[]): Promise<ReconciliationRun[] | undefined> {
    const uniqueFundIds = [...new Set(fundIds)];

    for (const fundId of uniqueFundIds) {
      const fund = await this.fundRepository.getFundById(fundId);

      if (!fund) {
        return undefined;
      }
    }

    const runs: ReconciliationRun[] = [];

    for (const fundId of uniqueFundIds) {
      const run = await this.reconciliationRunRepository.createQueuedRun(fundId);

      void this.jobDispatcher?.trigger({ reconciliationRunId: run.id }).catch((error) => {
        console.error("Failed to trigger reconciliation run task", error);
      });

      runs.push({ ...run });
    }

    return runs;
  }

  async processRun(reconciliationRunId: string): Promise<ReconciliationRun | undefined> {
    const run =
      await this.reconciliationRunRepository.getReconciliationRunById(reconciliationRunId);
    if (!run) {
      return undefined;
    }

    if (run.status === "completed" || run.status === "processing") {
      return run;
    }

    try {
      const processingRun = await this.reconciliationRunRepository.markProcessingRun(run.id);
      const fund = await this.fundRepository.getFundById(processingRun.fundId);

      if (!fund) {
        throw new Error(`Fund with id ${processingRun.fundId} was not found.`);
      }

      const transactions = await this.transactionRepository.listTransactionsByFundId(
        processingRun.fundId,
      );
      const issueInputs = runReconciliationChecks(processingRun.id, transactions);

      const createdIssues = await Promise.all(
        issueInputs.map((issueInput) => this.reviewIssueRepository.createReviewIssue(issueInput)),
      );

      const aiSummary = await this.aiSummaryService.summarizeReconciliationRun({
        fundName: fund.name,
        runId: processingRun.id,
        issues: createdIssues,
      });

      return this.reconciliationRunRepository.markRunCompleted(processingRun.id, aiSummary);
    } catch (error) {
      await this.reconciliationRunRepository.markRunFailed(
        run.id,
        error instanceof Error ? error.message : "Unknown reconciliation error",
      );

      throw error;
    }
  }
}

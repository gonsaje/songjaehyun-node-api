import type { ReconciliationRun } from "../domain/types";
import type { ReconciliationRunRepository } from "./reconciliation-run.repository";
import type { FundRepository } from "../funds/fund.repository";
import type { TransactionRepository } from "../transactions/transaction.repository";
import type { ReviewIssueRepository } from "../issues/review-issue.repository";
import { runReconciliationChecks } from "../workflows/reconciliation/run-reconciliation-checks";

export class ReconciliationRunService {
  constructor(
    private readonly reconciliationRunRepository: ReconciliationRunRepository,
    private readonly fundRepository: FundRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly reviewIssueRepository: ReviewIssueRepository,
  ) {}

  async startRun(fundId: string): Promise<ReconciliationRun | undefined> {
    const fund = await this.fundRepository.getFundById(fundId);

    if (!fund) {
      return undefined;
    }

    const run = await this.reconciliationRunRepository.createProcessingRun(fundId);
    try {
      const transactions = await this.transactionRepository.listTransactionsByFundId(fundId);
      const issueInputs = runReconciliationChecks(run.id, transactions);
      await Promise.all(
        issueInputs.map((issueInput) => this.reviewIssueRepository.createReviewIssue(issueInput)),
      );

      return this.reconciliationRunRepository.markRunCompleted(
        run.id,
        "Initial reconciliation run completed. Deterministic checks will be added next.",
      );
    } catch (error) {
      return this.reconciliationRunRepository.markRunFailed(
        run.id,
        error instanceof Error ? error.message : "Unknown reconciliation error",
      );
    }
  }
}

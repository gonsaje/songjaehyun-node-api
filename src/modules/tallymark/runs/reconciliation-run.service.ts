import type { ReconciliationRun } from "../domain/types";
import type { ReconciliationRunRepository } from "./reconciliation-run.repository";
import type { FundRepository } from "../funds/fund.repository";
import type { TransactionRepository } from "../transactions/transaction.repository";
import type { ReviewIssueRepository } from "../issues/review-issue.repository";
import type { AiSummaryService } from "../ai/ai-summary.types";
import { runReconciliationChecks } from "../workflows/reconciliation/run-reconciliation-checks";

export class ReconciliationRunService {
  constructor(
    private readonly reconciliationRunRepository: ReconciliationRunRepository,
    private readonly fundRepository: FundRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly reviewIssueRepository: ReviewIssueRepository,
    private readonly aiSummaryService: AiSummaryService,
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

      const createdIssues = await Promise.all(
        issueInputs.map((issueInput) => this.reviewIssueRepository.createReviewIssue(issueInput)),
      );

      const aiSummary = await this.aiSummaryService.summarizeReconciliationRun({
        fundName: fund.name,
        runId: run.id,
        issues: createdIssues,
      });

      return this.reconciliationRunRepository.markRunCompleted(run.id, aiSummary);
    } catch (error) {
      return this.reconciliationRunRepository.markRunFailed(
        run.id,
        error instanceof Error ? error.message : "Unknown reconciliation error",
      );
    }
  }
}

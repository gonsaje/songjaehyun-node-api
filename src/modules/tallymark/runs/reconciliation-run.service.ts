import type { ReconciliationRun } from "../domain/types";
import type { ReconciliationRunRepository } from "./reconciliation-run.repository";
import type { FundRepository } from "../funds/fund.repository";
import type { TransactionRepository } from "../transactions/transaction.repository";
import type { ReviewIssueRepository } from "../issues/review-issue.repository";
import { findDuplicateTransactionReferenceIssues } from "../workflows/reconciliation/checks/duplicate-transaction-reference.check";
import { findMissingSettlementDateIssues } from "../workflows/reconciliation/checks/missing-settlement-date.check";

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

    const transactions = await this.transactionRepository.listTransactionsByFundId(fundId);

    const issueInputs = [
      ...findMissingSettlementDateIssues(run.id, transactions),
      ...findDuplicateTransactionReferenceIssues(run.id, transactions),
    ];

    await Promise.all(
      issueInputs.map((issueInput) => this.reviewIssueRepository.createReviewIssue(issueInput)),
    );

    return this.reconciliationRunRepository.markRunCompleted(
      run.id,
      "Initial reconciliation run completed. Deterministic checks will be added next.",
    );
  }
}

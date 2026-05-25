import { task } from "@trigger.dev/sdk/v3";
import { ReconciliationRunRepository } from "../modules/tallymark/runs/reconciliation-run.repository";
import { ReconciliationRunService } from "../modules/tallymark/runs/reconciliation-run.service";
import { FundRepository } from "../modules/tallymark/funds/fund.repository";
import { TransactionRepository } from "../modules/tallymark/transactions/transaction.repository";
import { ReviewIssueRepository } from "../modules/tallymark/issues/review-issue.repository";
import { OpenAiSummaryService } from "../modules/tallymark/ai/openai-summary.service";

export const processReconciliationRunTask = task({
  id: "process-reconciliation-run",
  run: async (payload: { reconciliationRunId: string }) => {
    // instantiate service
    const fundRepository = new FundRepository();
    const reconciliationRunRepository = new ReconciliationRunRepository();
    const transactionRepository = new TransactionRepository();
    const reviewIssueRepository = new ReviewIssueRepository();
    const aiSummaryService = new OpenAiSummaryService();
    const reconciliationRunService = new ReconciliationRunService(
      reconciliationRunRepository,
      fundRepository,
      transactionRepository,
      reviewIssueRepository,
      aiSummaryService,
    );
    // call service.processRun(payload.reconciliationRunId)
    return reconciliationRunService.processRun(payload.reconciliationRunId);
  },
});

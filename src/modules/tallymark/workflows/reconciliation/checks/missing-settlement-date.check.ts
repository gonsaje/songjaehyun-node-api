import { CreateReviewIssueInput, Transaction } from "../../../domain/types";

export function findMissingSettlementDateIssues(
  runId: string,
  transactions: Transaction[],
): CreateReviewIssueInput[] {
  return transactions
    .filter((transaction) => !transaction.settlementDate)
    .map((transaction) => ({
      reconciliationRunId: runId,
      fundId: transaction.fundId,
      transactionId: transaction.id,
      investorId: transaction.investorId,
      issueType: "missing_settlement_date",
      severity: "low",
      status: "open",
      title: `Missing settlement date for ${transaction.reference}`,
      description: "The transaction has a transaction date but no settlement date.",
      metadata: {
        field: "settlement_date",
        reference: transaction.reference,
      },
    }));
}

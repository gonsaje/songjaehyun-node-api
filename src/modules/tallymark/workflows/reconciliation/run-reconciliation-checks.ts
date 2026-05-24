import { CreateReviewIssueInput, Transaction } from "../../domain/types";
import { findCapitalCallVarianceIssues } from "./checks/capital-call-variance.check";
import { findDuplicateTransactionReferenceIssues } from "./checks/duplicate-transaction-reference.check";
import { findMissingSettlementDateIssues } from "./checks/missing-settlement-date.check";

export function runReconciliationChecks(
  runId: string,
  transactions: Transaction[],
): CreateReviewIssueInput[] {
  return [
    ...findDuplicateTransactionReferenceIssues(runId, transactions),
    ...findMissingSettlementDateIssues(runId, transactions),
    ...findCapitalCallVarianceIssues(runId, transactions),
  ];
}

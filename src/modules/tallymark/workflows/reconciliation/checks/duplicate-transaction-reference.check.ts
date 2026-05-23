import { CreateReviewIssueInput, Transaction } from "../../../domain/types";

export function findDuplicateTransactionReferenceIssues(
  runId: string,
  transactions: Transaction[],
): CreateReviewIssueInput[] {
  const transactionsByReference = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    const matchingTransactions = transactionsByReference.get(transaction.reference) ?? [];
    matchingTransactions.push(transaction);
    transactionsByReference.set(transaction.reference, matchingTransactions);
  }

  const issues: CreateReviewIssueInput[] = [];

  for (const [reference, matchingTransactions] of transactionsByReference) {
    if (matchingTransactions.length < 2) {
      continue;
    }

    const firstTransaction = matchingTransactions[0];

    issues.push({
      reconciliationRunId: runId,
      fundId: firstTransaction.fundId,
      transactionId: firstTransaction.id,
      investorId: firstTransaction.investorId,
      issueType: "duplicate_transaction_reference",
      severity: "high",
      status: "open",
      title: `Duplicate transaction reference ${reference}`,
      description: `Multiple transactions share reference ${reference}.`,
      metadata: {
        reference,
        matchingTransactionIds: matchingTransactions.map((transaction) => transaction.id),
      },
    });
  }

  return issues;
}

import { CreateReviewIssueInput, Transaction } from "../../../domain/types";

export function findCapitalCallVarianceIssues(
  runId: string,
  transactions: Transaction[],
): CreateReviewIssueInput[] {
  return transactions.flatMap((transaction) => {
    if (transaction.transactionType !== "capital_call" || transaction.expectedAmount === null) {
      return [];
    }

    const amount = Number(transaction.amount);
    const expectedAmount = Number(transaction.expectedAmount);
    const variance = amount - expectedAmount;

    if (variance === 0) {
      return [];
    }

    const isUnderpayment = variance < 0;

    return [
      {
        reconciliationRunId: runId,
        fundId: transaction.fundId,
        transactionId: transaction.id,
        investorId: transaction.investorId,
        issueType: isUnderpayment ? "capital_call_underpayment" : "capital_call_overpayment",
        severity: "medium",
        status: "open",
        title: isUnderpayment
          ? `Capital call underpayment for ${transaction.reference}`
          : `Capital call overpayment for ${transaction.reference}`,
        description: `Expected amount was ${transaction.expectedAmount} but received amount was ${transaction.amount}.`,
        metadata: {
          expectedAmount: transaction.expectedAmount,
          actualAmount: transaction.amount,
          variance,
        },
      },
    ];
  });
}

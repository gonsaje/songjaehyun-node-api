import type { InvestorRepository } from "../investors/investor.repository";
import type { TransactionRepository } from "../transactions/transaction.repository";
import type { ReviewIssue, Transaction, TransactionType } from "../domain/types";
import type { ReviewIssueService } from "./review-issue.service";
import type { ReviewIssueRepository } from "./review-issue.repository";

export interface ReviewIssueResolutionResult {
  issue: ReviewIssue;
  transaction: Transaction;
}

export class ReviewIssueResolutionService {
  constructor(
    private readonly reviewIssueRepository: ReviewIssueRepository,
    private readonly reviewIssueService: ReviewIssueService,
    private readonly transactionRepository: TransactionRepository,
    private readonly investorRepository: InvestorRepository,
  ) {}

  async addSettlementDate(
    reviewIssueId: string,
    input: { settlementDate: string; note: string },
  ): Promise<ReviewIssueResolutionResult | undefined> {
    const issue = await this.requireOpenIssue(reviewIssueId);

    if (!issue) {
      return undefined;
    }

    if (issue.issueType !== "missing_settlement_date") {
      throw new Error("Settlement date can only be added for missing settlement date issues");
    }

    if (!issue.transactionId) {
      throw new Error("Review issue is not linked to a transaction");
    }

    if (!this.isDateOnly(input.settlementDate)) {
      throw new Error("settlementDate must use YYYY-MM-DD format");
    }

    const transaction = await this.transactionRepository.updateSettlementDate(
      issue.transactionId,
      input.settlementDate,
    );

    if (!transaction) {
      throw new Error("Linked transaction was not found");
    }

    const updatedIssue = await this.resolveIssue(
      issue.id,
      input.note,
      `Settlement date ${input.settlementDate} added.`,
    );

    return { issue: updatedIssue, transaction };
  }

  async assignInvestor(
    reviewIssueId: string,
    input: { investorId: string; note: string },
  ): Promise<ReviewIssueResolutionResult | undefined> {
    const issue = await this.requireOpenIssue(reviewIssueId);

    if (!issue) {
      return undefined;
    }

    if (!["missing_investor", "distribution_without_investor"].includes(issue.issueType)) {
      throw new Error("Investor can only be assigned for missing investor issues");
    }

    if (!issue.transactionId) {
      throw new Error("Review issue is not linked to a transaction");
    }

    const investor = await this.investorRepository.getInvestorById(input.investorId);

    if (!investor) {
      throw new Error("Investor was not found");
    }

    if (investor.fundId !== issue.fundId) {
      throw new Error("Investor must belong to the same fund as the review issue");
    }

    const transaction = await this.transactionRepository.assignInvestor(
      issue.transactionId,
      input.investorId,
    );

    if (!transaction) {
      throw new Error("Linked transaction was not found");
    }

    const updatedIssue = await this.resolveIssue(
      issue.id,
      input.note,
      `Assigned investor ${investor.name}.`,
    );

    return { issue: updatedIssue, transaction };
  }

  async updateReference(
    reviewIssueId: string,
    input: { reference: string; note: string },
  ): Promise<ReviewIssueResolutionResult | undefined> {
    const issue = await this.requireOpenIssue(reviewIssueId);

    if (!issue) {
      return undefined;
    }

    if (issue.issueType !== "duplicate_transaction_reference") {
      throw new Error("Reference can only be corrected for duplicate reference issues");
    }

    if (!issue.transactionId) {
      throw new Error("Review issue is not linked to a transaction");
    }

    const reference = input.reference.trim();

    if (!reference) {
      throw new Error("reference is required");
    }

    const transaction = await this.transactionRepository.updateReference(
      issue.transactionId,
      reference,
    );

    if (!transaction) {
      throw new Error("Linked transaction was not found");
    }

    const updatedIssue = await this.resolveIssue(
      issue.id,
      input.note,
      `Reference corrected to ${reference}.`,
    );

    return { issue: updatedIssue, transaction };
  }

  async classifyTransaction(
    reviewIssueId: string,
    input: { transactionType: TransactionType; note: string },
  ): Promise<ReviewIssueResolutionResult | undefined> {
    const issue = await this.requireOpenIssue(reviewIssueId);

    if (!issue) {
      return undefined;
    }

    if (issue.issueType !== "unknown_transaction_type") {
      throw new Error("Transaction type can only be classified for unknown type issues");
    }

    if (!issue.transactionId) {
      throw new Error("Review issue is not linked to a transaction");
    }

    const transaction = await this.transactionRepository.updateTransactionType(
      issue.transactionId,
      input.transactionType,
    );

    if (!transaction) {
      throw new Error("Linked transaction was not found");
    }

    const updatedIssue = await this.resolveIssue(
      issue.id,
      input.note,
      `Transaction classified as ${input.transactionType}.`,
    );

    return { issue: updatedIssue, transaction };
  }

  private async requireOpenIssue(reviewIssueId: string): Promise<ReviewIssue | undefined> {
    const issue = await this.reviewIssueRepository.getReviewIssueById(reviewIssueId);

    if (!issue) {
      return undefined;
    }

    if (issue.status !== "open") {
      throw new Error("Only open review issues can be fixed");
    }

    return issue;
  }

  private async resolveIssue(
    reviewIssueId: string,
    note: string,
    actionSummary: string,
  ): Promise<ReviewIssue> {
    const updatedIssue = await this.reviewIssueService.updateStatus(reviewIssueId, {
      status: "resolved",
      note: `${actionSummary} ${note.trim()}`,
    });

    if (!updatedIssue) {
      throw new Error("Review issue was not found");
    }

    return updatedIssue;
  }

  private isDateOnly(value: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  }
}

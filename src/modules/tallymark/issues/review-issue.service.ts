import type { IssueEventRepository } from "../events/issue-events.repository";
import type { ReviewIssue, UpdateReviewIssueStatusInput } from "../domain/types";
import type { ReviewIssueRepository } from "./review-issue.repository";

export class ReviewIssueService {
  constructor(
    private readonly reviewIssueRepository: ReviewIssueRepository,
    private readonly issueEventRepository: IssueEventRepository,
  ) {}

  async updateStatus(
    reviewIssueId: string,
    input: UpdateReviewIssueStatusInput,
  ): Promise<ReviewIssue | undefined> {
    const issue = await this.reviewIssueRepository.getReviewIssueById(reviewIssueId);

    if (!issue) {
      return undefined;
    }

    if (issue.status !== "open") {
      throw new Error("Only open review issues can be resolved or dismissed");
    }

    if (!input.note || !input.note.trim()) {
      throw new Error("A note is required when changing review issue status");
    }

    const updatedIssue = await this.reviewIssueRepository.updateReviewIssueStatus(
      reviewIssueId,
      input.status,
    );

    await this.issueEventRepository.createStatusChangedEvent({
      reviewIssueId,
      fromStatus: issue.status,
      toStatus: input.status,
      note: input.note.trim(),
    });

    return updatedIssue;
  }
}

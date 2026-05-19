import { db } from "../../../db/postgres";
import { IssueEvent } from "../domain/types";

export class IssueEventRepository {
  async listIssueEventsByReviewIssueId(reviewIssueId: string): Promise<IssueEvent[]> {
    const result = await db.query(
      `
            select
                id,
                review_issue_id as "reviewIssueId",
                event_type as "eventType",
                from_status as "fromStatus",
                to_status as "toStatus",
                note,
                metadata,
                created_at as "createdAt"
            from issue_events
            where review_issue_id = $1
            `,
      [reviewIssueId],
    );

    return result.rows;
  }

  async getIssueEventById(issueEventId: string): Promise<IssueEvent | undefined> {
    const result = await db.query(
      `
            select
                id,
                review_issue_id as "reviewIssueId",
                event_type as "eventType",
                from_status as "fromStatus",
                to_status as "toStatus",
                note,
                metadata,
                created_at as "createdAt"
            from issue_events
            where id = $1
            `,
      [issueEventId],
    );

    return result.rows[0];
  }
}

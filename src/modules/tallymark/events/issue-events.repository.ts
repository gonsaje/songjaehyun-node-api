import { db } from "../../../db/postgres";
import { IssueEvent, ReviewIssueStatus } from "../domain/types";

const ISSUE_EVENT_COLUMNS = `
    id,
    review_issue_id as "reviewIssueId",
    event_type as "eventType",
    from_status as "fromStatus",
    to_status as "toStatus",
    note,
    metadata,
    created_at as "createdAt"
`;

export class IssueEventRepository {
  async listIssueEventsByReviewIssueId(reviewIssueId: string): Promise<IssueEvent[]> {
    const result = await db.query(
      `
            select
                ${ISSUE_EVENT_COLUMNS}
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
                ${ISSUE_EVENT_COLUMNS}
            from issue_events
            where id = $1
            `,
      [issueEventId],
    );

    return result.rows[0];
  }

  async createStatusChangedEvent(input: {
    reviewIssueId: string;
    fromStatus: ReviewIssueStatus;
    toStatus: ReviewIssueStatus;
    note: string;
  }): Promise<IssueEvent> {
    const result = await db.query(
      `
        insert into issue_events (
            review_issue_id,
            event_type,
            from_status,
            to_status,
            note,
            metadata
        )
        values (
            $1,
            'status_changed',
            $2,
            $3,
            $4,
            '{}'::jsonb
        )
        returning
            ${ISSUE_EVENT_COLUMNS}
        `,
      [input.reviewIssueId, input.fromStatus, input.toStatus, input.note],
    );

    return result.rows[0];
  }
}

# Tallymark Database README

This folder contains the SQL files for the Tallymark demo.

Tallymark is an AI-assisted review queue for financial operations. The database should model a narrow fund-operations reconciliation workflow:

1. Funds have investors.
2. Funds have transactions.
3. A user can start a reconciliation run for a fund.
4. The reconciliation run creates review issues from deterministic checks.
5. AI may summarize the issues, but AI is not the source of financial truth.
6. Humans resolve or dismiss review issues.
7. Issue events preserve an audit-style history.

The database should prioritize clarity, referential integrity, and workflow state over excessive realism.

---

## Database Goals

The schema should support:

- seeded demo funds
- seeded demo investors
- seeded demo transactions
- persistent reconciliation runs
- persistent review issues
- issue event history
- AI summary storage on reconciliation runs
- deterministic issue metadata stored as JSON
- human review state transitions

This is not a full accounting system, general ledger, ERP, or fund administration platform.

---

## Core Entities

Create SQL files for these tables:

1. `funds`
2. `investors`
3. `transactions`
4. `reconciliation_runs`
5. `review_issues`
6. `issue_events`

Optional later tables can be added, but the MVP should start with these six.

---

---

# Entity Relationships

Tallymark models a narrow fund-operations reconciliation workflow. The relationships should make the workflow easy to reason about:

```
Fund
  ├── has many Investors
  ├── has many Transactions
  └── has many ReconciliationRuns

Investor
  ├── belongs to one Fund
  └── may have many Transactions

Transaction
  ├── belongs to one Fund
  ├── may belong to one Investor
  └── may be linked to many ReviewIssues

ReconciliationRun
  ├── belongs to one Fund
  └── has many ReviewIssues

ReviewIssue
  ├── belongs to one ReconciliationRun
  ├── belongs to one Fund
  ├── may link to one Transaction
  ├── may link to one Investor
  └── has many IssueEvents

IssueEvent
  └── belongs to one ReviewIssue
```

| Parent Table          | Child Table           | Relationship         | Foreign Key                           | Delete Behavior      |
| --------------------- | --------------------- | -------------------- | ------------------------------------- | -------------------- |
| `funds`               | `investors`           | one-to-many          | `investors.fund_id`                   | `on delete cascade`  |
| `funds`               | `transactions`        | one-to-many          | `transactions.fund_id`                | `on delete cascade`  |
| `investors`           | `transactions`        | one-to-many optional | `transactions.investor_id`            | `on delete set null` |
| `funds`               | `reconciliation_runs` | one-to-many          | `reconciliation_runs.fund_id`         | `on delete cascade`  |
| `reconciliation_runs` | `review_issues`       | one-to-many          | `review_issues.reconciliation_run_id` | `on delete cascade`  |
| `funds`               | `review_issues`       | one-to-many          | `review_issues.fund_id`               | `on delete cascade`  |
| `transactions`        | `review_issues`       | one-to-many optional | `review_issues.transaction_id`        | `on delete set null` |
| `investors`           | `review_issues`       | one-to-many optional | `review_issues.investor_id`           | `on delete set null` |
| `review_issues`       | `issue_events`        | one-to-many          | `issue_events.review_issue_id`        | `on delete cascade`  |

### Important Relationship Rules

- transactions.reference should not be unique.
  - Duplicate reference detection is one of the reconciliation checks.
- transactions.investor_id should be nullable.
  - Missing investor detection is one of the reconciliation checks.
- review_issues.transaction_id should be nullable.
  - Some issues are not tied to a specific transaction.
- review_issues.investor_id should be nullable.
  - Some issues are fund-level or unmatched-transaction issues.
- review_issues.fund_id should be stored directly.
  - This makes querying open issues by fund easier.
- issue_events should not update review issue state by itself.
  - The canonical issue state lives on review_issues.status.
  - issue_events records the history of what happened.
- reconciliation_runs.status is the canonical run state.
  - Valid states: queued, processing, completed, failed.
- review_issues.status is the canonical issue state.
  - Valid states: open, resolved, dismissed.

## Naming Conventions

Use:

- snake_case table names
- snake_case column names
- UUID primary keys
- `created_at` and `updated_at` timestamps on all main tables
- foreign keys where relationships exist
- check constraints for known enum-like values
- `numeric(18,2)` for money values
- `jsonb` for flexible metadata
- indexes on common lookup fields

Use PostgreSQL-compatible SQL.

This project uses Supabase Postgres, so SQL should be compatible with Postgres/Supabase.

---

## Required Extensions

If UUID generation is needed, include:

```sql
create extension if not exists "pgcrypto";
```

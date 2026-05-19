create extension if not exists "pgcrypto";

create table funds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  strategy text not null,
  vintage_year int,
  currency text not null default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint funds_vintage_year_check
    check (vintage_year is null or vintage_year between 1900 and 2200),
  constraint funds_currency_check
    check (char_length(currency) = 3)
);

create table investors (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references funds(id) on delete cascade,
  name text not null,
  commitment_amount numeric(18,2) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint investors_commitment_amount_check
    check (commitment_amount >= 0)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references funds(id) on delete cascade,
  investor_id uuid references investors(id) on delete set null,
  transaction_type text not null,
  reference text not null,
  amount numeric(18,2) not null,
  expected_amount numeric(18,2),
  transaction_date date not null,
  settlement_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint transactions_transaction_type_check
    check (
      transaction_type in (
        'capital_call',
        'distribution',
        'management_fee',
        'expense',
        'investment_wire'
      )
    ),
  constraint transactions_expected_amount_check
    check (expected_amount is null or expected_amount >= 0)
);

create table reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references funds(id) on delete cascade,
  status text not null default 'queued',
  started_at timestamptz,
  completed_at timestamptz,
  ai_summary text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint reconciliation_runs_status_check
    check (status in ('queued', 'processing', 'completed', 'failed')),
  constraint reconciliation_runs_completed_after_started_check
    check (
      completed_at is null
      or started_at is null
      or completed_at >= started_at
    )
);

create table review_issues (
  id uuid primary key default gen_random_uuid(),
  reconciliation_run_id uuid not null references reconciliation_runs(id) on delete cascade,
  fund_id uuid not null references funds(id) on delete cascade,
  transaction_id uuid references transactions(id) on delete set null,
  investor_id uuid references investors(id) on delete set null,
  issue_type text not null,
  severity text not null default 'medium',
  status text not null default 'open',
  title text not null,
  description text not null,
  ai_summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint review_issues_issue_type_check
    check (
      issue_type in (
        'missing_investor',
        'duplicate_transaction_reference',
        'capital_call_underpayment',
        'capital_call_overpayment',
        'missing_settlement_date',
        'distribution_without_investor',
        'amount_exceeds_remaining_commitment',
        'unknown_transaction_type'
      )
    ),
  constraint review_issues_severity_check
    check (severity in ('low', 'medium', 'high', 'critical')),
  constraint review_issues_status_check
    check (status in ('open', 'resolved', 'dismissed'))
);

create table issue_events (
  id uuid primary key default gen_random_uuid(),
  review_issue_id uuid not null references review_issues(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint issue_events_event_type_check
    check (
      event_type in (
        'created',
        'ai_summary_generated',
        'status_changed',
        'note_added'
      )
    ),
  constraint issue_events_from_status_check
    check (from_status is null or from_status in ('open', 'resolved', 'dismissed')),
  constraint issue_events_to_status_check
    check (to_status is null or to_status in ('open', 'resolved', 'dismissed'))
);

create index investors_fund_id_idx
  on investors(fund_id);

create index transactions_fund_id_idx
  on transactions(fund_id);

create index transactions_investor_id_idx
  on transactions(investor_id);

create index transactions_reference_idx
  on transactions(reference);

create index reconciliation_runs_fund_id_idx
  on reconciliation_runs(fund_id);

create index reconciliation_runs_status_idx
  on reconciliation_runs(status);

create index review_issues_reconciliation_run_id_idx
  on review_issues(reconciliation_run_id);

create index review_issues_fund_id_idx
  on review_issues(fund_id);

create index review_issues_status_idx
  on review_issues(status);

create index review_issues_issue_type_idx
  on review_issues(issue_type);

create index issue_events_review_issue_id_idx
  on issue_events(review_issue_id);

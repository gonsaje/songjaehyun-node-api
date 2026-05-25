truncate table
  issue_events,
  review_issues,
  reconciliation_runs,
  transactions,
  investors,
  funds
cascade;

insert into funds (
  id,
  name,
  strategy,
  vintage_year,
  currency,
  metadata
) values
(
  '11111111-1111-1111-1111-111111111111',
  'Northstar Private Markets Fund I',
  'Lower middle-market buyout',
  2021,
  'USD',
  '{"demo": true, "region": "North America", "administrator": "Apex Fund Services"}'::jsonb
),
(
  '11111111-1111-1111-1111-111111111112',
  'Harbor Credit Opportunities II',
  'Private credit',
  2023,
  'USD',
  '{"demo": true, "region": "North America", "administrator": "Cobalt Fund Admin"}'::jsonb
),
(
  '11111111-1111-1111-1111-111111111113',
  'Pacific Infrastructure Fund III',
  'Core-plus infrastructure',
  2022,
  'USD',
  '{"demo": true, "region": "Asia-Pacific", "administrator": "Waypoint Fund Services"}'::jsonb
);

insert into investors (
  id,
  fund_id,
  name,
  commitment_amount,
  metadata
) values
(
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111111',
  'Aster Capital Partners',
  5000000.00,
  '{"investor_type": "institutional", "country": "US"}'::jsonb
),
(
  '22222222-2222-2222-2222-222222222202',
  '11111111-1111-1111-1111-111111111111',
  'Blue Ridge Endowment',
  2500000.00,
  '{"investor_type": "endowment", "country": "US"}'::jsonb
),
(
  '22222222-2222-2222-2222-222222222203',
  '11111111-1111-1111-1111-111111111111',
  'Cedar Family Office',
  1000000.00,
  '{"investor_type": "family_office", "country": "US"}'::jsonb
),
(
  '22222222-2222-2222-2222-222222222204',
  '11111111-1111-1111-1111-111111111112',
  'Mariner Pension Trust',
  8000000.00,
  '{"investor_type": "pension", "country": "US"}'::jsonb
),
(
  '22222222-2222-2222-2222-222222222205',
  '11111111-1111-1111-1111-111111111112',
  'Summit Insurance Co.',
  4000000.00,
  '{"investor_type": "insurance", "country": "US"}'::jsonb
),
(
  '22222222-2222-2222-2222-222222222206',
  '11111111-1111-1111-1111-111111111113',
  'Pacific State Retirement System',
  10000000.00,
  '{"investor_type": "pension", "country": "US"}'::jsonb
),
(
  '22222222-2222-2222-2222-222222222207',
  '11111111-1111-1111-1111-111111111113',
  'Kauri University Foundation',
  3500000.00,
  '{"investor_type": "foundation", "country": "NZ"}'::jsonb
),
(
  '22222222-2222-2222-2222-222222222208',
  '11111111-1111-1111-1111-111111111113',
  'Lighthouse Family Capital',
  1750000.00,
  '{"investor_type": "family_office", "country": "SG"}'::jsonb
);

insert into transactions (
  id,
  fund_id,
  investor_id,
  transaction_type,
  reference,
  amount,
  expected_amount,
  transaction_date,
  settlement_date,
  metadata
) values
-- Clean Northstar capital calls.
(
  '33333333-3333-3333-3333-333333333301',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'capital_call',
  'NS-CC-2024-001-ASTER',
  500000.00,
  500000.00,
  '2024-01-15',
  '2024-01-18',
  '{"batch": "2024-Q1", "source": "admin_upload"}'::jsonb
),
(
  '33333333-3333-3333-3333-333333333302',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222202',
  'capital_call',
  'NS-CC-2024-001-BLUE',
  250000.00,
  250000.00,
  '2024-01-15',
  '2024-01-18',
  '{"batch": "2024-Q1", "source": "admin_upload"}'::jsonb
),

-- Duplicate transaction reference.
(
  '33333333-3333-3333-3333-333333333303',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222202',
  'capital_call',
  'NS-CC-2024-DUP-007',
  180000.00,
  180000.00,
  '2024-02-01',
  '2024-02-05',
  '{"batch": "2024-Q1", "source": "bank_file"}'::jsonb
),
(
  '33333333-3333-3333-3333-333333333304',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222203',
  'capital_call',
  'NS-CC-2024-DUP-007',
  95000.00,
  95000.00,
  '2024-02-01',
  '2024-02-05',
  '{"batch": "2024-Q1", "source": "bank_file"}'::jsonb
),

-- Underpayment and overpayment cases.
(
  '33333333-3333-3333-3333-333333333305',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222202',
  'capital_call',
  'NS-CC-2024-UNDER-011',
  200000.00,
  250000.00,
  '2024-03-01',
  '2024-03-05',
  '{"batch": "2024-Q1", "variance": -50000}'::jsonb
),
(
  '33333333-3333-3333-3333-333333333306',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222203',
  'capital_call',
  'NS-CC-2024-OVER-014',
  125000.00,
  100000.00,
  '2024-03-01',
  '2024-03-05',
  '{"batch": "2024-Q1", "variance": 25000}'::jsonb
),

-- Missing settlement date.
(
  '33333333-3333-3333-3333-333333333307',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'capital_call',
  'NS-CC-2024-NO-SETTLE',
  300000.00,
  300000.00,
  '2024-04-01',
  null,
  '{"batch": "2024-Q2", "source": "admin_upload"}'::jsonb
),

-- Distribution without investor.
(
  '33333333-3333-3333-3333-333333333308',
  '11111111-1111-1111-1111-111111111111',
  null,
  'distribution',
  'NS-DIST-2024-NO-INVESTOR',
  75000.00,
  null,
  '2024-04-15',
  '2024-04-17',
  '{"batch": "2024-Q2", "source": "bank_file"}'::jsonb
),

-- Amount exceeds remaining commitment for Cedar Family Office.
(
  '33333333-3333-3333-3333-333333333309',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222203',
  'capital_call',
  'NS-CC-2024-EXCEEDS-COMMITMENT',
  1500000.00,
  1500000.00,
  '2024-05-01',
  '2024-05-03',
  '{"batch": "2024-Q2", "remaining_commitment_before_call": 780000}'::jsonb
),

-- Source file contained an unsupported raw type, normalized here for schema compatibility.
(
  '33333333-3333-3333-3333-333333333310',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222201',
  'investment_wire',
  'NS-RAW-2024-UNSUPPORTED-TYPE',
  10000.00,
  null,
  '2024-06-01',
  '2024-06-03',
  '{"raw_transaction_type": "partner_rebate", "source": "legacy_csv"}'::jsonb
),

-- Harbor clean private-credit activity.
(
  '33333333-3333-3333-3333-333333333401',
  '11111111-1111-1111-1111-111111111112',
  '22222222-2222-2222-2222-222222222204',
  'capital_call',
  'HC-CC-2024-001-MARINER',
  800000.00,
  800000.00,
  '2024-02-10',
  '2024-02-13',
  '{"batch": "2024-Q1", "source": "admin_upload"}'::jsonb
),
(
  '33333333-3333-3333-3333-333333333402',
  '11111111-1111-1111-1111-111111111112',
  '22222222-2222-2222-2222-222222222205',
  'management_fee',
  'HC-MF-2024-001-SUMMIT',
  40000.00,
  40000.00,
  '2024-03-31',
  '2024-04-02',
  '{"batch": "2024-Q1", "source": "admin_upload"}'::jsonb
),

-- Pacific infrastructure activity with a smaller set of review cases.
(
  '33333333-3333-3333-3333-333333333501',
  '11111111-1111-1111-1111-111111111113',
  '22222222-2222-2222-2222-222222222206',
  'capital_call',
  'PI-CC-2024-001-PSRS',
  1000000.00,
  1000000.00,
  '2024-01-20',
  '2024-01-24',
  '{"batch": "2024-Q1", "source": "admin_upload", "asset": "renewables_platform"}'::jsonb
),
(
  '33333333-3333-3333-3333-333333333502',
  '11111111-1111-1111-1111-111111111113',
  '22222222-2222-2222-2222-222222222207',
  'capital_call',
  'PI-CC-2024-001-KAURI',
  300000.00,
  350000.00,
  '2024-01-20',
  '2024-01-25',
  '{"batch": "2024-Q1", "source": "bank_file", "asset": "renewables_platform", "variance": -50000}'::jsonb
),
(
  '33333333-3333-3333-3333-333333333503',
  '11111111-1111-1111-1111-111111111113',
  '22222222-2222-2222-2222-222222222208',
  'capital_call',
  'PI-CC-2024-NO-SETTLE',
  175000.00,
  175000.00,
  '2024-02-15',
  null,
  '{"batch": "2024-Q1", "source": "admin_upload", "asset": "data_center_joint_venture"}'::jsonb
),
(
  '33333333-3333-3333-3333-333333333504',
  '11111111-1111-1111-1111-111111111113',
  '22222222-2222-2222-2222-222222222206',
  'distribution',
  'PI-DIST-2024-001-PSRS',
  120000.00,
  null,
  '2024-04-12',
  '2024-04-16',
  '{"batch": "2024-Q2", "source": "admin_upload", "asset": "toll_road_exit"}'::jsonb
),
(
  '33333333-3333-3333-3333-333333333505',
  '11111111-1111-1111-1111-111111111113',
  null,
  'expense',
  'PI-EXP-2024-UNMATCHED',
  8500.00,
  null,
  '2024-04-30',
  '2024-05-02',
  '{"batch": "2024-Q2", "source": "bank_file", "expense_category": "project_due_diligence"}'::jsonb
);

insert into reconciliation_runs (
  id,
  fund_id,
  status,
  scheduled_at,
  trigger_run_id,
  started_at,
  completed_at,
  ai_summary,
  metadata
) values
(
  '44444444-4444-4444-4444-444444444401',
  '11111111-1111-1111-1111-111111111111',
  'completed',
  null,
  'run_seeded_northstar_completed',
  now() - interval '30 minutes',
  now() - interval '27 minutes',
  'Northstar Fund I has several review items concentrated in Q1 and Q2 activity: duplicate references, payment variances, missing settlement data, unmatched distribution activity, and one source-file transaction type that needs human classification.',
  '{"seeded": true, "checks_run": 8, "issues_created": 7}'::jsonb
),
(
  '44444444-4444-4444-4444-444444444402',
  '11111111-1111-1111-1111-111111111112',
  'queued',
  now() + interval '2 hours',
  null,
  null,
  null,
  null,
  '{"seeded": true, "note": "queued example for status UI"}'::jsonb
),
(
  '44444444-4444-4444-4444-444444444403',
  '11111111-1111-1111-1111-111111111113',
  'completed',
  null,
  'run_seeded_pacific_completed',
  now() - interval '18 minutes',
  now() - interval '15 minutes',
  'Pacific Infrastructure Fund III has a concise review set: one capital call shortfall, one missing settlement date, and one unmatched expense row that should be classified before reporting.',
  '{"seeded": true, "checks_run": 8, "issues_created": 3}'::jsonb
);

insert into review_issues (
  id,
  reconciliation_run_id,
  fund_id,
  transaction_id,
  investor_id,
  issue_type,
  severity,
  status,
  title,
  description,
  ai_summary,
  metadata
) values
(
  '55555555-5555-5555-5555-555555555501',
  '44444444-4444-4444-4444-444444444401',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333303',
  '22222222-2222-2222-2222-222222222202',
  'duplicate_transaction_reference',
  'high',
  'open',
  'Duplicate transaction reference NS-CC-2024-DUP-007',
  'Two capital call transactions in Northstar Fund I share the same external reference.',
  'Review both transactions with reference NS-CC-2024-DUP-007 and confirm whether one is a duplicate bank-file row or whether the reference was reused incorrectly.',
  '{"matching_transaction_ids": ["33333333-3333-3333-3333-333333333303", "33333333-3333-3333-3333-333333333304"]}'::jsonb
),
(
  '55555555-5555-5555-5555-555555555502',
  '44444444-4444-4444-4444-444444444401',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333305',
  '22222222-2222-2222-2222-222222222202',
  'capital_call_underpayment',
  'medium',
  'open',
  'Capital call underpayment for Blue Ridge Endowment',
  'Expected amount was 250000.00 but received amount was 200000.00.',
  'Blue Ridge Endowment appears to be short by 50000.00 on the March 2024 capital call. Confirm whether this is a partial settlement, timing issue, or allocation error.',
  '{"expected_amount": 250000.00, "actual_amount": 200000.00, "variance": -50000.00}'::jsonb
),
(
  '55555555-5555-5555-5555-555555555503',
  '44444444-4444-4444-4444-444444444401',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333306',
  '22222222-2222-2222-2222-222222222203',
  'capital_call_overpayment',
  'medium',
  'resolved',
  'Capital call overpayment for Cedar Family Office',
  'Expected amount was 100000.00 but received amount was 125000.00.',
  'Cedar Family Office paid 25000.00 over the expected amount. Reviewer should confirm whether the excess should be applied to a future call or returned.',
  '{"expected_amount": 100000.00, "actual_amount": 125000.00, "variance": 25000.00}'::jsonb
),
(
  '55555555-5555-5555-5555-555555555504',
  '44444444-4444-4444-4444-444444444401',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333307',
  '22222222-2222-2222-2222-222222222201',
  'missing_settlement_date',
  'low',
  'dismissed',
  'Missing settlement date for NS-CC-2024-NO-SETTLE',
  'The transaction has a transaction date but no settlement date.',
  'This looks like an incomplete administrative field rather than a cash variance. Confirm settlement date from bank records if needed.',
  '{"field": "settlement_date"}'::jsonb
),
(
  '55555555-5555-5555-5555-555555555505',
  '44444444-4444-4444-4444-444444444401',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333308',
  null,
  'distribution_without_investor',
  'critical',
  'open',
  'Distribution is not linked to an investor',
  'A distribution transaction exists without an investor association.',
  'This distribution cannot be reviewed against investor ownership until it is matched to the correct investor record or corrected in the source file.',
  '{"reference": "NS-DIST-2024-NO-INVESTOR"}'::jsonb
),
(
  '55555555-5555-5555-5555-555555555506',
  '44444444-4444-4444-4444-444444444401',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333309',
  '22222222-2222-2222-2222-222222222203',
  'amount_exceeds_remaining_commitment',
  'critical',
  'open',
  'Capital call exceeds remaining commitment',
  'The transaction amount is greater than the investor remaining commitment stored in metadata.',
  'Cedar Family Office has a 1500000.00 capital call against a remaining commitment of 780000.00. Review commitment schedule and call allocation before approval.',
  '{"remaining_commitment_before_call": 780000.00, "actual_amount": 1500000.00}'::jsonb
),
(
  '55555555-5555-5555-5555-555555555507',
  '44444444-4444-4444-4444-444444444401',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333310',
  '22222222-2222-2222-2222-222222222201',
  'unknown_transaction_type',
  'high',
  'open',
  'Unsupported raw transaction type partner_rebate',
  'The source file contained a raw transaction type that is not part of the supported reconciliation taxonomy.',
  'The row was normalized for storage, but the raw type partner_rebate needs human classification before downstream treatment is trusted.',
  '{"raw_transaction_type": "partner_rebate", "stored_transaction_type": "investment_wire"}'::jsonb
),
(
  '55555555-5555-5555-5555-555555555508',
  '44444444-4444-4444-4444-444444444403',
  '11111111-1111-1111-1111-111111111113',
  '33333333-3333-3333-3333-333333333502',
  '22222222-2222-2222-2222-222222222207',
  'capital_call_underpayment',
  'medium',
  'open',
  'Capital call underpayment for Kauri University Foundation',
  'Expected amount was 350000.00 but received amount was 300000.00.',
  'Kauri University Foundation appears to be short by 50000.00 on the January infrastructure capital call. Confirm whether this is a timing issue or a bank-file allocation mismatch.',
  '{"expected_amount": 350000.00, "actual_amount": 300000.00, "variance": -50000.00}'::jsonb
),
(
  '55555555-5555-5555-5555-555555555509',
  '44444444-4444-4444-4444-444444444403',
  '11111111-1111-1111-1111-111111111113',
  '33333333-3333-3333-3333-333333333503',
  '22222222-2222-2222-2222-222222222208',
  'missing_settlement_date',
  'low',
  'open',
  'Missing settlement date for PI-CC-2024-NO-SETTLE',
  'The transaction has a transaction date but no settlement date.',
  'This looks like an incomplete administrative field on the data center joint venture call. Confirm settlement date from bank records before closing the run.',
  '{"field": "settlement_date", "asset": "data_center_joint_venture"}'::jsonb
),
(
  '55555555-5555-5555-5555-555555555510',
  '44444444-4444-4444-4444-444444444403',
  '11111111-1111-1111-1111-111111111113',
  '33333333-3333-3333-3333-333333333505',
  null,
  'missing_investor',
  'medium',
  'open',
  'Expense row is not linked to an investor',
  'An expense transaction exists without an investor association.',
  'The unmatched project due-diligence expense should be classified as fund-level or allocated to an investor before investor reporting is finalized.',
  '{"reference": "PI-EXP-2024-UNMATCHED", "expense_category": "project_due_diligence"}'::jsonb
);

insert into issue_events (
  id,
  review_issue_id,
  event_type,
  from_status,
  to_status,
  note,
  metadata,
  created_at
) values
(
  '66666666-6666-6666-6666-666666666501',
  '55555555-5555-5555-5555-555555555501',
  'created',
  null,
  'open',
  'Issue created by deterministic duplicate reference check.',
  '{"system": "reconciliation"}'::jsonb,
  now() - interval '27 minutes'
),
(
  '66666666-6666-6666-6666-666666666502',
  '55555555-5555-5555-5555-555555555502',
  'created',
  null,
  'open',
  'Issue created by deterministic capital call variance check.',
  '{"system": "reconciliation"}'::jsonb,
  now() - interval '27 minutes'
),
(
  '66666666-6666-6666-6666-666666666503',
  '55555555-5555-5555-5555-555555555503',
  'created',
  null,
  'open',
  'Issue created by deterministic capital call variance check.',
  '{"system": "reconciliation"}'::jsonb,
  now() - interval '27 minutes'
),
(
  '66666666-6666-6666-6666-666666666504',
  '55555555-5555-5555-5555-555555555503',
  'status_changed',
  'open',
  'resolved',
  'Reviewed against cash detail. Excess was confirmed as an intended prepayment for the next capital call.',
  '{"reviewer": "demo.reviewer"}'::jsonb,
  now() - interval '12 minutes'
),
(
  '66666666-6666-6666-6666-666666666505',
  '55555555-5555-5555-5555-555555555504',
  'created',
  null,
  'open',
  'Issue created by deterministic missing settlement date check.',
  '{"system": "reconciliation"}'::jsonb,
  now() - interval '27 minutes'
),
(
  '66666666-6666-6666-6666-666666666506',
  '55555555-5555-5555-5555-555555555504',
  'status_changed',
  'open',
  'dismissed',
  'Dismissed for demo purposes after confirming this row was still pending bank settlement.',
  '{"reviewer": "demo.reviewer"}'::jsonb,
  now() - interval '10 minutes'
),
(
  '66666666-6666-6666-6666-666666666507',
  '55555555-5555-5555-5555-555555555505',
  'created',
  null,
  'open',
  'Issue created by deterministic distribution investor check.',
  '{"system": "reconciliation"}'::jsonb,
  now() - interval '27 minutes'
),
(
  '66666666-6666-6666-6666-666666666508',
  '55555555-5555-5555-5555-555555555506',
  'created',
  null,
  'open',
  'Issue created by deterministic remaining commitment check.',
  '{"system": "reconciliation"}'::jsonb,
  now() - interval '27 minutes'
),
(
  '66666666-6666-6666-6666-666666666509',
  '55555555-5555-5555-5555-555555555507',
  'created',
  null,
  'open',
  'Issue created from unsupported source transaction type metadata.',
  '{"system": "reconciliation"}'::jsonb,
  now() - interval '27 minutes'
),
(
  '66666666-6666-6666-6666-666666666510',
  '55555555-5555-5555-5555-555555555501',
  'ai_summary_generated',
  null,
  null,
  'AI summary generated from deterministic issue context.',
  '{"model_boundary": "summary_only"}'::jsonb,
  now() - interval '26 minutes'
),
(
  '66666666-6666-6666-6666-666666666511',
  '55555555-5555-5555-5555-555555555508',
  'created',
  null,
  'open',
  'Issue created by deterministic capital call variance check.',
  '{"system": "reconciliation"}'::jsonb,
  now() - interval '15 minutes'
),
(
  '66666666-6666-6666-6666-666666666512',
  '55555555-5555-5555-5555-555555555509',
  'created',
  null,
  'open',
  'Issue created by deterministic missing settlement date check.',
  '{"system": "reconciliation"}'::jsonb,
  now() - interval '15 minutes'
),
(
  '66666666-6666-6666-6666-666666666513',
  '55555555-5555-5555-5555-555555555510',
  'created',
  null,
  'open',
  'Issue created by deterministic missing investor check.',
  '{"system": "reconciliation"}'::jsonb,
  now() - interval '15 minutes'
),
(
  '66666666-6666-6666-6666-666666666514',
  '55555555-5555-5555-5555-555555555508',
  'ai_summary_generated',
  null,
  null,
  'AI summary generated from deterministic issue context.',
  '{"model_boundary": "summary_only"}'::jsonb,
  now() - interval '14 minutes'
);

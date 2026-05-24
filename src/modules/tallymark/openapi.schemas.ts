export const errorResponseSchema = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        code: { type: "string" },
        message: { type: "string" },
      },
      required: ["code", "message"],
    },
  },
  required: ["error"],
} as const;

export const reconciliationRunSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    fundId: { type: "string", format: "uuid" },
    status: { type: "string", enum: ["queued", "processing", "completed", "failed"] },
    startedAt: { type: "string", nullable: true },
    completedAt: { type: "string", nullable: true },
    aiSummary: { type: "string", nullable: true },
    errorMessage: { type: "string", nullable: true },
    metadata: { type: "object", additionalProperties: true },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
  required: [
    "id",
    "fundId",
    "status",
    "startedAt",
    "completedAt",
    "aiSummary",
    "errorMessage",
    "metadata",
    "createdAt",
    "updatedAt",
  ],
} as const;

export const reviewIssueSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    reconciliationRunId: { type: "string", format: "uuid" },
    fundId: { type: "string", format: "uuid" },
    transactionId: { type: "string", format: "uuid", nullable: true },
    investorId: { type: "string", format: "uuid", nullable: true },
    issueType: {
      type: "string",
      enum: [
        "missing_investor",
        "duplicate_transaction_reference",
        "capital_call_underpayment",
        "capital_call_overpayment",
        "missing_settlement_date",
        "distribution_without_investor",
        "amount_exceeds_remaining_commitment",
        "unknown_transaction_type",
      ],
    },
    severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
    status: { type: "string", enum: ["open", "resolved", "dismissed"] },
    title: { type: "string" },
    description: { type: "string" },
    aiSummary: { type: "string", nullable: true },
    metadata: { type: "object", additionalProperties: true },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
  required: [
    "id",
    "reconciliationRunId",
    "fundId",
    "transactionId",
    "investorId",
    "issueType",
    "severity",
    "status",
    "title",
    "description",
    "aiSummary",
    "metadata",
    "createdAt",
    "updatedAt",
  ],
} as const;

export const reconciliationRunParamsSchema = {
  type: "object",
  properties: {
    reconciliationRunId: { type: "string", format: "uuid" },
  },
  required: ["reconciliationRunId"],
} as const;

export const fundParamsSchema = {
  type: "object",
  properties: {
    fundId: { type: "string", format: "uuid" },
  },
  required: ["fundId"],
} as const;

export const reviewIssueParamsSchema = {
  type: "object",
  properties: {
    reviewIssueId: { type: "string", format: "uuid" },
  },
  required: ["reviewIssueId"],
} as const;

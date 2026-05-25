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
    status: {
      type: "string",
      enum: ["queued", "processing", "completed", "failed", "cancelled"],
    },
    startedAt: { type: "string", nullable: true },
    completedAt: { type: "string", nullable: true },
    scheduledAt: { type: "string", nullable: true },
    triggerRunId: { type: "string", nullable: true },
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
    "scheduledAt",
    "triggerRunId",
    "aiSummary",
    "errorMessage",
    "metadata",
    "createdAt",
    "updatedAt",
  ],
} as const;

export const batchReconciliationRunBodySchema = {
  type: "object",
  properties: {
    fundIds: {
      type: "array",
      minItems: 1,
      items: { type: "string", format: "uuid" },
    },
  },
  required: ["fundIds"],
} as const;

export const batchReconciliationRunResponseSchema = {
  type: "object",
  properties: {
    runs: {
      type: "array",
      items: reconciliationRunSchema,
    },
  },
  required: ["runs"],
} as const;

export const scheduledReconciliationRunBodySchema = {
  type: "object",
  properties: {
    scheduledAt: { type: "string", format: "date-time" },
  },
  required: ["scheduledAt"],
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

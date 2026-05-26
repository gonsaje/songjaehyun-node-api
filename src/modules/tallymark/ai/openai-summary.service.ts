import OpenAI from "openai";
import type { AiSummaryService, ReconciliationSummaryInput } from "./ai-summary.types";
import type { CreateReviewIssueInput } from "../domain/types";

interface OpenAiResponsesClient {
  responses: {
    create(input: {
      model: string;
      instructions: string;
      input: string;
      max_output_tokens: number;
    }): Promise<{ output_text: string }>;
  };
}

export class OpenAiSummaryService implements AiSummaryService {
  constructor(
    private readonly client: OpenAiResponsesClient = new OpenAI(),
    private readonly model = process.env.OPENAI_MODEL ?? "gpt-5-mini",
  ) {}

  async summarizeReconciliationRun(input: ReconciliationSummaryInput): Promise<string> {
    if (input.issues.length === 0) {
      return "Reconciliation completed with no review issues.";
    }

    if (process.env.OPENAI_SUMMARY_ENABLED === "false") {
      return this.buildFallbackSummary(input);
    }

    try {
      const response = await this.client.responses.create({
        model: this.model,
        instructions: [
          "You summarize deterministic financial reconciliation review issues for a human financial operations reviewer.",
          "",
          "Rules:",
          "- Use only the issue data provided in the input.",
          "- Do not invent amounts, investors, transaction references, fund details, causes, or resolutions.",
          "- Do not approve, resolve, waive, dismiss, or downgrade any issue.",
          "- If a fact is missing, say it is not provided.",
          "- Keep the tone concise, neutral, and audit-friendly.",
          "- Prefer concrete operational language over vague risk language.",
          "",
          "Output format:",
          "1. Start with a one-sentence overview of the reconciliation run.",
          "2. Include issue counts by severity if severity data is provided.",
          "3. Summarize the most important issue categories.",
          "4. List concrete next review steps for a human operator.",
          "5. End with a clear statement that the issues require human review.",
          "",
          "Do not use markdown tables.",
        ].join("\n"),
        input: JSON.stringify({
          fundName: input.fundName,
          runId: input.runId,
          issueCount: input.issues.length,
          issues: input.issues.map((issue) => ({
            issueType: issue.issueType,
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            metadata: issue.metadata,
          })),
        }),
        max_output_tokens: 450,
      });

      const summary = response.output_text.trim();

      return summary || this.buildFallbackSummary(input);
    } catch {
      return this.buildFallbackSummary(input);
    }
  }

  async summarizeReviewIssue(input: CreateReviewIssueInput): Promise<string> {
    if (process.env.OPENAI_SUMMARY_ENABLED === "false") {
      return this.buildIssueFallbackSummary(input);
    }

    try {
      const response = await this.client.responses.create({
        model: this.model,
        instructions: [
          "You are generating an audit-friendly summary for a single deterministic financial reconciliation review issue.",
          "The audience is a human fund operations reviewer who needs to quickly understand what was flagged and what to verify next.",
          "",
          "Use only the issue data provided in the input.",
          "",
          "Strict rules:",
          "- Do not invent or infer missing amounts, investors, transaction references, fund names, dates, causes, or resolutions.",
          "- Do not say the issue is resolved, approved, waived, dismissed, acceptable, or low risk unless the input explicitly says so.",
          "- Do not recommend accounting treatment, legal conclusions, or operational decisions.",
          "- Do not use dramatic language such as fraud, breach, failure, or critical unless present in the input.",
          "- Do not mention AI, the model, or the prompt.",
          "",
          "Output requirements:",
          "- Write 1 to 2 sentences.",
          "- Use concise, neutral, audit-friendly language.",
          "- First, explain what was flagged.",
          "- Then, explain why it needs review or what specific fact should be checked next.",
          "- If the next check is unclear from the input, say the reviewer should verify the underlying source records.",
        ].join("\n"),
        input: JSON.stringify({
          issueType: input.issueType,
          severity: input.severity,
          title: input.title,
          description: input.description,
          metadata: input.metadata,
        }),
        max_output_tokens: 180,
      });

      const summary = response.output_text.trim();

      return summary || this.buildIssueFallbackSummary(input);
    } catch {
      return this.buildIssueFallbackSummary(input);
    }
  }

  private buildFallbackSummary(input: ReconciliationSummaryInput): string {
    const issueCountBySeverity = input.issues.reduce<Record<string, number>>((counts, issue) => {
      counts[issue.severity] = (counts[issue.severity] ?? 0) + 1;
      return counts;
    }, {});

    const severitySummary = Object.entries(issueCountBySeverity)
      .map(([severity, count]) => `${count} ${severity}`)
      .join(", ");

    return `Reconciliation completed with ${input.issues.length} review issue(s) requiring human review${severitySummary ? `: ${severitySummary}.` : "."}`;
  }

  private buildIssueFallbackSummary(input: CreateReviewIssueInput): string {
    return `${input.title} This ${input.severity} severity ${input.issueType.replaceAll("_", " ")} issue requires human review before the reconciliation can be treated as complete.`;
  }
}

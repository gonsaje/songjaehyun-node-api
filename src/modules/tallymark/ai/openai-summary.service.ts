import OpenAI from "openai";
import type { AiSummaryService, ReconciliationSummaryInput } from "./ai-summary.types";

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
}

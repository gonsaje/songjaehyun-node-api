import { FastifyInstance } from "fastify";
import { registerFundRoutes } from "./funds/fund.routes";
import { registerInvestorRoutes } from "./investors/investor.routes";
import { registerTransactionRoutes } from "./transactions/transaction.routes";
import { registerReconciliationRunRoutes } from "./runs/reconciliation-run.routes";
import { registerReviewIssueRoutes } from "./issues/review-issue.routes";
import { registerIssueEventRoutes } from "./events/issue-events.routes";
import { InMemoryRateLimiter } from "../../shared/rate-limit/in-memory-rate-limiter";

const tallymarkGlobalRateLimiter = new InMemoryRateLimiter(100, 15 * 60 * 1000);
const rateLimitedMethods = new Set(["POST", "PATCH", "PUT", "DELETE"]);
export async function registerTallymarkRoutes(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    if (!rateLimitedMethods.has(request.method)) {
      return;
    }
    const globalRateLimit = tallymarkGlobalRateLimiter.check(`tallymark:global:${request.ip}`);

    if (!globalRateLimit.allowed) {
      return reply
        .code(429)
        .header("Retry-After", String(globalRateLimit.retryAfterSeconds ?? 60))
        .send({
          error: {
            code: "TALLYMARK_RATE_LIMIT_EXCEEDED",
            message: "Too many Tallymark requests. Please try again later.",
          },
        });
    }
  });

  app.register(registerFundRoutes);
  app.register(registerInvestorRoutes);
  app.register(registerTransactionRoutes);
  app.register(registerReconciliationRunRoutes);
  app.register(registerReviewIssueRoutes);
  app.register(registerIssueEventRoutes);
}

import { ReconciliationRun } from "../domain/types";
import { ReconciliationRunRepository } from "./reconciliation-run.repository";
import { FundRepository } from "../funds/fund.repository";

export class ReconciliationRunService {
  constructor(
    private readonly reconciliationRunRepository: ReconciliationRunRepository,
    private readonly fundRepository: FundRepository,
  ) {}

  async startRun(fundId: string): Promise<ReconciliationRun | undefined> {
    const fund = await this.fundRepository.getFundById(fundId);

    if (!fund) {
      return undefined;
    }

    const run = await this.reconciliationRunRepository.createProcessingRun(fundId);

    return this.reconciliationRunRepository.markRunCompleted(
      run.id,
      "Initial reconciliation run completed. Deterministic checks will be added next.",
    );
  }
}

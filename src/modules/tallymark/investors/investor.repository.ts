import { db } from "../../../db/postgres";
import { Investor } from "../domain/types";

export class InvestorRepository {
  async listInvestorsByFundId(fundId: string): Promise<Investor[]> {
    const result = await db.query(
      `
        select
            id,
            fund_id as "fundId",
            name,
            commitment_amount as "commitmentAmount",
            metadata,
            created_at as "createdAt",
            updated_at as "updatedAt"
        from investors
        where fund_id = $1
    `,
      [fundId],
    );

    return result.rows;
  }
}

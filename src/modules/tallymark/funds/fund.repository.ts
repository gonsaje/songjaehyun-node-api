import { db } from "../../../db/postgres";
import { Fund } from "../domain/types";

export class FundRepository {
  async listFunds(): Promise<Fund[]> {
    const result = await db.query(`
            select
                id,
                name,
                strategy,
                vintage_year as "vintageYear",
                currency,
                metadata,
                created_at as "createdAt",
                updated_at as "updatedAt"
            from funds
            order by name asc
        `);

    return result.rows;
  }

  async getFundById(id: string): Promise<Fund | undefined> {
    const result = await db.query(
      `
            select
                id,
                name,
                strategy,
                vintage_year as "vintageYear",
                currency,
                metadata,
                created_at as "createdAt",
                updated_at as "updatedAt"
            from funds
            where id = $1
        `,
      [id],
    );

    return result.rows[0];
  }
}

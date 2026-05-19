import { db } from "../../../db/postgres";
import { Transaction } from "../domain/types";

export class TransactionRepository {
  async listTransactionsByFundId(fundId: string): Promise<Transaction[]> {
    const result = await db.query(
      `
                select
                    id,
                    fund_id as "fundId",
                    investor_id as "investorId",
                    transaction_type as "transactionType",
                    reference,
                    amount,
                    expected_amount as "expectedAmount",
                    metadata,
                    created_at as "createdAt",
                    updated_at as "updatedAt"
                from transactions
                where fund_id = $1
            `,
      [fundId],
    );
    return result.rows;
  }

  async listTransactionsByInvestorId(investorId: string): Promise<Transaction[]> {
    const result = await db.query(
      `
                select
                    id,
                    fund_id as "fundId",
                    investor_id as "investorId",
                    transaction_type as "transactionType",
                    reference,
                    amount,
                    expected_amount as "expectedAmount",
                    metadata,
                    created_at as "createdAt",
                    updated_at as "updatedAt"
                from transactions
                where investor_id = $1
            `,
      [investorId],
    );
    return result.rows;
  }
}

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
                    transaction_date as "transactionDate",
                    settlement_date as "settlementDate",
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
                    transaction_date as "transactionDate",
                    settlement_date as "settlementDate",
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

  async getTransactionById(transactionId: string): Promise<Transaction | undefined> {
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
                    transaction_date as "transactionDate",
                    settlement_date as "settlementDate",
                    metadata,
                    created_at as "createdAt",
                    updated_at as "updatedAt"
                from transactions
                where id = $1
            `,
      [transactionId],
    );
    return result.rows[0];
  }
}

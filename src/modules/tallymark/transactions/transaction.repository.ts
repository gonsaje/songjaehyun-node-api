import { db } from "../../../db/postgres";
import { Transaction } from "../domain/types";

const TRANSACTION_COLUMNS = `
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
`;

export class TransactionRepository {
  async listTransactionsByFundId(fundId: string): Promise<Transaction[]> {
    const result = await db.query(
      `
                select
                    ${TRANSACTION_COLUMNS}
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
                    ${TRANSACTION_COLUMNS}
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
                    ${TRANSACTION_COLUMNS}
                from transactions
                where id = $1
            `,
      [transactionId],
    );
    return result.rows[0];
  }

  async updateSettlementDate(
    transactionId: string,
    settlementDate: string,
  ): Promise<Transaction | undefined> {
    const result = await db.query(
      `
        update transactions
        set
          settlement_date = $2,
          updated_at = now()
        where id = $1
        returning
          ${TRANSACTION_COLUMNS}
      `,
      [transactionId, settlementDate],
    );

    return result.rows[0];
  }

  async assignInvestor(
    transactionId: string,
    investorId: string,
  ): Promise<Transaction | undefined> {
    const result = await db.query(
      `
        update transactions
        set
          investor_id = $2,
          updated_at = now()
        where id = $1
        returning
          ${TRANSACTION_COLUMNS}
      `,
      [transactionId, investorId],
    );

    return result.rows[0];
  }

  async updateReference(
    transactionId: string,
    reference: string,
  ): Promise<Transaction | undefined> {
    const result = await db.query(
      `
        update transactions
        set
          reference = $2,
          updated_at = now()
        where id = $1
        returning
          ${TRANSACTION_COLUMNS}
      `,
      [transactionId, reference],
    );

    return result.rows[0];
  }

  async updateTransactionType(
    transactionId: string,
    transactionType: Transaction["transactionType"],
  ): Promise<Transaction | undefined> {
    const result = await db.query(
      `
        update transactions
        set
          transaction_type = $2,
          updated_at = now()
        where id = $1
        returning
          ${TRANSACTION_COLUMNS}
      `,
      [transactionId, transactionType],
    );

    return result.rows[0];
  }
}

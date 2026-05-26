import { Pool } from "pg";

let pool: Pool | undefined;

function getPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  pool ??= new Pool({
    connectionString,
  });

  return pool;
}

export const db = {
  get query() {
    return getPool().query.bind(getPool());
  },
} as Pick<Pool, "query">;

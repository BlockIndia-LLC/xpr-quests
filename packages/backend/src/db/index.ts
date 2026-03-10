import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://quests:quests_dev@localhost:5432/xpr_quests",
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;

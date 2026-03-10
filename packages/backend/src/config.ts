import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

// Load .env from monorepo root
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

const envSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  XPR_RPC_ENDPOINT: z.string(),
  XPR_HYPERION_ENDPOINT: z.string(),
  XPR_NETWORK: z.enum(["testnet", "mainnet"]),
  CONTRACT_ACCOUNT: z.string(),
  ADMIN_ACCOUNTS: z
    .string()
    .transform((val) => val.split(",").map((s) => s.trim()).filter(Boolean)),
  SERVER_PRIVATE_KEY: z.string().default(""),
  BACKEND_PORT: z
    .string()
    .default("3000")
    .transform((val) => Number(val))
    .pipe(z.number().int().positive()),
  JWT_SECRET: z.string(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return result.data;
}

export const env = loadEnv();

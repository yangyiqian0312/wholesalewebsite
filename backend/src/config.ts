import "dotenv/config";
import { z } from "zod";

const PUBLIC_APP_URL = "https://wholesale.crossingtcg.com";

function isLocalhostUrl(value: string) {
  try {
    const parsed = new URL(value);
    return (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1"
    );
  } catch {
    return false;
  }
}

function normalizePublicUrl(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();

  if (!trimmed || isLocalhostUrl(trimmed)) {
    return fallback;
  }

  return trimmed;
}

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().url().default(PUBLIC_APP_URL),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ADMIN_API_TOKEN: z.string().min(1, "ADMIN_API_TOKEN is required"),
  APP_BASE_URL: z.string().url().default(PUBLIC_APP_URL),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  PRODUCT_SYNC_ENABLED: z.coerce.boolean().default(true),
  PRODUCT_SYNC_INTERVAL_MINUTES: z.coerce.number().int().positive().default(15),
  INFLOW_BASE_URL: z.string().url().default("https://cloudapi.inflowinventory.com"),
  INFLOW_COMPANY_ID: z.string().min(1, "INFLOW_COMPANY_ID is required"),
  INFLOW_API_KEY: z.string().min(1, "INFLOW_API_KEY is required"),
});

const parsedEnv = envSchema.parse({
  ...process.env,
  FRONTEND_ORIGIN: normalizePublicUrl(process.env.FRONTEND_ORIGIN, PUBLIC_APP_URL),
  APP_BASE_URL: normalizePublicUrl(process.env.APP_BASE_URL, PUBLIC_APP_URL),
});

export const config = parsedEnv;

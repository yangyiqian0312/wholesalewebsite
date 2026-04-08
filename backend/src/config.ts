import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().url().default("http://127.0.0.1:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ADMIN_API_TOKEN: z.string().min(1, "ADMIN_API_TOKEN is required"),
  APP_BASE_URL: z.string().url().default("http://127.0.0.1:3000"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  PRODUCT_SYNC_ENABLED: z.coerce.boolean().default(true),
  PRODUCT_SYNC_INTERVAL_MINUTES: z.coerce.number().int().positive().default(15),
  INFLOW_BASE_URL: z.string().url().default("https://cloudapi.inflowinventory.com"),
  INFLOW_COMPANY_ID: z.string().min(1, "INFLOW_COMPANY_ID is required"),
  INFLOW_API_KEY: z.string().min(1, "INFLOW_API_KEY is required"),
});

export const config = envSchema.parse(process.env);

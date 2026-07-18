import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Runtime-validated, strongly typed environment configuration.
 * Import `env` anywhere instead of reading `process.env` directly.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRE: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_REFRESH_EXPIRE: z.string().default('7d'),

  CLIENT_URL: z.string().url().default('http://localhost:3000'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),

  // Optional: SMTP email (nodemailer). When unset, email features degrade gracefully.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Optional: OpenAI for AI assist. When unset, AI endpoints return a helpful 503.
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  // Optional: Twilio for WhatsApp/SMS. When unset, messaging endpoints return a helpful 503.
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_SMS_FROM: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  // Fail fast: the app cannot run safely without valid configuration.
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDevelopment = env.NODE_ENV === 'development';

/** Feature availability flags derived from optional configuration. */
export const isEmailConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);
export const isAiConfigured = Boolean(env.OPENAI_API_KEY);
export const isTwilioConfigured = Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN);

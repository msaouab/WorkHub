import { z } from 'zod';

export const ENV_DEFAULTS = {
  NODE_ENV: 'development' as const,
  HOST: '0.0.0.0',
  PORT: 3333,
  API_PREFIX: 'api/v1',
  /** Mounted outside the API prefix (e.g. /docs, not /api/v1/docs). */
  SWAGGER_PATH: 'docs',
} as const;

/** Strict env flags only — typos like "flase" fail startup. */
const booleanFlagSchema = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

/** Optional string where an empty value (`SMTP_USER=`) means "not set". */
const optionalStringSchema = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional();

const corsOriginsSchema = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  )
  .pipe(z.array(z.string().url()).min(1));

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default(ENV_DEFAULTS.NODE_ENV),
  HOST: z.string().default(ENV_DEFAULTS.HOST),
  PORT: z.coerce.number().int().positive().default(ENV_DEFAULTS.PORT),
  /** Public base URL of this API (no trailing slash), e.g. https://api.workhub.app */
  APP_URL: z.string().url(),
  API_PREFIX: z.string().default(ENV_DEFAULTS.API_PREFIX),
  SWAGGER_PATH: z.string().default(ENV_DEFAULTS.SWAGGER_PATH),
  SWAGGER_ENABLED: booleanFlagSchema.optional(),
  /** Comma-separated browser origins allowed to call the API */
  CORS_ORIGINS: corsOriginsSchema,
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  /** SMTP server (Mailpit locally: localhost:1025, inbox at http://localhost:8025) */
  SMTP_HOST: z.string().trim().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  /** true = TLS from the first byte (port 465); false = plain or STARTTLS (1025, 587) */
  SMTP_SECURE: booleanFlagSchema.default(false),
  SMTP_USER: optionalStringSchema,
  SMTP_PASS: optionalStringSchema,
  /** Sender shown to users, e.g. "WorkHub <no-reply@workhub.app>" */
  MAIL_FROM: z.string().trim().min(1),
}).refine((env) => Boolean(env.SMTP_USER) === Boolean(env.SMTP_PASS), {
  message: 'SMTP_USER and SMTP_PASS must be set together (or both left empty)',
  path: ['SMTP_PASS'],
});

export type ParsedEnv = z.infer<typeof envSchema>;

/** Env after defaults are applied (Swagger enabled unless production). */
export type Env = Omit<ParsedEnv, 'SWAGGER_ENABLED'> & {
  SWAGGER_ENABLED: boolean;
};

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid server environment: ${details}`);
  }

  const env = parsed.data;
  return {
    ...env,
    SWAGGER_ENABLED:
      env.SWAGGER_ENABLED ?? env.NODE_ENV !== 'production',
  };
}

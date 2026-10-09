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
const swaggerEnabledSchema = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

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
  SWAGGER_ENABLED: swaggerEnabledSchema.optional(),
  /** Comma-separated browser origins allowed to call the API */
  CORS_ORIGINS: corsOriginsSchema,
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

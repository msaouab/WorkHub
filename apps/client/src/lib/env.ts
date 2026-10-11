import { z } from 'zod';

const clientEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  /** API origin only (no trailing slash), e.g. https://api.workhub.app */
  NEXT_PUBLIC_API_URL: z.string().url(),
  /** Must match server API_PREFIX */
  NEXT_PUBLIC_API_PREFIX: z.string().default('api/v1'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

function readClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_PREFIX: process.env.NEXT_PUBLIC_API_PREFIX,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid client environment: ${details}`);
  }

  return parsed.data;
}

let cachedEnv: ClientEnv | undefined;

/** Validated public client env (lazy so tests can set vars first). */
export function getClientEnv(): ClientEnv {
  cachedEnv ??= readClientEnv();
  return cachedEnv;
}

/** Absolute API URL including version prefix, no trailing slash */
export function apiUrl(path = ''): string {
  const env = getClientEnv();
  const base = `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/${env.NEXT_PUBLIC_API_PREFIX.replace(/^\//, '')}`;
  if (!path) {
    return base;
  }
  return `${base}/${path.replace(/^\//, '')}`;
}

/** API origin only (Better Auth mounts at /api/auth on this host). */
export function apiOrigin(): string {
  return getClientEnv().NEXT_PUBLIC_API_URL.replace(/\/$/, '');
}

/** Public web app origin (callback URLs, redirects). */
export function appUrl(path = ''): string {
  const base = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  if (!path) {
    return base;
  }
  return `${base}/${path.replace(/^\//, '')}`;
}

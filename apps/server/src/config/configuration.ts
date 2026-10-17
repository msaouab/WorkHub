import type { AuthConfig } from '@work-hub/auth';
import type { MailConfig } from '@work-hub/mail';
import type { StorageConfig } from '@work-hub/storage';
import type { Env } from './env.schema';

export type AppConfig = {
  nodeEnv: Env['NODE_ENV'];
  host: string;
  port: number;
  appUrl: string;
  apiPrefix: string;
  swaggerPath: string;
  swaggerEnabled: boolean;
  corsOrigins: string[];
  databaseUrl: string;
  mail: MailConfig;
  auth: AuthConfig;
  storage: StorageConfig;
};

export function toAppConfig(env: Env): AppConfig {
  return {
    nodeEnv: env.NODE_ENV,
    host: env.HOST,
    port: env.PORT,
    appUrl: env.APP_URL,
    apiPrefix: env.API_PREFIX,
    swaggerPath: env.SWAGGER_PATH,
    swaggerEnabled: env.SWAGGER_ENABLED,
    corsOrigins: env.CORS_ORIGINS,
    databaseUrl: env.DATABASE_URL,
    mail: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      from: env.MAIL_FROM,
    },
    auth: {
      baseUrl: env.APP_URL,
      secret: env.BETTER_AUTH_SECRET,
      trustedOrigins: env.CORS_ORIGINS,
    },
    storage: {
      endpoint: env.STORAGE_ENDPOINT,
      region: env.STORAGE_REGION,
      bucket: env.STORAGE_BUCKET,
      accessKeyId: env.STORAGE_ACCESS_KEY,
      secretAccessKey: env.STORAGE_SECRET_KEY,
      publicBaseUrl: env.STORAGE_PUBLIC_BASE_URL,
      forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
    },
  };
}

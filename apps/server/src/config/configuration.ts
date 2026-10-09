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
  };
}

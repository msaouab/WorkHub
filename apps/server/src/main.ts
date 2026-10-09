/**
 * WorkHub API bootstrap.
 */

import { Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app/app.module';
import { buildOpenApiDocument } from './common/swagger/build-openapi-document';
import type { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(PinoLogger));

  const config = app.get(ConfigService<AppConfig, true>);

  const host = config.get('host', { infer: true });
  const port = config.get('port', { infer: true });
  const appUrl = config.get('appUrl', { infer: true });
  const apiPrefix = config.get('apiPrefix', { infer: true });
  const swaggerPath = config.get('swaggerPath', { infer: true });
  const swaggerEnabled = config.get('swaggerEnabled', { infer: true });
  const corsOrigins = config.get('corsOrigins', { infer: true });
  const nodeEnv = config.get('nodeEnv', { infer: true });

  // Correct client IPs behind Railway / Fly / reverse proxies (throttling + logs).
  app.set('trust proxy', 1);
  app.use(helmet());
  app.enableShutdownHooks();

  // JSON / urlencoded body cap (file uploads will use a dedicated multipart limit later).
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: true });

  // Probes stay outside /api/v1 for load balancers.
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  if (swaggerEnabled) {
    // Swagger UI assets resolve from node_modules (webpack externalDependencies: 'none' + pnpm-safe externals).
    const documentFactory = () => buildOpenApiDocument(app, { appUrl });
    SwaggerModule.setup(swaggerPath, app, documentFactory);
  }

  await app.listen(port, host);

  const logger = new Logger('Bootstrap');
  logger.log(`Environment: ${nodeEnv}`);
  logger.log(`Listening on ${host}:${port}`);
  logger.log(`API base: ${appUrl}/${apiPrefix}`);
  logger.log(`Health live: ${appUrl}/health/live`);
  logger.log(`Health ready: ${appUrl}/health/ready`);
  if (swaggerEnabled) {
    logger.log(`Swagger UI: ${appUrl}/${swaggerPath}`);
  }
}

bootstrap();

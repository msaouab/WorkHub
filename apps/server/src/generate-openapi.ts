/**
 * Writes OpenAPI JSON for codegen / contract tests.
 * Usage: node dist/generate-openapi.js (via nx run server:openapi)
 *
 * Uses fixed defaults so CI can run without a .env file, and the committed
 * openapi.json stays reproducible (servers URL does not depend on local APP_URL).
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app/app.module';
import { buildOpenApiDocument } from './common/swagger/build-openapi-document';
import { OPENAPI_SERVER_URL } from './common/swagger/openapi.constants';

function applyGeneratorEnvDefaults(): void {
  process.env.NODE_ENV ??= 'development';
  process.env.APP_URL ??= OPENAPI_SERVER_URL;
  process.env.CORS_ORIGINS ??= 'https://app.workhub.app';
  process.env.SWAGGER_ENABLED ??= 'false';
}

async function generate() {
  applyGeneratorEnvDefaults();

  const app = await NestFactory.create(AppModule, {
    logger: false,
    abortOnError: true,
  });

  const document = buildOpenApiDocument(app, { appUrl: OPENAPI_SERVER_URL });

  const outPath = join(__dirname, '..', 'openapi.json');
  writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

  await app.close();

  const logger = new Logger('OpenAPI');
  logger.log(`Wrote ${outPath}`);
}

generate().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

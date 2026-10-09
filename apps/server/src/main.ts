/**
 * WorkHub API bootstrap.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  const corsOrigin = config.get<string>(
    'CORS_ORIGIN',
    'http://localhost:3000'
  );
  app.enableCors({
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('WorkHub API')
    .setDescription(
      'REST API for leave, holidays, and HR document requests. Space-scoped routes live under /spaces/{spaceId}.'
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('health')
    .addTag('auth')
    .addTag('spaces')
    .addTag('leaves')
    .addTag('holidays')
    .addTag('documents')
    .addTag('approvals')
    .addTag('notifications')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('PORT', 3333);
  await app.listen(port);

  Logger.log(`WorkHub API: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`Swagger UI:  http://localhost:${port}/api/docs`);
}

bootstrap();

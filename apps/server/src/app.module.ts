import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, minutes } from '@nestjs/throttler';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { createAuth } from '@work-hub/auth';
import { ProblemDetailsFilter } from '@work-hub/core';
import { DatabaseModule, PrismaService } from '@work-hub/database';
import { MailModule, MailService } from '@work-hub/mail';
import { SpacesModule } from '@work-hub/spaces';
import { UsersModule } from '@work-hub/users';
import { randomUUID } from 'node:crypto';
import { LoggerModule } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';
import { toAppConfig, type AppConfig } from './config/configuration';
import { getEnvFilePaths } from './config/env-files';
import { validateEnv } from './config/env.schema';
import { HealthModule } from './health/health.module';
import { ObserveModule } from './observe';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: getEnvFilePaths(),
      validate: (raw) => toAppConfig(validateEnv(raw)),
    }),
    DatabaseModule,
    MailModule,
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'workhub',
    }),
    AuthModule.forRootAsync({
      inject: [PrismaService, MailService, ConfigService],
      useFactory: (
        prisma: PrismaService,
        mail: MailService,
        config: ConfigService<AppConfig, true>
      ) => ({
        auth: createAuth({
          prisma,
          mail,
          config: config.get('auth', { infer: true }),
        }),
        bodyParser: {
          json: { limit: '1mb' },
          urlencoded: { limit: '1mb', extended: true },
        },
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req, res) => {
          const header = req.headers['x-request-id'];
          const existing = Array.isArray(header) ? header[0] : header;
          const id =
            typeof existing === 'string' && existing.length > 0
              ? existing
              : randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        quietReqLogger: true,
      },
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: minutes(1), limit: 100 }]),
    HealthModule,
    UsersModule,
    SpacesModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { AUTH_BASE_PATH, type Auth } from '@work-hub/auth';
import { problemDetailsSchema } from '@work-hub/contracts';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { z } from 'zod';
import { mergeAuthOpenApi, SESSION_SECURITY } from './merge-auth-openapi';
import { OPENAPI_SERVER_URL } from './openapi.constants';

export type BuildOpenApiOptions = {
  /** Defaults to the fixed reproducible server URL. */
  appUrl?: string;
  title?: string;
  version?: string;
};

export async function buildOpenApiDocument(
  app: INestApplication,
  options: BuildOpenApiOptions = {},
): Promise<OpenAPIObject> {
  const config = new DocumentBuilder()
    .setTitle(options.title ?? 'WorkHub API')
    .setDescription(
      'REST API for leave, holidays, and HR document requests. Space-scoped routes live under /api/v1/spaces/{spaceId}. Errors use RFC 9457 problem+json with a stable `code`.',
    )
    .setVersion(options.version ?? '1.0')
    .addServer(options.appUrl ?? OPENAPI_SERVER_URL)
    // Session cookie set by Better Auth on sign-in (HttpOnly; the browser sends it automatically).
    .addCookieAuth(
      'better-auth.session_token',
      { type: 'apiKey', in: 'cookie' },
      SESSION_SECURITY,
    )
    .addTag('health')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => {
      const controller = controllerKey.replace(/Controller$/, '');
      return `${controller[0]?.toLowerCase() ?? ''}${controller.slice(1)}_${methodKey}`;
    },
  });

  document.components ??= {};
  document.components.schemas = {
    ...document.components.schemas,
    ProblemDetails: zodToOpenApiSchema(problemDetailsSchema),
  };

  const auth = app.get<AuthService<Auth>>(AuthService).instance;
  const authDoc = await auth.api.generateOpenAPISchema();
  return mergeAuthOpenApi(cleanupOpenApiDoc(document), authDoc, AUTH_BASE_PATH);
}

/** Unwrap Zod 4 `toJSONSchema` `$ref` + `definitions` into a plain OpenAPI schema object. */
function zodToOpenApiSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, {
    target: 'openapi-3.0',
  }) as Record<string, unknown>;

  if (
    typeof json['$ref'] === 'string' &&
    json['definitions'] &&
    typeof json['definitions'] === 'object'
  ) {
    const name = (json['$ref'] as string).replace(/^#\/definitions\//, '');
    const definitions = json['definitions'] as Record<
      string,
      Record<string, unknown>
    >;
    if (definitions[name]) {
      return definitions[name];
    }
  }

  // Drop JSON Schema meta; OpenAPI component schemas do not use $schema.
  const { $schema: _schema, ...rest } = json;
  return rest;
}

export const PROBLEM_DETAILS_REF = {
  description: 'RFC 9457 problem details',
  content: {
    'application/problem+json': {
      schema: { $ref: '#/components/schemas/ProblemDetails' },
    },
  },
} as const;

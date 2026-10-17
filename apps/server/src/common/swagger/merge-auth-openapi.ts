import type { OpenAPIObject } from '@nestjs/swagger';

/** The parts of Better Auth's generated OpenAPI document we merge. */
type AuthOpenApi = {
  paths?: Record<string, object>;
  components?: { schemas?: object };
};

/** Security scheme name declared with `addCookieAuth` in buildOpenApiDocument. */
export const SESSION_SECURITY = 'session';

/**
 * Adds Better Auth's routes to the Nest Swagger document:
 * - prefixes paths with the auth base path (Better Auth lists "/sign-in/email"),
 * - groups every operation under one "auth" tag,
 * - drops Better Auth's security markers: it marks every route as protected,
 *   including public ones, which would put a lock on sign-up in Swagger.
 */
export function mergeAuthOpenApi(
  document: OpenAPIObject,
  authDoc: AuthOpenApi,
  basePath: string,
): OpenAPIObject {
  const paths: OpenAPIObject['paths'] = { ...document.paths };

  for (const [path, operations] of Object.entries(authDoc.paths ?? {})) {
    paths[`${basePath}${path}`] = Object.fromEntries(
      Object.entries(operations).map(([method, operation]) => {
        // Better Auth marks every route as protected, even sign-up and sign-in, so its
        // markers are dropped. Our own protected routes declare @ApiCookieAuth themselves.
        const { security: _ignored, ...rest } = operation as {
          security?: unknown;
        };
        return [method, { ...rest, tags: ['auth'] }];
      }),
    );
  }

  return {
    ...document,
    tags: [
      ...(document.tags ?? []),
      {
        name: 'auth',
        description:
          'Sign-up, sign-in, sessions, email verification and password reset (Better Auth)',
      },
    ],
    paths,
    components: {
      ...document.components,
      // Our own schemas win on a name clash (e.g. ProblemDetails).
      schemas: {
        ...(authDoc.components?.schemas as NonNullable<
          OpenAPIObject['components']
        >['schemas']),
        ...document.components?.schemas,
      },
    },
  };
}

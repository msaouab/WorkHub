/** Security scheme name declared with `addCookieAuth` in the OpenAPI builder. */
export const SESSION_SECURITY = 'session';

/** Shared Swagger response for RFC 9457 problem+json errors. */
export const PROBLEM_DETAILS_REF = {
  description: 'RFC 9457 problem details',
  content: {
    'application/problem+json': {
      schema: { $ref: '#/components/schemas/ProblemDetails' },
    },
  },
} as const;

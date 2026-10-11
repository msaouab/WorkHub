import {
  PROBLEM_JSON_CONTENT_TYPE,
  problemDetailsSchema,
  type ProblemDetails,
} from '@work-hub/contracts';
import { apiUrl } from '@/lib/env';

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails | null;

  constructor(status: number, message: string, problem: ProblemDetails | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

type ApiFetchOptions = Omit<RequestInit, 'credentials' | 'body'> & {
  body?: unknown;
};

/** Credentialed fetch against `/api/v1/*` with problem+json parsing. */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options;
  const response = await fetch(apiUrl(path), {
    ...rest,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isProblem = contentType.includes(PROBLEM_JSON_CONTENT_TYPE);
  const isJson = contentType.includes('application/json') || isProblem;

  if (!response.ok) {
    if (isJson) {
      const raw: unknown = await response.json();
      const parsed = problemDetailsSchema.safeParse(raw);
      if (parsed.success) {
        throw new ApiError(
          response.status,
          parsed.data.detail ?? parsed.data.title,
          parsed.data
        );
      }
      throw new ApiError(response.status, 'Request failed', null);
    }
    throw new ApiError(response.status, response.statusText || 'Request failed', null);
  }

  if (!isJson) {
    throw new ApiError(response.status, 'Unexpected response type', null);
  }

  return (await response.json()) as T;
}

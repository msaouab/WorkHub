import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { ErrorCode } from '@work-hub/constants';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { ZodValidationException } from 'nestjs-zod';
import { ProblemDetailsFilter } from './problem-details.filter';

describe('ProblemDetailsFilter', () => {
  const filter = new ProblemDetailsFilter();
  let statusCode = 0;
  let body: unknown;
  let contentType = '';

  const response = {
    status: vi.fn((code: number) => {
      statusCode = code;
      return response;
    }),
    type: vi.fn((type: string) => {
      contentType = type;
      return response;
    }),
    json: vi.fn((payload: unknown) => {
      body = payload;
      return response;
    }),
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({
        originalUrl: '/api/v1/spaces',
        url: '/api/v1/spaces',
        protocol: 'http',
        get: () => 'evil.example',
      }),
    }),
  };

  afterEach(() => { vi.restoreAllMocks(); });

  beforeEach(() => {
    statusCode = 0;
    body = undefined;
    contentType = '';
    vi.clearAllMocks();
  });

  it('maps HttpException to RFC 9457 problem JSON without using the Host header', () => {
    filter.catch(new NotFoundException('Space not found'), host as never);

    expect(statusCode).toBe(404);
    expect(contentType).toBe('application/problem+json');
    expect(body).toMatchObject({
      type: 'https://workhub.app/problems/not-found',
      title: 'Not Found',
      status: 404,
      detail: 'Space not found',
      instance: '/api/v1/spaces',
      code: ErrorCode.NOT_FOUND,
    });
  });

  it('maps ZodValidationException to VALIDATION_FAILED with field errors', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        path: ['email'],
        message: 'Expected string',
      },
    ]);
    filter.catch(new ZodValidationException(zodError), host as never);

    expect(statusCode).toBe(400);
    expect(body).toMatchObject({
      code: ErrorCode.VALIDATION_FAILED,
      errors: [{ path: 'email', message: 'Expected string' }],
    });
  });

  it('preserves an explicit code on BadRequestException payloads', () => {
    filter.catch(
      new BadRequestException({
        message: 'Idempotency key required',
        code: ErrorCode.BAD_REQUEST,
      }),
      host as never
    );

    expect(body).toMatchObject({
      code: ErrorCode.BAD_REQUEST,
      detail: 'Idempotency key required',
    });
  });

  it('uses STATUS_CODES titles and strips exception-class prefixes from detail', () => {
    filter.catch(new ThrottlerException('Too Many Requests'), host as never);

    expect(body).toMatchObject({
      type: 'https://workhub.app/problems/rate-limited',
      title: 'Too Many Requests',
      status: 429,
      detail: 'Too Many Requests',
      code: ErrorCode.RATE_LIMITED,
    });
  });

  it('keeps Terminus readiness details on ServiceUnavailableException', () => {
    const logError = vi.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);

    const healthPayload = {
      status: 'error',
      info: {},
      error: { memory_heap: { status: 'down' } },
      details: { memory_heap: { status: 'down' } },
    };
    filter.catch(new ServiceUnavailableException(healthPayload), host as never);

    expect(statusCode).toBe(503);
    expect(body).toMatchObject({
      type: 'https://workhub.app/problems/service-unavailable',
      title: 'Service Unavailable',
      detail: 'One or more readiness checks failed.',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      details: healthPayload,
    });
    expect(logError).toHaveBeenCalledOnce();
  });
});

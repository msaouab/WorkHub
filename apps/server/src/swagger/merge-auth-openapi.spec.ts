import type { OpenAPIObject } from '@nestjs/swagger';
import { describe, expect, it } from 'vitest';
import { mergeAuthOpenApi } from './merge-auth-openapi';

const nestDocument: OpenAPIObject = {
  openapi: '3.0.0',
  info: { title: 'WorkHub API', version: '1.0' },
  tags: [{ name: 'health' }],
  paths: { '/health/live': { get: { responses: {} } } },
  components: {
    schemas: { ProblemDetails: { type: 'object', description: 'ours' } },
  },
};

const authDocument = {
  paths: {
    '/sign-in/email': {
      post: {
        tags: ['Default'],
        security: [{ bearerAuth: [] }],
        responses: {},
      },
    },
    '/get-session': {
      get: { tags: ['Default'], security: [{ bearerAuth: [] }], responses: {} },
    },
  },
  components: {
    schemas: {
      User: { type: 'object' },
      ProblemDetails: { type: 'object', description: 'theirs' },
    },
  },
};

describe('mergeAuthOpenApi', () => {
  const merged = mergeAuthOpenApi(nestDocument, authDocument, '/api/auth');

  it('prefixes auth paths with the base path and keeps existing paths', () => {
    expect(Object.keys(merged.paths).sort()).toEqual([
      '/api/auth/get-session',
      '/api/auth/sign-in/email',
      '/health/live',
    ]);
  });

  it('groups every auth operation under the "auth" tag', () => {
    expect(merged.paths['/api/auth/sign-in/email'].post?.tags).toEqual([
      'auth',
    ]);
    expect(merged.tags?.map((tag) => tag.name)).toEqual(['health', 'auth']);
  });

  it("drops Better Auth's security markers (it marks even sign-up as protected)", () => {
    expect(
      merged.paths['/api/auth/sign-in/email'].post?.security,
    ).toBeUndefined();
    expect(merged.paths['/api/auth/get-session'].get?.security).toBeUndefined();
  });

  it('adds auth schemas without overwriting ours', () => {
    expect(merged.components?.schemas?.['User']).toEqual({ type: 'object' });
    expect(merged.components?.schemas?.['ProblemDetails']).toEqual({
      type: 'object',
      description: 'ours',
    });
  });
});

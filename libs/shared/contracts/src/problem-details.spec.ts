import { describe, expect, it } from 'vitest';
import { problemDetailsSchema } from './problem-details';

describe('problemDetailsSchema', () => {
  it('accepts a valid problem document', () => {
    const parsed = problemDetailsSchema.parse({
      type: 'https://api.workhub.app/problems/validation-failed',
      title: 'Validation Failed',
      status: 400,
      code: 'VALIDATION_FAILED',
      detail: 'One or more fields are invalid',
      instance: '/api/v1/spaces',
    });
    expect(parsed.code).toBe('VALIDATION_FAILED');
  });

  it('rejects unknown codes', () => {
    expect(() =>
      problemDetailsSchema.parse({
        type: 'https://api.workhub.app/problems/x',
        title: 'X',
        status: 400,
        code: 'NOT_A_REAL_CODE',
      })
    ).toThrow();
  });
});

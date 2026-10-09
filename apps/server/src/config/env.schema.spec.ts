import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.schema';
import { toAppConfig } from './configuration';

const base = {
  APP_URL: 'http://localhost:3333',
  CORS_ORIGINS: 'http://localhost:3000',
};

describe('validateEnv', () => {
  it('maps validated Env to AppConfig without re-reading process.env', () => {
    const env = validateEnv({
      ...base,
      NODE_ENV: 'development',
      SWAGGER_ENABLED: 'true',
    });

    expect(toAppConfig(env)).toEqual({
      nodeEnv: 'development',
      host: '0.0.0.0',
      port: 3333,
      appUrl: 'http://localhost:3333',
      apiPrefix: 'api/v1',
      swaggerPath: 'docs',
      swaggerEnabled: true,
      corsOrigins: ['http://localhost:3000'],
    });
  });

  it('defaults swaggerEnabled from NODE_ENV when SWAGGER_ENABLED is omitted', () => {
    expect(validateEnv({ ...base, NODE_ENV: 'development' }).SWAGGER_ENABLED).toBe(
      true
    );
    expect(validateEnv({ ...base, NODE_ENV: 'production' }).SWAGGER_ENABLED).toBe(
      false
    );
  });

  it('rejects invalid SWAGGER_ENABLED typos', () => {
    expect(() =>
      validateEnv({ ...base, SWAGGER_ENABLED: 'flase' })
    ).toThrow(/SWAGGER_ENABLED/);
  });

  it('parses strict SWAGGER_ENABLED flags', () => {
    expect(validateEnv({ ...base, SWAGGER_ENABLED: '1' }).SWAGGER_ENABLED).toBe(
      true
    );
    expect(validateEnv({ ...base, SWAGGER_ENABLED: '0' }).SWAGGER_ENABLED).toBe(
      false
    );
    expect(
      validateEnv({ ...base, SWAGGER_ENABLED: 'false' }).SWAGGER_ENABLED
    ).toBe(false);
  });

  it('rejects empty or whitespace-only CORS_ORIGINS', () => {
    expect(() => validateEnv({ ...base, CORS_ORIGINS: ' , ' })).toThrow(
      /CORS_ORIGINS/
    );
    expect(() => validateEnv({ ...base, CORS_ORIGINS: '' })).toThrow(
      /CORS_ORIGINS/
    );
  });

  it('splits and validates CORS origin URLs', () => {
    const env = validateEnv({
      ...base,
      CORS_ORIGINS: ' http://localhost:3000 , https://app.example.com ',
    });
    expect(env.CORS_ORIGINS).toEqual([
      'http://localhost:3000',
      'https://app.example.com',
    ]);
  });

  it('rejects non-URL CORS origins', () => {
    expect(() =>
      validateEnv({ ...base, CORS_ORIGINS: 'not-a-url' })
    ).toThrow(/CORS_ORIGINS/);
  });
});

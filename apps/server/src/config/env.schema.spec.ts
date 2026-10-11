import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.schema';
import { toAppConfig } from './configuration';

const base = {
  APP_URL: 'http://localhost:3333',
  CORS_ORIGINS: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://workhub_app:workhub_app@localhost:5434/workhub',
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  MAIL_FROM: 'WorkHub <no-reply@workhub.local>',
  BETTER_AUTH_SECRET: 'x'.repeat(32),
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
      databaseUrl: 'postgresql://workhub_app:workhub_app@localhost:5434/workhub',
      mail: {
        host: 'localhost',
        port: 1025,
        secure: false,
        user: undefined,
        pass: undefined,
        from: 'WorkHub <no-reply@workhub.local>',
      },
      auth: {
        baseUrl: 'http://localhost:3333',
        secret: 'x'.repeat(32),
        trustedOrigins: ['http://localhost:3000'],
      },
    });
  });

  it('treats empty SMTP credentials as not set', () => {
    const env = validateEnv({ ...base, SMTP_USER: '', SMTP_PASS: '  ' });
    expect(env.SMTP_USER).toBeUndefined();
    expect(env.SMTP_PASS).toBeUndefined();
  });

  it('rejects SMTP_USER without SMTP_PASS', () => {
    expect(() => validateEnv({ ...base, SMTP_USER: 'mailer' })).toThrow(
      /SMTP_PASS/
    );
  });

  it('requires MAIL_FROM', () => {
    const { MAIL_FROM: _omitted, ...withoutFrom } = base;
    expect(() => validateEnv(withoutFrom)).toThrow(/MAIL_FROM/);
  });

  it('parses strict SMTP_SECURE flags and defaults to false', () => {
    expect(validateEnv(base).SMTP_SECURE).toBe(false);
    expect(validateEnv({ ...base, SMTP_SECURE: 'true' }).SMTP_SECURE).toBe(true);
    expect(() => validateEnv({ ...base, SMTP_SECURE: 'yes' })).toThrow(
      /SMTP_SECURE/
    );
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

  it('rejects a BETTER_AUTH_SECRET shorter than 32 characters', () => {
    expect(() =>
      validateEnv({ ...base, BETTER_AUTH_SECRET: 'x'.repeat(31) })
    ).toThrow(/BETTER_AUTH_SECRET/);
  });
});

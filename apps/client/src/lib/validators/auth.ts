import { z } from 'zod';

/** Matches Better Auth `minPasswordLength` on the server. */
export const PASSWORD_MIN_LENGTH = 10;

type Translate = (key: string, values?: Record<string, string | number>) => string;

export function createSignInSchema(t: Translate) {
  return z.object({
    email: z.email(t('email')),
    password: z
      .string()
      .min(1, t('passwordRequired'))
      .max(128, t('passwordMax')),
  });
}

export function createSignUpSchema(t: Translate) {
  return z.object({
    name: z.string().trim().min(2, t('nameMin')).max(80, t('nameMax')),
    email: z.email(t('email')),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, t('passwordMin', { min: PASSWORD_MIN_LENGTH }))
      .max(128, t('passwordMax')),
  });
}

export function createForgotPasswordSchema(t: Translate) {
  return z.object({
    email: z.email(t('email')),
  });
}

export function createResetPasswordSchema(t: Translate) {
  return z
    .object({
      password: z
        .string()
        .min(PASSWORD_MIN_LENGTH, t('passwordMin', { min: PASSWORD_MIN_LENGTH }))
        .max(128, t('passwordMax')),
      confirmPassword: z.string().min(1, t('confirmPassword')),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: t('passwordMismatch'),
      path: ['confirmPassword'],
    });
}

export function createChangePasswordSchema(t: Translate) {
  return z
    .object({
      currentPassword: z.string().min(1, t('passwordRequired')),
      password: z
        .string()
        .min(PASSWORD_MIN_LENGTH, t('passwordMin', { min: PASSWORD_MIN_LENGTH }))
        .max(128, t('passwordMax')),
      confirmPassword: z.string().min(1, t('confirmPassword')),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: t('passwordMismatch'),
      path: ['confirmPassword'],
    });
}

export function createProfileNameSchema(t: Translate) {
  return z.object({
    name: z.string().trim().min(2, t('nameMin')).max(80, t('nameMax')),
  });
}

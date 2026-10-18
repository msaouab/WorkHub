'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { isAppLocale } from '@/i18n/locale';
import { Link, useRouter } from '@/i18n/navigation';
import { authErrorMessage } from '@/lib/auth-errors';
import { authClient } from '@/lib/auth-client';
import { ROUTES } from '@/lib/routes';
import { safeNextPath } from '@/lib/safe-next-path';
import { createSignInSchema } from '@/lib/validators/auth';

type SignInValues = z.infer<ReturnType<typeof createSignInSchema>>;

export function SignInForm() {
  const t = useTranslations('Auth.signIn');
  const tFields = useTranslations('Auth.fields');
  const tErrors = useTranslations('Auth.errors');
  const tValidation = useTranslations('Validation');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified') === '1';
  const reset = searchParams.get('reset') === '1';
  const nextPath = safeNextPath(searchParams.get('next'));
  const schema = useMemo(() => createSignInSchema(tValidation), [tValidation]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const { data, error: authError } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });

    if (authError) {
      if (authError.code === 'EMAIL_NOT_VERIFIED') {
        const verifyQs = new URLSearchParams({ email: values.email });
        if (nextPath) {
          verifyQs.set('next', nextPath);
        }
        router.replace(`/verify-email?${verifyQs.toString()}`, { locale });
        return;
      }
      setError('root', { message: authErrorMessage(authError, tErrors) });
      return;
    }

    const savedLocale = data?.user.locale;
    router.replace(nextPath ?? ROUTES.dashboard, {
      locale: savedLocale && isAppLocale(savedLocale) ? savedLocale : locale,
    });
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {verified ? (
        <p
          role="status"
          className="rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm text-secondary-foreground"
        >
          {t('verifiedBanner')}
        </p>
      ) : null}
      {reset ? (
        <p
          role="status"
          className="rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm text-secondary-foreground"
        >
          {t('resetBanner')}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="sign-in-email">{tFields('email.label')}</Label>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="sign-in-email"
              type="email"
              autoComplete="email"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={tFields('email.placeholder')}
              className="h-10"
              aria-invalid={fieldState.invalid || undefined}
              required
            />
          )}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="sign-in-password">{tFields('password.label')}</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t('forgotLink')}
          </Link>
        </div>
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <PasswordInput
              id="sign-in-password"
              autoComplete="current-password"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={tFields('password.placeholder')}
              className="h-10"
              aria-invalid={fieldState.invalid || undefined}
              required
            />
          )}
        />
        <FieldError message={errors.password?.message} />
      </div>

      <FieldError message={errors.root?.message} />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? tCommon('signingIn') : t('submit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('switchPrompt')}{' '}
        <Link
          href="/sign-up"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t('switchLink')}
        </Link>
      </p>
    </form>
  );
}

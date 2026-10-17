'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { SIGNUP_LOCALE_HEADER } from '@work-hub/constants';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Link, useRouter } from '@/i18n/navigation';
import { authErrorMessage } from '@/lib/auth-errors';
import { authClient } from '@/lib/auth-client';
import { appUrl } from '@/lib/env';
import { ROUTES } from '@/lib/routes';
import { createSignUpSchema } from '@/lib/validators/auth';

type SignUpValues = z.infer<ReturnType<typeof createSignUpSchema>>;

export function SignUpForm() {
  const t = useTranslations('Auth.signUp');
  const tFields = useTranslations('Auth.fields');
  const tErrors = useTranslations('Auth.errors');
  const tValidation = useTranslations('Validation');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const schema = useMemo(() => createSignUpSchema(tValidation), [tValidation]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    const { error: authError } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: appUrl(`/${locale}${ROUTES.dashboard}`),
      fetchOptions: {
        headers: {
          // Server reads this in databaseHooks.user.create (WH-032).
          [SIGNUP_LOCALE_HEADER]: locale,
        },
      },
    });

    if (authError) {
      setError('root', { message: authErrorMessage(authError, tErrors) });
      return;
    }

    router.replace(
      `/verify-email?email=${encodeURIComponent(values.email)}`,
      { locale }
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sign-up-name">{tFields('name.label')}</Label>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="sign-up-name"
              autoComplete="name"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={tFields('name.placeholder')}
              className="h-10"
              aria-invalid={fieldState.invalid || undefined}
              required
            />
          )}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="sign-up-email">{tFields('email.label')}</Label>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="sign-up-email"
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
        <Label htmlFor="sign-up-password">{tFields('password.label')}</Label>
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <PasswordInput
              id="sign-up-password"
              autoComplete="new-password"
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
        {isSubmitting ? tCommon('creatingAccount') : t('submit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('switchPrompt')}{' '}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t('switchLink')}
        </Link>
      </p>
    </form>
  );
}

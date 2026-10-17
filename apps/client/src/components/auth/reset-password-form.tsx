'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Link, useRouter } from '@/i18n/navigation';
import { authErrorMessage } from '@/lib/auth-errors';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { createResetPasswordSchema } from '@/lib/validators/auth';

export function ResetPasswordForm() {
  const t = useTranslations('Auth.resetPassword');
  const tFields = useTranslations('Auth.fields');
  const tErrors = useTranslations('Auth.errors');
  const tValidation = useTranslations('Validation');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const linkError = searchParams.get('error');
  const schema = useMemo(
    () => createResetPasswordSchema(tValidation),
    [tValidation]
  );

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (linkError || !token) {
    return (
      <div className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-muted-foreground" role="alert">
          {linkError ? t('invalidToken') : t('missingToken')}
        </p>
        <Link
          href="/forgot-password"
          className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
        >
          {t('requestNewLink')}
        </Link>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t('backToSignIn')}
          </Link>
        </p>
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tValidation('invalidInput'));
      return;
    }

    setPending(true);
    setError(null);
    const { error: authError } = await authClient.resetPassword({
      newPassword: parsed.data.password,
      token,
    });
    setPending(false);

    if (authError) {
      setError(authErrorMessage(authError, tErrors));
      return;
    }

    router.replace('/sign-in?reset=1');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-password">{tFields('newPassword.label')}</Label>
        <PasswordInput
          id="reset-password"
          name="password"
          autoComplete="new-password"
          value={password}
          onValueChange={setPassword}
          placeholder={tFields('newPassword.placeholder')}
          className="h-10"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-confirm">{tFields('confirmPassword.label')}</Label>
        <PasswordInput
          id="reset-confirm"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onValueChange={setConfirmPassword}
          placeholder={tFields('confirmPassword.placeholder')}
          className="h-10"
          required
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t('submitting') : t('submit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t('backToSignIn')}
        </Link>
      </p>
    </form>
  );
}

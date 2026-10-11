'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/i18n/navigation';
import { authErrorMessage } from '@/lib/auth-errors';
import { authClient } from '@/lib/auth-client';
import { appUrl } from '@/lib/env';
import { createForgotPasswordSchema } from '@/lib/validators/auth';

export function ForgotPasswordForm() {
  const t = useTranslations('Auth.forgotPassword');
  const tFields = useTranslations('Auth.fields');
  const tAuth = useTranslations('Auth');
  const tValidation = useTranslations('Validation');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const schema = useMemo(
    () => createForgotPasswordSchema(tValidation),
    [tValidation]
  );

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tValidation('invalidInput'));
      return;
    }

    setPending(true);
    setError(null);
    const { error: authError } = await authClient.requestPasswordReset({
      email: parsed.data.email,
      redirectTo: appUrl(`/${locale}/reset-password`),
    });
    setPending(false);

    if (authError) {
      setError(authErrorMessage(authError));
      return;
    }

    setSubmittedEmail(parsed.data.email);
  }

  if (submittedEmail) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">
            {t('successTitle')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t('successBody', { email: submittedEmail })}
          </p>
        </div>
        {process.env.NODE_ENV === 'development' ? (
          <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {tAuth('mailpitHint')}
          </p>
        ) : null}
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

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="forgot-email">{tFields('email.label')}</Label>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onValueChange={setEmail}
          placeholder={tFields('email.placeholder')}
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
        {pending ? tCommon('sending') : t('submit')}
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

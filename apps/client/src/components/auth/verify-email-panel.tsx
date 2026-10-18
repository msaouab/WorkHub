'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { authErrorMessage } from '@/lib/auth-errors';
import { authClient } from '@/lib/auth-client';
import { appUrl } from '@/lib/env';
import { ROUTES } from '@/lib/routes';
import { safeNextPath } from '@/lib/safe-next-path';

type VerifyEmailPanelProps = {
  email: string;
  next?: string | null;
};

export function VerifyEmailPanel({ email, next }: VerifyEmailPanelProps) {
  const t = useTranslations('Auth.verifyEmail');
  const tAuth = useTranslations('Auth');
  const tErrors = useTranslations('Auth.errors');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const nextPath = safeNextPath(next);

  async function onResend() {
    setPending(true);
    setError(null);
    setMessage(null);
    const callbackPath = nextPath ?? ROUTES.dashboard;
    const { error: authError } = await authClient.sendVerificationEmail({
      email,
      callbackURL: appUrl(`/${locale}${callbackPath}`),
    });
    setPending(false);

    if (authError) {
      setError(authErrorMessage(authError, tErrors));
      return;
    }
    setMessage(t('resent'));
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {t.rich('description', {
          email: () => (
            <bdi className="font-medium text-foreground">{email}</bdi>
          ),
        })}
      </p>
      {process.env.NODE_ENV === 'development' ? (
        <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {tAuth('mailpitHint')}
        </p>
      ) : null}

      {message ? (
        <p role="status" className="text-sm text-foreground">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={pending || !email}
        onClick={onResend}
      >
        {pending ? tCommon('sending') : t('resend')}
      </Button>

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

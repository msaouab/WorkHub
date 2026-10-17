'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { isAppLocale } from '@/i18n/locale';
import { Link, useRouter } from '@/i18n/navigation';
import { authErrorMessage } from '@/lib/auth-errors';
import { authClient } from '@/lib/auth-client';
import { createSignInSchema } from '@/lib/validators/auth';

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
  const schema = useMemo(() => createSignInSchema(tValidation), [tValidation]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tValidation('invalidInput'));
      return;
    }

    setPending(true);
    setError(null);
    const { data, error: authError } = await authClient.signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setPending(false);

    if (authError) {
      if (authError.code === 'EMAIL_NOT_VERIFIED') {
        router.replace(
          `/verify-email?email=${encodeURIComponent(parsed.data.email)}`,
          { locale }
        );
        return;
      }
      setError(authErrorMessage(authError, tErrors));
      return;
    }

    const savedLocale = data?.user.locale;
    router.replace('/app', {
      locale: savedLocale && isAppLocale(savedLocale) ? savedLocale : locale,
    });
    router.refresh();
  }

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
        <Input
          id="sign-in-email"
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
        <PasswordInput
          id="sign-in-password"
          name="password"
          autoComplete="current-password"
          value={password}
          onValueChange={setPassword}
          placeholder={tFields('password.placeholder')}
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
        {pending ? tCommon('signingIn') : t('submit')}
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

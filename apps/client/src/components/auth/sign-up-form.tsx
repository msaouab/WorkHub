'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Link, useRouter } from '@/i18n/navigation';
import { authErrorMessage } from '@/lib/auth-errors';
import { authClient } from '@/lib/auth-client';
import { appUrl } from '@/lib/env';
import { createSignUpSchema } from '@/lib/validators/auth';

export function SignUpForm() {
  const t = useTranslations('Auth.signUp');
  const tFields = useTranslations('Auth.fields');
  const tErrors = useTranslations('Auth.errors');
  const tValidation = useTranslations('Validation');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const schema = useMemo(() => createSignUpSchema(tValidation), [tValidation]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tValidation('invalidInput'));
      return;
    }

    setPending(true);
    setError(null);
    const { error: authError } = await authClient.signUp.email({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      callbackURL: appUrl(`/${locale}/app`),
    });
    setPending(false);

    if (authError) {
      setError(authErrorMessage(authError, tErrors));
      return;
    }

    router.replace(
      `/verify-email?email=${encodeURIComponent(parsed.data.email)}`,
      { locale }
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sign-up-name">{tFields('name.label')}</Label>
        <Input
          id="sign-up-name"
          name="name"
          autoComplete="name"
          value={name}
          onValueChange={setName}
          placeholder={tFields('name.placeholder')}
          className="h-10"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="sign-up-email">{tFields('email.label')}</Label>
        <Input
          id="sign-up-email"
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
        <Label htmlFor="sign-up-password">{tFields('password.label')}</Label>
        <PasswordInput
          id="sign-up-password"
          name="password"
          autoComplete="new-password"
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
        {pending ? tCommon('creatingAccount') : t('submit')}
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

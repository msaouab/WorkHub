'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { PageLoader } from '@/components/brand/logo-loader';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { useAuth } from '@/hooks/use-auth';
import { useAcceptInvite, useInvitePreview } from '@/hooks/use-invites';
import { Link, useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api/fetch';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

const ERROR_CODES = [
  'INVITE_NOT_FOUND',
  'INVITE_EXPIRED',
  'INVITE_REVOKED',
  'INVITE_EXHAUSTED',
  'INVITE_EMAIL_MISMATCH',
  'ALREADY_MEMBER',
] as const;

type InviteErrorCode = (typeof ERROR_CODES)[number];

function isInviteErrorCode(value: string): value is InviteErrorCode {
  return (ERROR_CODES as readonly string[]).includes(value);
}

type AcceptInviteProps = {
  token: string;
};

export function AcceptInvite({ token }: AcceptInviteProps) {
  const t = useTranslations('InviteAccept');
  const locale = useLocale();
  const router = useRouter();
  const { isSignedIn, isPending: authPending } = useAuth();
  const preview = useInvitePreview(token);
  const accept = useAcceptInvite();
  const autoTried = useRef(false);

  const signedIn = isSignedIn;
  const nextPath = `/invite/${encodeURIComponent(token)}`;
  const signInHref = `${ROUTES.signIn}?next=${encodeURIComponent(nextPath)}`;
  const signUpHref = `${ROUTES.signUp}?next=${encodeURIComponent(nextPath)}`;

  const acceptMutate = accept.mutateAsync;

  useEffect(() => {
    if (
      !signedIn ||
      !preview.data ||
      accept.isSuccess ||
      accept.isPending ||
      autoTried.current
    ) {
      return;
    }
    autoTried.current = true;
    void acceptMutate(token)
      .then((result) => {
        router.replace(`${ROUTES.space}/${result.spaceSlug}`);
        router.refresh();
      })
      .catch(() => {
        // Surface via accept.error below.
      });
  }, [
    signedIn,
    preview.data,
    accept.isSuccess,
    accept.isPending,
    acceptMutate,
    token,
    router,
  ]);

  if (preview.isLoading || authPending) {
    return <PageLoader fill="parent" label={t('loading')} />;
  }

  if (preview.isError) {
    return (
      <InviteMessage
        title={t('unavailableTitle')}
        body={mapPreviewError(preview.error, t)}
      />
    );
  }

  const data = preview.data;
  if (!data) {
    return null;
  }

  if (!signedIn) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('title', { space: data.spaceName })}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('description', { role: data.roleName })}
          </p>
          {data.kind === 'email' && data.email ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {t('emailHint', { email: data.email })}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={signInHref}
            locale={locale}
            className={cn(buttonVariants())}
          >
            {t('signIn')}
          </Link>
          <Link
            href={signUpHref}
            locale={locale}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            {t('signUp')}
          </Link>
        </div>
      </div>
    );
  }

  if (accept.isPending || (!accept.isError && !accept.isSuccess)) {
    return <PageLoader fill="parent" label={t('joining')} />;
  }

  if (accept.isError) {
    const code = problemCode(accept.error);
    if (code === 'ALREADY_MEMBER') {
      return (
        <div className="flex flex-col gap-4">
          <InviteMessage
            title={t('alreadyTitle')}
            body={t('errors.ALREADY_MEMBER')}
          />
          <Link
            href={`${ROUTES.space}/${data.spaceSlug}`}
            className={cn(buttonVariants(), 'self-start')}
          >
            {t('goToSpace')}
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <InviteMessage
          title={t('failedTitle')}
          body={mapAcceptError(accept.error, t)}
        />
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => {
            autoTried.current = false;
            accept.reset();
          }}
        >
          {t('tryAgain')}
        </Button>
      </div>
    );
  }

  return <PageLoader fill="parent" label={t('joining')} />;
}

function InviteMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function problemCode(err: unknown): string | undefined {
  if (err instanceof ApiError && err.problem?.code) {
    return String(err.problem.code);
  }
  return undefined;
}

function inviteErrorMessage(
  code: InviteErrorCode,
  t: ReturnType<typeof useTranslations<'InviteAccept'>>
): string {
  switch (code) {
    case 'INVITE_NOT_FOUND':
      return t('errors.INVITE_NOT_FOUND');
    case 'INVITE_EXPIRED':
      return t('errors.INVITE_EXPIRED');
    case 'INVITE_REVOKED':
      return t('errors.INVITE_REVOKED');
    case 'INVITE_EXHAUSTED':
      return t('errors.INVITE_EXHAUSTED');
    case 'INVITE_EMAIL_MISMATCH':
      return t('errors.INVITE_EMAIL_MISMATCH');
    case 'ALREADY_MEMBER':
      return t('errors.ALREADY_MEMBER');
  }
}

function mapPreviewError(
  err: unknown,
  t: ReturnType<typeof useTranslations<'InviteAccept'>>
): string {
  const code = problemCode(err);
  if (code && isInviteErrorCode(code)) {
    return inviteErrorMessage(code, t);
  }
  return t('errors.INVITE_NOT_FOUND');
}

function mapAcceptError(
  err: unknown,
  t: ReturnType<typeof useTranslations<'InviteAccept'>>
): string {
  const code = problemCode(err);
  if (code && isInviteErrorCode(code)) {
    return inviteErrorMessage(code, t);
  }
  return t('actionFailed');
}

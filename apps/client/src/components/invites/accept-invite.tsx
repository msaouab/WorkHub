'use client';

import { useLocale, useTranslations } from 'next-intl';
import { PageLoader } from '@/components/brand/logo-loader';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { useAuth } from '@/hooks/use-auth';
import { useAcceptInvite, useInvitePreview } from '@/hooks/use-invites';
import { useRoleLabel } from '@/hooks/use-role-label';
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

/**
 * Invite landing: preview the workspace, then the user must approve before joining.
 * Signed-out users sign in / sign up first; signed-in users confirm explicitly (no auto-accept).
 */
export function AcceptInvite({ token }: AcceptInviteProps) {
  const t = useTranslations('InviteAccept');
  const locale = useLocale();
  const router = useRouter();
  const { isSignedIn, isPending: authPending } = useAuth();
  const preview = useInvitePreview(token);
  const accept = useAcceptInvite();
  const roleLabel = useRoleLabel(preview.data?.roleName ?? '');

  const nextPath = `/invite/${encodeURIComponent(token)}`;
  const signInHref = `${ROUTES.signIn}?next=${encodeURIComponent(nextPath)}`;
  const signUpHref = `${ROUTES.signUp}?next=${encodeURIComponent(nextPath)}`;

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

  if (!isSignedIn) {
    return (
      <div className="flex flex-col gap-6">
        <InviteSummary
          title={t('title', { space: data.spaceName })}
          description={t('description', { role: roleLabel })}
          emailHint={
            data.kind === 'email' && data.email
              ? t('emailHint', { email: data.email })
              : null
          }
        />
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

  if (accept.isSuccess) {
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
          onClick={() => accept.reset()}
        >
          {t('tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <InviteSummary
        title={t('title', { space: data.spaceName })}
        description={t('confirmDescription', { role: roleLabel })}
        emailHint={
          data.kind === 'email' && data.email
            ? t('emailHintSignedIn', { email: data.email })
            : null
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          disabled={accept.isPending}
          onClick={() => {
            void accept
              .mutateAsync(token)
              .then((result) => {
                router.replace(`${ROUTES.space}/${result.spaceSlug}`);
                router.refresh();
              })
              .catch(() => {
                /* surfaced via accept.error */
              });
          }}
        >
          {accept.isPending ? t('joining') : t('accept')}
        </Button>
        <Link
          href={ROUTES.dashboard}
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          {t('decline')}
        </Link>
      </div>
    </div>
  );
}

function InviteSummary({
  title,
  description,
  emailHint,
}: {
  title: string;
  description: string;
  emailHint: string | null;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {emailHint ? (
        <p className="mt-2 text-sm text-muted-foreground">{emailHint}</p>
      ) : null}
    </div>
  );
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

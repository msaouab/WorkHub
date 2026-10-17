import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserMenu } from '../src/components/account/user-menu';

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  push: vi.fn(),
  user: {
    id: 'u1',
    name: 'Mia Member',
    email: 'mia@workhub.test',
    image: null as string | null,
  },
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: { name?: string }) => {
    if (key === 'open') {
      return `Account menu: ${values?.name ?? ''}`;
    }
    const map: Record<string, string> = {
      settings: 'Settings',
      signOut: 'Sign out',
      signingOut: 'Signing out…',
    };
    return map[key] ?? key;
  },
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: mocks.user,
    isSigningOut: false,
    signOut: mocks.signOut,
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('UserMenu', () => {
  beforeEach(() => {
    mocks.signOut.mockReset();
    mocks.push.mockReset();
  });

  it('renders name and email and calls signOut', () => {
    render(<UserMenu />, { wrapper });

    fireEvent.click(
      screen.getByRole('button', { name: 'Account menu: Mia Member' })
    );

    expect(screen.getByText('Mia Member')).toBeTruthy();
    expect(screen.getByText('mia@workhub.test')).toBeTruthy();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });
});

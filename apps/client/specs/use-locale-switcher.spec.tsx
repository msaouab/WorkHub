import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocaleSwitcher } from '../src/hooks/use-locale-switcher';
import { useUpdateMe } from '../src/hooks/use-update-me';
import { queryKeys } from '../src/lib/api/query-keys';
import en from '../src/messages/en.json';

const mocks = vi.hoisted(() => {
  const replace = vi.fn();
  const refresh = vi.fn();
  return {
    replace,
    refresh,
    router: { replace, refresh },
    useSession: vi.fn(),
    signOut: vi.fn(),
    updateMe: vi.fn(),
  };
});

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => mocks.router,
  usePathname: () => '/app',
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: mocks.useSession,
    signOut: mocks.signOut,
  },
}));

vi.mock('@/lib/api/me', () => ({
  updateMe: mocks.updateMe,
  fetchMe: vi.fn(),
}));

const savedUser = {
  id: '01932a1b-7c3d-7def-8000-000000000001',
  email: 'sara@workhub.test',
  name: 'Sara',
  emailVerified: true,
  image: null,
  locale: 'ar' as const,
};

function createWrapper(locale: 'en' | 'ar' | 'fr' = 'en') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale={locale} messages={en}>
          {children}
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
  }

  return { queryClient, Wrapper };
}

describe('useUpdateMe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useSession.mockReturnValue({ data: null, isPending: false });
  });

  it('writes the returned user into the me cache', async () => {
    mocks.updateMe.mockResolvedValue(savedUser);
    const { queryClient, Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateMe(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ locale: 'ar' });
    });

    expect(mocks.updateMe).toHaveBeenCalledWith({ locale: 'ar' });
    expect(queryClient.getQueryData(queryKeys.me)).toEqual(savedUser);
  });
});

describe('useLocaleSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('changes the URL without calling the API when signed out', async () => {
    mocks.useSession.mockReturnValue({ data: null, isPending: false });
    const { Wrapper } = createWrapper('en');
    const { result } = renderHook(() => useLocaleSwitcher(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.switchLocale('ar');
    });

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/app', { locale: 'ar' });
    });
    expect(mocks.updateMe).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('shows an error and stays on the page when the save fails', async () => {
    mocks.useSession.mockReturnValue({
      data: { user: { id: '1', email: 'sara@workhub.test', locale: 'en' } },
      isPending: false,
    });
    mocks.updateMe.mockRejectedValue(new Error('network'));
    const { Wrapper } = createWrapper('en');
    const { result } = renderHook(() => useLocaleSwitcher(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.switchLocale('fr');
    });

    await waitFor(() => {
      expect(result.current.error).toBe(en.Locale.saveFailed);
    });
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});

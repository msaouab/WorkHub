import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../src/hooks/use-auth';
import { useRequireAuth } from '../src/hooks/use-require-auth';
import { queryKeys } from '../src/lib/api/query-keys';

const mocks = vi.hoisted(() => {
  const replace = vi.fn();
  const refresh = vi.fn();
  return {
    replace,
    refresh,
    router: { replace, refresh },
    useSession: vi.fn(),
    signOut: vi.fn(),
  };
});

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => mocks.router,
  usePathname: () => '/dashboard',
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: mocks.useSession,
    signOut: mocks.signOut,
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { queryClient, Wrapper };
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useSession.mockReturnValue({
      data: { user: { id: '1', name: 'Sara', email: 'sara@workhub.test' } },
      isPending: false,
    });
  });

  it('clears the query cache and leaves the page after sign-out', async () => {
    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(queryKeys.me, { email: 'sara@workhub.test' });
    mocks.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(queryKeys.me)).toBeUndefined();
    expect(mocks.replace).toHaveBeenCalledWith('/sign-in');
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it('skips the auth-guard redirect while sign-out is in flight', async () => {
    let finishSignOut!: (value: { error: null }) => void;
    mocks.useSession.mockReturnValue({
      data: { user: { id: '1' } },
      isPending: false,
    });
    mocks.signOut.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSignOut = resolve;
        })
    );
    const { Wrapper } = createWrapper();
    const auth = renderHook(() => useAuth(), { wrapper: Wrapper });

    act(() => {
      void auth.result.current.signOut();
    });

    mocks.useSession.mockReturnValue({ data: null, isPending: false });
    renderHook(() => useRequireAuth(), { wrapper: Wrapper });

    expect(mocks.replace).not.toHaveBeenCalled();

    await act(async () => {
      finishSignOut({ error: null });
      await Promise.resolve();
    });

    expect(mocks.replace).toHaveBeenCalledOnce();
    expect(mocks.replace).toHaveBeenCalledWith('/sign-in');
  });

  it('keeps cached data when sign-out fails', async () => {
    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(queryKeys.me, { email: 'sara@workhub.test' });
    mocks.signOut.mockResolvedValue({ error: { message: 'network' } });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(queryClient.getQueryData(queryKeys.me)).toEqual({
      email: 'sara@workhub.test',
    });
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});

describe('useRequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to sign-in when there is no session', async () => {
    mocks.useSession.mockReturnValue({ data: null, isPending: false });
    const { Wrapper } = createWrapper();

    renderHook(() => useRequireAuth(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/sign-in');
    });
  });

  it('waits out a pending session before redirecting', async () => {
    mocks.useSession.mockReturnValue({ data: null, isPending: true });
    const { Wrapper } = createWrapper();

    const { rerender } = renderHook(() => useRequireAuth(), {
      wrapper: Wrapper,
    });

    expect(mocks.replace).not.toHaveBeenCalled();

    mocks.useSession.mockReturnValue({ data: null, isPending: false });
    rerender();

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/sign-in');
    });
  });

  it('stays on the page when a session exists', () => {
    mocks.useSession.mockReturnValue({
      data: { user: { id: '1' } },
      isPending: false,
    });
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useRequireAuth(), { wrapper: Wrapper });

    expect(result.current.isSignedIn).toBe(true);
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});

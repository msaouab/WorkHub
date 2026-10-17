import { renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useDirection } from '../src/hooks/use-direction';
import en from '../src/messages/en.json';

function wrapper(locale: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={en}>
        {children}
      </NextIntlClientProvider>
    );
  };
}

describe('useDirection', () => {
  it('returns rtl for Arabic', () => {
    const { result } = renderHook(() => useDirection(), {
      wrapper: wrapper('ar'),
    });
    expect(result.current).toBe('rtl');
  });

  it('returns ltr for English and French', () => {
    expect(
      renderHook(() => useDirection(), { wrapper: wrapper('en') }).result
        .current
    ).toBe('ltr');
    expect(
      renderHook(() => useDirection(), { wrapper: wrapper('fr') }).result
        .current
    ).toBe('ltr');
  });
});
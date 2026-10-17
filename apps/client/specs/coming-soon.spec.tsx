import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { ComingSoon } from '../src/components/shell/coming-soon';
import en from '../src/messages/en.json';

vi.mock('@/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('ComingSoon', () => {
  it('renders the translated feature name', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ComingSoon
          feature="leave"
          backHref="/s/acme"
          backLabel="Back"
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'My leave' })).toBeTruthy();
    expect(
      screen.getByText("We're building this. It'll be ready soon.")
    ).toBeTruthy();
  });
});

import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { Logo, LogoMark } from '../src/components/brand/logo';
import en from '../src/messages/en.json';

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('Logo', () => {
  it('renders the wordmark as text and hides the decorative mark', () => {
    const { container } = renderWithIntl(<Logo />);

    expect(screen.getByText(en.Site.brand)).toBeDefined();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true'
    );
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('exposes the standalone mark as an image when titled', () => {
    renderWithIntl(<LogoMark title={en.Site.brand} />);

    expect(screen.getByRole('img', { name: en.Site.brand })).toBeDefined();
  });

  it('uses the inverse palette on dark backgrounds', () => {
    const { container } = renderWithIntl(<Logo tone="inverse" />);

    expect(container.querySelector('rect')?.getAttribute('class')).toContain(
      'fill-white'
    );
    expect(container.firstElementChild?.getAttribute('class')).toContain(
      'text-white'
    );
  });
});

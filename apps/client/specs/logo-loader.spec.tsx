import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LogoLoader, PageLoader } from '../src/components/brand/logo-loader';
import ar from '../src/messages/ar.json';
import en from '../src/messages/en.json';

function renderWithIntl(ui: ReactElement, locale = 'en', messages = en) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('LogoLoader', () => {
  it('announces the translated loading label as a status', () => {
    renderWithIntl(<LogoLoader />);

    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toBe(en.Common.loading);
  });

  it('uses the active locale for the default label', () => {
    renderWithIntl(<LogoLoader />, 'ar', ar);

    expect(screen.getByRole('status').textContent).toBe(ar.Common.loading);
  });

  it('keeps the label screen-reader only unless showLabel is set', () => {
    const { rerender } = renderWithIntl(<LogoLoader label="Checking" />);
    expect(screen.getByText('Checking').className).toContain('sr-only');

    rerender(
      <NextIntlClientProvider locale="en" messages={en}>
        <LogoLoader label="Checking" showLabel />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Checking').className).not.toContain('sr-only');
  });

  it('hides the decorative mark and animates the line and each node', () => {
    const { container } = renderWithIntl(<LogoLoader />);

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('class')).toContain('motion-reduce:animate-logo-breathe');

    const path = container.querySelector('path');
    expect(path?.getAttribute('pathLength')).toBe('100');
    expect(path?.getAttribute('class')).toContain('motion-safe:animate-logo-draw');

    const nodes = Array.from(container.querySelectorAll('circle'));
    expect(nodes.map((node) => node.getAttribute('class'))).toEqual([
      expect.stringContaining('motion-safe:animate-logo-node-1'),
      expect.stringContaining('motion-safe:animate-logo-node-2'),
      expect.stringContaining('motion-safe:animate-logo-node-3'),
    ]);
  });

  it('switches to the inverse palette', () => {
    const { container } = renderWithIntl(<LogoLoader tone="inverse" />);

    expect(container.querySelector('rect')?.getAttribute('class')).toContain(
      'fill-white'
    );
  });
});

describe('PageLoader', () => {
  it('shows a visible label in a full-height container', () => {
    const { container } = renderWithIntl(<PageLoader />);

    expect(screen.getByText(en.Common.loading).className).not.toContain(
      'sr-only'
    );
    expect(container.firstElementChild?.className).toContain('min-h-svh');
  });
});

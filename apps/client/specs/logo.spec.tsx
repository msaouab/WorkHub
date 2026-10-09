import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo, LogoMark } from '../src/components/brand/logo';
import { site } from '../src/content/site';

describe('Logo', () => {
  it('renders the wordmark as text and hides the decorative mark', () => {
    const { container } = render(<Logo />);

    expect(screen.getByText(site.brand)).toBeDefined();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true'
    );
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('exposes the standalone mark as an image when titled', () => {
    render(<LogoMark title={site.brand} />);

    expect(screen.getByRole('img', { name: site.brand })).toBeDefined();
  });

  it('uses the inverse palette on dark backgrounds', () => {
    const { container } = render(<Logo tone="inverse" />);

    expect(container.querySelector('rect')?.getAttribute('class')).toContain(
      'fill-white'
    );
    expect(container.firstElementChild?.getAttribute('class')).toContain(
      'text-white'
    );
  });
});

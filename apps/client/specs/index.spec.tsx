import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '../src/components/landing/hero';
import en from '../src/messages/en.json';

vi.mock('next/image', () => ({
  default: (props: { alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt} />;
  },
}));

vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace: string) => {
    return (key: string) => {
      const parts = `${namespace}.${key}`.split('.');
      let cur: unknown = en;
      for (const part of parts) {
        cur = (cur as Record<string, unknown>)[part];
      }
      return cur as string;
    };
  },
}));

describe('Hero', () => {
  it('should render WorkHub landing hero copy', async () => {
    render(await Hero());

    expect(screen.getAllByText(en.Landing.hero.brand).length).toBeGreaterThan(
      0
    );
    expect(
      screen.getByRole('heading', { name: en.Landing.hero.title })
    ).toBeDefined();
  });
});

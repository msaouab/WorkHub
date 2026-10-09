import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProviders } from '../src/components/providers/app-providers';
import Page from '../src/app/page';

describe('Page', () => {
  it('should render WorkHub starter', () => {
    render(
      <AppProviders>
        <Page />
      </AppProviders>
    );

    expect(screen.getByText('WorkHub')).toBeDefined();
    expect(screen.getByText('Join a space')).toBeDefined();
  });
});

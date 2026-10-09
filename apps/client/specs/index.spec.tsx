import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from '../src/app/page';

describe('Page', () => {
  it('should render WorkHub landing', () => {
    render(<Page />);

    expect(screen.getAllByText('WorkHub').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: /Leave and papers, in one place/i })
    ).toBeDefined();
    expect(
      screen.getByRole('heading', {
        name: /Built for teams that outgrew the spreadsheet/i,
      })
    ).toBeDefined();
    expect(screen.getAllByText('Agencies').length).toBeGreaterThan(0);
    expect(
      screen.getByLabelText(/< 10 min: to onboard a ~20-person company/i)
    ).toBeDefined();
    expect(
      screen.getByLabelText(/300\+: members supported per company space/i)
    ).toBeDefined();
    expect(
      screen.getByLabelText(/4: roles — owner, admin, manager, employee/i)
    ).toBeDefined();
  });
});

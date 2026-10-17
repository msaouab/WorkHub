import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { PasswordInput } from '../src/components/ui/password-input';
import en from '../src/messages/en.json';

describe('PasswordInput', () => {
  it('toggles field type and accessible label', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <PasswordInput id="pwd" name="password" aria-label="Password" />
      </NextIntlClientProvider>
    );

    const input = screen.getByLabelText('Password');
    expect(input.getAttribute('type')).toBe('password');

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));

    expect(input.getAttribute('type')).toBe('text');
    expect(
      screen.getByRole('button', { name: 'Hide password' })
    ).toBeTruthy();
  });
});

import { describe, expect, it } from 'vitest';
import { colorFromId, initialsFromName } from '../src/lib/initials';

describe('initialsFromName', () => {
  it('handles one word, two words, Arabic, and empty', () => {
    expect(initialsFromName('Sara')).toBe('S');
    expect(initialsFromName('Sara Benali')).toBe('SB');
    expect(initialsFromName('محمد علي')).toBe('مع');
    expect(initialsFromName('')).toBe('?');
    expect(initialsFromName('   ')).toBe('?');
  });
});

describe('colorFromId', () => {
  it('is stable for the same id', () => {
    expect(colorFromId('user-1')).toBe(colorFromId('user-1'));
    expect(colorFromId('user-1')).not.toBe(colorFromId('user-2'));
  });
});

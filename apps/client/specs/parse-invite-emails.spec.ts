import { describe, expect, it } from 'vitest';
import { parseInviteEmails } from '../src/lib/team/parse-invite-emails';

describe('parseInviteEmails', () => {
  it('splits on comma, space, and newline', () => {
    expect(parseInviteEmails('a@t.com, b@t.com\nc@t.com')).toEqual([
      'a@t.com',
      'b@t.com',
      'c@t.com',
    ]);
  });

  it('dedupes case-insensitively and trims', () => {
    expect(parseInviteEmails('  A@t.com ; a@t.com,  ')).toEqual(['A@t.com']);
  });

  it('returns empty for blank input', () => {
    expect(parseInviteEmails('  \n , ')).toEqual([]);
  });
});

import { listSpaceMembersResponseSchema } from '@work-hub/contracts';
import { describe, expect, it } from 'vitest';

describe('listSpaceMembersResponseSchema', () => {
  it('parses a cursor page of members', () => {
    const parsed = listSpaceMembersResponseSchema.parse({
      items: [
        {
          id: '01936b3c-0000-7000-8000-000000000001',
          userId: '01936b3c-0000-7000-8000-000000000002',
          name: 'Mia Member',
          email: 'mia@workhub.test',
          image: null,
          role: {
            id: '01936b3c-0000-7000-8000-000000000003',
            name: 'Member',
            permissions: [
              'members.read',
              'calendar.read',
              'requests.create',
              'profile.write',
            ],
          },
          membershipStatus: 'active',
          createdAt: '2026-10-17T12:00:00.000Z',
        },
      ],
      nextCursor: null,
    });
    expect(parsed.items).toHaveLength(1);
    expect(parsed.nextCursor).toBeNull();
  });
});

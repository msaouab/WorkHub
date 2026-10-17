import { describe, expect, it } from 'vitest';
import {
  listSpaceMembersQuerySchema,
  listSpaceMembersResponseSchema,
  spaceMemberSchema,
} from './members';

const sampleMember = {
  id: '01936b1e-8c0a-7b2e-9f3d-4a5b6c7d8e9f',
  userId: '01936b1e-8c0a-7b2e-9f3d-4a5b6c7d8e90',
  name: 'Mia Member',
  email: 'member@workhub.test',
  image: null,
  role: {
    id: '01936b1e-8c0a-7b2e-9f3d-4a5b6c7d8e91',
    name: 'Member',
  },
  membershipStatus: 'active' as const,
  createdAt: '2026-10-17T12:00:00.000Z',
};

describe('listSpaceMembersQuerySchema', () => {
  it('defaults limit and accepts optional cursor and q', () => {
    expect(listSpaceMembersQuerySchema.parse({})).toEqual({ limit: 20 });
    expect(
      listSpaceMembersQuerySchema.parse({
        cursor: 'abc',
        limit: '10',
        q: '  mia  ',
      })
    ).toEqual({ cursor: 'abc', limit: 10, q: 'mia' });
  });

  it('rejects empty q and oversized limit', () => {
    expect(() => listSpaceMembersQuerySchema.parse({ q: '   ' })).toThrow();
    expect(() => listSpaceMembersQuerySchema.parse({ limit: 101 })).toThrow();
  });
});

describe('spaceMemberSchema', () => {
  it('accepts a full member row', () => {
    expect(spaceMemberSchema.parse(sampleMember)).toEqual(sampleMember);
  });

  it('rejects unknown membership status', () => {
    expect(() =>
      spaceMemberSchema.parse({ ...sampleMember, membershipStatus: 'banned' })
    ).toThrow();
  });
});

describe('listSpaceMembersResponseSchema', () => {
  it('accepts a page with null nextCursor', () => {
    expect(
      listSpaceMembersResponseSchema.parse({
        items: [sampleMember],
        nextCursor: null,
      })
    ).toEqual({ items: [sampleMember], nextCursor: null });
  });
});

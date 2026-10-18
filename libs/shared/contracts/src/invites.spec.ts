import { describe, expect, it } from 'vitest';
import {
  createSpaceEmailInvitesResponseSchema,
  createSpaceInviteSchema,
  invitePreviewSchema,
  listSpaceInvitesQuerySchema,
  spaceInviteSchema,
} from './invites';

const sampleInvite = {
  id: '01936b1e-8c0a-7b2e-9f3d-4a5b6c7d8e9f',
  kind: 'email' as const,
  email: 'mia@workhub.test',
  role: {
    id: '01936b1e-8c0a-7b2e-9f3d-4a5b6c7d8e91',
    name: 'Member',
  },
  expiresAt: '2026-10-24T12:00:00.000Z',
  maxUses: 1,
  uses: 0,
  revokedAt: null,
  createdAt: '2026-10-17T12:00:00.000Z',
  createdBy: {
    id: '01936b1e-8c0a-7b2e-9f3d-4a5b6c7d8e92',
    name: 'Alex',
  },
};

describe('createSpaceInviteSchema', () => {
  it('accepts email invites and link invites with defaults', () => {
    expect(
      createSpaceInviteSchema.parse({
        kind: 'email',
        email: 'mia@workhub.test',
      })
    ).toEqual({
      kind: 'email',
      email: 'mia@workhub.test',
      maxUses: 10,
      expiresInDays: 7,
    });

    expect(
      createSpaceInviteSchema.parse({
        kind: 'email',
        emails: ['a@test.local', 'b@test.local'],
      })
    ).toMatchObject({
      kind: 'email',
      emails: ['a@test.local', 'b@test.local'],
    });

    expect(createSpaceInviteSchema.parse({ kind: 'link' })).toEqual({
      kind: 'link',
      maxUses: 10,
      expiresInDays: 7,
    });
  });

  it('rejects email invites without an address and invalid link limits', () => {
    expect(() =>
      createSpaceInviteSchema.parse({ kind: 'email' })
    ).toThrow();
    expect(() =>
      createSpaceInviteSchema.parse({ kind: 'link', maxUses: 0 })
    ).toThrow();
    expect(() =>
      createSpaceInviteSchema.parse({ kind: 'link', expiresInDays: 100 })
    ).toThrow();
    expect(() =>
      createSpaceInviteSchema.parse({
        kind: 'email',
        emails: Array.from({ length: 51 }, (_, i) => `u${i}@t.local`),
      })
    ).toThrow();
  });
});

describe('listSpaceInvitesQuerySchema', () => {
  it('defaults limit and status', () => {
    expect(listSpaceInvitesQuerySchema.parse({})).toEqual({
      limit: 20,
      status: 'pending',
    });
  });
});

describe('spaceInviteSchema / invitePreviewSchema', () => {
  it('parses list and preview shapes', () => {
    expect(spaceInviteSchema.parse(sampleInvite)).toEqual(sampleInvite);
    expect(
      invitePreviewSchema.parse({
        spaceName: 'Acme',
        spaceSlug: 'acme',
        roleName: 'Member',
        kind: 'link',
        email: null,
        expiresAt: '2026-10-24T12:00:00.000Z',
      })
    ).toMatchObject({ spaceSlug: 'acme', kind: 'link' });
    expect(
      createSpaceEmailInvitesResponseSchema.parse({
        results: [
          { email: 'mia@workhub.test', status: 'created', invite: sampleInvite },
          { email: 'bob@workhub.test', status: 'already_member' },
        ],
      }).results
    ).toHaveLength(2);
  });
});

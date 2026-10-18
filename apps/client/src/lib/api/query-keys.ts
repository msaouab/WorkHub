export const queryKeys = {
  me: ['me'] as const,
  spaces: {
    all: ['spaces'] as const,
    detail: (slug: string) => ['spaces', slug] as const,
  },
  members: {
    all: (spaceId: string) => ['members', spaceId] as const,
    list: (
      spaceId: string,
      q: string,
      status = '',
      role = ''
    ) => ['members', spaceId, q, status, role] as const,
  },
  invites: {
    all: (spaceId: string) => ['invites', spaceId] as const,
    list: (spaceId: string, status = 'pending') =>
      ['invites', spaceId, 'list', status] as const,
    roles: (spaceId: string) => ['invites', spaceId, 'roles'] as const,
    preview: (token: string) => ['invites', 'preview', token] as const,
  },
  teams: {
    all: (spaceId: string) => ['teams', spaceId] as const,
  },
} as const;

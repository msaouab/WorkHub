export const queryKeys = {
  me: ['me'] as const,
  spaces: {
    all: ['spaces'] as const,
    detail: (slug: string) => ['spaces', slug] as const,
  },
  members: {
    all: (spaceId: string) => ['members', spaceId] as const,
    list: (spaceId: string, q: string) => ['members', spaceId, q] as const,
  },
} as const;

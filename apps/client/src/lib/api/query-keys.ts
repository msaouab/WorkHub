export const queryKeys = {
  me: ['me'] as const,
  spaces: {
    all: ['spaces'] as const,
    detail: (slug: string) => ['spaces', slug] as const,
  },
} as const;

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MeResponse, UpdateMe } from '@work-hub/contracts';
import { updateMe } from '@/lib/api/me';
import { queryKeys } from '@/lib/api/query-keys';

export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateMe) => updateMe(body),
    onSuccess: (user: MeResponse) => {
      queryClient.setQueryData(queryKeys.me, user);
    },
  });
}

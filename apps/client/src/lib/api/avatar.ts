import { meResponseSchema, type MeResponse } from '@work-hub/contracts';
import { apiFetch } from '@/lib/api/fetch';

export async function uploadAvatar(file: Blob): Promise<MeResponse> {
  const form = new FormData();
  form.append('file', file, 'avatar.webp');
  const data = await apiFetch<unknown>('me/avatar', {
    method: 'PUT',
    body: form,
  });
  return meResponseSchema.parse(data);
}

export async function deleteAvatar(): Promise<void> {
  await apiFetch<void>('me/avatar', { method: 'DELETE' });
}

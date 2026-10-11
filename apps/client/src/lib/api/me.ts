import {
  meResponseSchema,
  updateMeSchema,
  type MeResponse,
  type UpdateMe,
} from '@work-hub/contracts';
import { apiFetch } from '@/lib/api/fetch';

export async function fetchMe(): Promise<MeResponse> {
  const data = await apiFetch<unknown>('me');
  return meResponseSchema.parse(data);
}

export async function updateMe(body: UpdateMe): Promise<MeResponse> {
  const payload = updateMeSchema.parse(body);
  const data = await apiFetch<unknown>('me', { method: 'PATCH', body: payload });
  return meResponseSchema.parse(data);
}

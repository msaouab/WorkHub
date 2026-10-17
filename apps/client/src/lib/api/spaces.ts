import {
  createSpaceSchema,
  meSpacesResponseSchema,
  patchSpaceCoverSchema,
  spaceResponseSchema,
  type CreateSpace,
  type MeSpacesResponse,
  type PatchSpaceCover,
  type SpaceResponse,
} from '@work-hub/contracts';
import { apiFetch } from '@/lib/api/fetch';

export async function fetchMeSpaces(): Promise<MeSpacesResponse> {
  const data = await apiFetch<unknown>('me/spaces');
  return meSpacesResponseSchema.parse(data);
}

export async function createSpace(body: CreateSpace): Promise<SpaceResponse> {
  const payload = createSpaceSchema.parse(body);
  const data = await apiFetch<unknown>('spaces', {
    method: 'POST',
    body: payload,
  });
  return spaceResponseSchema.parse(data);
}

export async function uploadSpaceLogo(
  spaceId: string,
  file: File
): Promise<SpaceResponse> {
  const form = new FormData();
  form.append('file', file);
  const data = await apiFetch<unknown>(`spaces/${spaceId}/logo`, {
    method: 'PUT',
    body: form,
  });
  return spaceResponseSchema.parse(data);
}

export async function deleteSpaceLogo(spaceId: string): Promise<void> {
  await apiFetch<void>(`spaces/${spaceId}/logo`, { method: 'DELETE' });
}

export async function uploadSpaceCover(
  spaceId: string,
  file: File
): Promise<SpaceResponse> {
  const form = new FormData();
  form.append('file', file);
  const data = await apiFetch<unknown>(`spaces/${spaceId}/cover`, {
    method: 'PUT',
    body: form,
  });
  return spaceResponseSchema.parse(data);
}

export async function patchSpaceCover(
  spaceId: string,
  body: PatchSpaceCover
): Promise<SpaceResponse> {
  const payload = patchSpaceCoverSchema.parse(body);
  const data = await apiFetch<unknown>(`spaces/${spaceId}/cover`, {
    method: 'PATCH',
    body: payload,
  });
  return spaceResponseSchema.parse(data);
}

export async function deleteSpaceCover(spaceId: string): Promise<void> {
  await apiFetch<void>(`spaces/${spaceId}/cover`, { method: 'DELETE' });
}

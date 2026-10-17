import { APIError } from 'better-auth/api';

/**
 * WH-050: reject `image` on Better Auth `/update-user`.
 * Clients must use `PUT /api/v1/me/avatar` instead (any URL would be trusted otherwise).
 */
export function rejectClientImageUpdate(body: unknown): void {
  if (body && typeof body === 'object' && 'image' in body) {
    throw new APIError('BAD_REQUEST', {
      message: 'Use PUT /api/v1/me/avatar to change your profile picture',
    });
  }
}

/**
 * WH-050: drop `image` from Better Auth `/update-user` payloads so clients
 * cannot set an arbitrary URL. Avatar uploads go through PUT /me/avatar.
 */
export function stripClientImageUpdate<T extends Record<string, unknown>>(
  user: T
): Omit<T, 'image'> {
  if (!Object.prototype.hasOwnProperty.call(user, 'image')) {
    return user;
  }
  const { image: _ignored, ...data } = user;
  return data;
}

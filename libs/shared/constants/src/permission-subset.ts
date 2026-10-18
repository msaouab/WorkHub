/** True when every permission in `granted` also appears in `actor`. */
export function permissionsAreSubset(
  granted: readonly string[],
  actor: readonly string[]
): boolean {
  const allowed = new Set(actor);
  return granted.every((permission) => allowed.has(permission));
}

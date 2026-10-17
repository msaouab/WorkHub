/**
 * Stable API error codes (SRS: RFC 9457 problem JSON `code` field).
 * Add codes with their feature modules — do not invent ad-hoc strings in filters.
 */
export const ErrorCode = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  BAD_REQUEST: 'BAD_REQUEST',
  IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
  IMAGE_UNSUPPORTED_TYPE: 'IMAGE_UNSUPPORTED_TYPE',
  IMAGE_TOO_SMALL: 'IMAGE_TOO_SMALL',
  /** Owner membership cannot be deactivated, reactivated, or removed. */
  CANNOT_MODIFY_OWNER: 'CANNOT_MODIFY_OWNER',
  /** Actor tried to deactivate their own membership. */
  CANNOT_DEACTIVATE_SELF: 'CANNOT_DEACTIVATE_SELF',
  /** Actor tried DELETE :id on themselves; use leave instead. */
  CANNOT_REMOVE_SELF: 'CANNOT_REMOVE_SELF',
  /** Last Owner tried to leave before transferring ownership. */
  LAST_OWNER: 'LAST_OWNER',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

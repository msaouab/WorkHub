import { Throttle, seconds } from '@nestjs/throttler';

/**
 * Apply on POST /auth/login (and similar) when the auth module lands.
 * Overrides the global default throttler to 5 requests / minute / IP (NFR-06).
 *
 * @example
 * ```ts
 * @Post('login')
 * @AuthLoginThrottle()
 * login() { ... }
 * ```
 */
export const AuthLoginThrottle = () =>
  Throttle({ default: { limit: 5, ttl: seconds(60) } });

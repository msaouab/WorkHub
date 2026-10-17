import { z } from 'zod';

/** Cursor pagination query (SRS: ?cursor=&limit=, max 100). */
export const cursorPaginationQuerySchema = z
  .object({
    cursor: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .meta({ id: 'CursorPaginationQuery' });

export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;

/**
 * Reusable page envelope for cursor lists (items + opaque nextCursor).
 * Callers name the schema (e.g. `.meta({ id: 'ListSpaceMembersResponse' })`);
 * do not put a shared id here — Zod 4 rejects duplicate registry ids.
 */
export function cursorPageSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().min(1).nullable(),
  });
}

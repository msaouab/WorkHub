import { z } from 'zod';

/** Cursor pagination query (SRS: ?cursor=&limit=, max 100). */
export const cursorPaginationQuerySchema = z
  .object({
    cursor: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .meta({ id: 'CursorPaginationQuery' });

export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;

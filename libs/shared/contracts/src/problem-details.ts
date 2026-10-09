import { ErrorCode } from '@work-hub/constants';
import { z } from 'zod';

const errorCodeValues = Object.values(ErrorCode) as [
  (typeof ErrorCode)[keyof typeof ErrorCode],
  ...(typeof ErrorCode)[keyof typeof ErrorCode][],
];

/** RFC 9457 problem details + WorkHub stable `code` (SRS API conventions). */
export const problemDetailsSchema = z
  .object({
    type: z.string().url(),
    title: z.string().min(1),
    status: z.number().int().min(100).max(599),
    detail: z.string().optional(),
    instance: z.string().optional(),
    code: z.enum(errorCodeValues),
    errors: z
      .array(
        z.object({
          path: z.string(),
          message: z.string(),
        })
      )
      .optional(),
  })
  .meta({ id: 'ProblemDetails' });

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

export const PROBLEM_JSON_CONTENT_TYPE = 'application/problem+json';

import { z } from 'zod';

export const joinSpaceSchema = z.object({
  email: z.string().email('Enter a valid work email'),
  inviteCode: z
    .string()
    .min(6, 'Invite code must be at least 6 characters')
    .max(32, 'Invite code is too long'),
});

export type JoinSpaceInput = z.infer<typeof joinSpaceSchema>;

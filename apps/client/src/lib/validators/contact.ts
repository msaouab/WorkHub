import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid work email'),
  company: z.string().trim().min(2, 'Enter your company name'),
  message: z
    .string()
    .trim()
    .min(10, 'Tell us a bit more (at least 10 characters)')
    .max(2000, 'Message is too long'),
});

export type ContactInput = z.infer<typeof contactSchema>;

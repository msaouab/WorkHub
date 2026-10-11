import { z } from 'zod';

type Translate = (key: string) => string;

export function createContactSchema(t: Translate) {
  return z.object({
    name: z.string().trim().min(2, t('fullName')),
    email: z.email(t('workEmail')),
    company: z.string().trim().min(2, t('company')),
    message: z
      .string()
      .trim()
      .min(10, t('messageMin'))
      .max(2000, t('messageMax')),
  });
}

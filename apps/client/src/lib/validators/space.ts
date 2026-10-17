import { z } from 'zod';

type Translate = (key: string, values?: Record<string, string | number>) => string;

/** Client create-workspace schema with translated messages (WH-041). */
export function createSpaceFormSchema(t: Translate) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('spaceNameMin'))
      .max(80, t('spaceNameMax')),
    slug: z
      .string()
      .min(2, t('spaceSlugMin'))
      .max(48, t('spaceSlugMax'))
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        t('spaceSlugFormat')
      ),
  });
}

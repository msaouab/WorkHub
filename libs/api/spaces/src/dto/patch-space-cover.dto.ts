import { patchSpaceCoverSchema } from '@work-hub/contracts';
import { createZodDto } from 'nestjs-zod';

export class PatchSpaceCoverDto extends createZodDto(patchSpaceCoverSchema) {}
